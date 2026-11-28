"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  CARGOS,
  DIAS_PLAZO,
  DIAS_SEMANA,
  DOCUMENTOS,
  HORAS,
  PRODUCTOS_QUE_VENDE,
  TIPOS_INTERACCION,
  TIPOS_NEGOCIO,
  TRAFICO,
} from "@/lib/clientes/opciones";
import type { EstadoAccion } from "@/lib/acciones/tipos";
import { ZONAS } from "@/lib/agenda/opciones";
import { obtenerUsuarioActual } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";

const SIN_PERMISO = "Tu cuenta no tiene permiso para esto.";

// ---------- Ayudas de validación ----------
const leer = (datos: FormData, clave: string) => String(datos.get(clave) ?? "");

const textoRequerido = (max: number, mensaje: string) =>
  z.string().trim().min(1, mensaje).max(max, `Máximo ${max} caracteres.`);

const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres.`)
    .transform((v) => (v === "" ? null : v));

const enteroOpcional = (max: number, mensaje: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) <= max), mensaje)
    .transform((v) => (v === "" ? null : Number(v)));

const correoOpcional = z
  .string()
  .trim()
  .toLowerCase()
  .refine((v) => v === "" || z.email().safeParse(v).success, "Ese correo no es válido.")
  .transform((v) => (v === "" ? null : v));

const deLista = (lista: readonly string[], mensaje: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || lista.includes(v), mensaje)
    .transform((v) => (v === "" ? null : v));

const uuid = z.uuid({ error: "Datos no válidos." });

function primerError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Revisa los datos.";
}

function errorDeBase(codigo: string | undefined, porDefecto: string) {
  if (codigo === "23505") return "Ya existe un cliente con ese NIT o cédula.";
  if (codigo === "42501") return SIN_PERMISO;
  return porDefecto;
}

async function puedeTrabajar() {
  const yo = await obtenerUsuarioActual();
  return yo !== null && yo.rol !== "pendiente";
}

// NIT o cédula: solo números y guion ("900.123.456-7" → "900123456-7")
const nit = z
  .string()
  .trim()
  .transform((v) => v.replace(/[^\d-]/g, ""))
  .pipe(
    z
      .string()
      .min(5, "Escribe el NIT o la cédula (solo números).")
      .max(20, "El NIT o la cédula es muy largo."),
  );

// ---------- Empresa ----------
const esquemaEmpresa = z.object({
  name: textoRequerido(200, "Escribe la razón social."),
  nit_rut: nit,
  trade_name: textoOpcional(200),
  email: correoOpcional,
  phone: textoOpcional(30),
  address: textoOpcional(300),
  city: textoRequerido(80, "Escribe la ciudad."),
  business_type: deLista(TIPOS_NEGOCIO, "Elige un tipo de negocio de la lista."),
  employees: enteroOpcional(100000, "Empleados: escribe solo números."),
  payment_term_days: z.coerce
    .number()
    .refine((n) => DIAS_PLAZO.includes(n), "Elige un plazo de pago."),
  notes: textoOpcional(2000),
});

function leerEmpresa(datos: FormData) {
  return {
    name: leer(datos, "name"),
    nit_rut: leer(datos, "nit_rut"),
    trade_name: leer(datos, "trade_name"),
    email: leer(datos, "email"),
    phone: leer(datos, "phone"),
    address: leer(datos, "address"),
    city: leer(datos, "city"),
    business_type: leer(datos, "business_type"),
    employees: leer(datos, "employees"),
    payment_term_days: leer(datos, "payment_term_days") || "0",
    notes: leer(datos, "notes"),
  };
}

export async function crearCliente(_antes: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  if (!(await puedeTrabajar())) return { error: SIN_PERMISO };
  const r = esquemaEmpresa.safeParse(leerEmpresa(datos));
  if (!r.success) return { error: primerError(r.error) };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("clients").insert(r.data).select("id").single();
  if (error || !data) return { error: errorDeBase(error?.code, "No se pudo crear el cliente.") };

  revalidatePath("/clientes", "layout");
  redirect(`/clientes/${data.id}/editar?nuevo=1`);
}

export async function actualizarCliente(
  _antes: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  if (!(await puedeTrabajar())) return { error: SIN_PERMISO };
  const id = uuid.safeParse(leer(datos, "id"));
  if (!id.success) return { error: "Datos no válidos." };
  const r = esquemaEmpresa.safeParse(leerEmpresa(datos));
  if (!r.success) return { error: primerError(r.error) };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("clients").update(r.data).eq("id", id.data);
  if (error) return { error: errorDeBase(error.code, "No se pudieron guardar los datos.") };

  revalidatePath("/clientes", "layout");
  return { ok: "Datos de la empresa guardados." };
}

// Cliente importante (estrella en la agenda): solo el administrador (la base también lo revisa)
export async function marcarImportante(id: string, importante: boolean): Promise<EstadoAccion> {
  const yo = await obtenerUsuarioActual();
  if (yo?.rol !== "admin") return { error: "Solo un administrador marca clientes importantes." };
  if (!uuid.safeParse(id).success || typeof importante !== "boolean") return { error: "Datos no válidos." };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("clients").update({ is_key: importante }).eq("id", id).select("id");
  if (error || !data?.length) return { error: "No se pudo cambiar. Intenta de nuevo." };

  revalidatePath("/clientes", "layout");
  revalidatePath("/agenda", "layout");
  return { ok: importante ? "Marcado como cliente importante." : "Ya no está marcado como importante." };
}

export async function cambiarEstadoCliente(id: string, estado: string): Promise<EstadoAccion> {
  if (!(await puedeTrabajar())) return { error: SIN_PERMISO };
  const r = z
    .object({ id: uuid, estado: z.enum(["pendiente", "validado", "inactivo"]) })
    .safeParse({ id, estado });
  if (!r.success) return { error: "Datos no válidos." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("clients").update({ status: r.data.estado }).eq("id", r.data.id);
  if (error) return { error: errorDeBase(error.code, "No se pudo cambiar el estado.") };

  revalidatePath("/clientes", "layout");
  return {
    ok:
      r.data.estado === "validado"
        ? "Cliente marcado como validado."
        : r.data.estado === "inactivo"
          ? "Cliente marcado como inactivo."
          : "Cliente marcado como pendiente.",
  };
}

// ---------- Sedes ----------
const claveDias = DIAS_SEMANA.map((d) => d.clave);

const esquemaSede = z.object({
  client_id: uuid,
  name: textoRequerido(120, "Escribe el nombre de la sede."),
  address: textoRequerido(300, "Escribe la dirección de la sede."),
  city: textoRequerido(80, "Escribe la ciudad de la sede."),
  traffic: deLista(TRAFICO, "Elige el tráfico de la lista."),
  zone: deLista(Object.keys(ZONAS), "Elige la zona de la lista."),
  opens_at: deLista(HORAS, "Elige la hora de apertura de la lista."),
  closes_at: deLista(HORAS, "Elige la hora de cierre de la lista."),
  employees: enteroOpcional(100000, "Empleados de la sede: escribe solo números."),
  square_meters: enteroOpcional(10000000, "Metros cuadrados: escribe solo números."),
  notes: textoOpcional(2000),
  service_days: z.array(z.string()).refine((v) => v.every((d) => claveDias.includes(d)), "Días no válidos."),
  products: z
    .array(z.string())
    .refine((v) => v.every((p) => PRODUCTOS_QUE_VENDE.includes(p)), "Productos no válidos."),
});

export async function guardarSede(_antes: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  if (!(await puedeTrabajar())) return { error: SIN_PERMISO };
  const idSede = leer(datos, "id");
  const r = esquemaSede.safeParse({
    client_id: leer(datos, "client_id"),
    name: leer(datos, "name") || "Sede principal",
    address: leer(datos, "address"),
    city: leer(datos, "city"),
    traffic: leer(datos, "traffic"),
    zone: leer(datos, "zone"),
    opens_at: leer(datos, "opens_at"),
    closes_at: leer(datos, "closes_at"),
    employees: leer(datos, "employees"),
    square_meters: leer(datos, "square_meters"),
    notes: leer(datos, "notes"),
    service_days: datos.getAll("service_days").map(String),
    products: datos.getAll("products").map(String),
  });
  if (!r.success) return { error: primerError(r.error) };

  const supabase = await crearClienteServidor();
  if (idSede) {
    if (!uuid.safeParse(idSede).success) return { error: "Datos no válidos." };
    const { client_id, ...cambios } = r.data;
    const { error } = await supabase
      .from("client_sites")
      .update(cambios)
      .eq("id", idSede)
      .eq("client_id", client_id);
    if (error) return { error: errorDeBase(error.code, "No se pudo guardar la sede.") };
  } else {
    const { error } = await supabase.from("client_sites").insert(r.data);
    if (error) return { error: errorDeBase(error.code, "No se pudo crear la sede.") };
  }

  revalidatePath("/clientes", "layout");
  return { ok: idSede ? "Sede guardada." : "Sede agregada." };
}

export async function borrarSede(id: string, clienteId: string): Promise<EstadoAccion> {
  if (!(await puedeTrabajar())) return { error: SIN_PERMISO };
  if (!uuid.safeParse(id).success || !uuid.safeParse(clienteId).success) {
    return { error: "Datos no válidos." };
  }
  const supabase = await crearClienteServidor();
  const { data: sede } = await supabase
    .from("client_sites")
    .select("photo_url")
    .eq("id", id)
    .eq("client_id", clienteId)
    .maybeSingle();
  const { error } = await supabase.from("client_sites").delete().eq("id", id).eq("client_id", clienteId);
  if (error) return { error: errorDeBase(error.code, "No se pudo borrar la sede.") };
  if (sede?.photo_url) await supabase.storage.from("clientes").remove([sede.photo_url]);

  revalidatePath("/clientes", "layout");
  return { ok: "Sede borrada." };
}

// ---------- Contactos ----------
const esquemaContacto = z.object({
  client_id: uuid,
  site_id: z
    .string()
    .refine((v) => v === "" || uuid.safeParse(v).success, "Sede no válida.")
    .transform((v) => (v === "" ? null : v)),
  first_name: textoRequerido(80, "Escribe el nombre del contacto."),
  last_name: z.string().trim().max(80, "Máximo 80 caracteres."),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[^\d+]/g, ""))
    .pipe(z.string().min(7, "Escribe el teléfono del contacto.").max(20, "El teléfono es muy largo.")),
  email: correoOpcional,
  role_title: deLista(CARGOS, "Elige un cargo de la lista."),
  receives_sales: z.boolean(),
  receives_collections: z.boolean(),
});

export async function guardarContacto(_antes: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  if (!(await puedeTrabajar())) return { error: SIN_PERMISO };
  const idContacto = leer(datos, "id");
  const r = esquemaContacto.safeParse({
    client_id: leer(datos, "client_id"),
    site_id: leer(datos, "site_id"),
    first_name: leer(datos, "first_name"),
    last_name: leer(datos, "last_name"),
    phone: leer(datos, "phone"),
    email: leer(datos, "email"),
    role_title: leer(datos, "role_title"),
    receives_sales: datos.get("receives_sales") === "on",
    receives_collections: datos.get("receives_collections") === "on",
  });
  if (!r.success) return { error: primerError(r.error) };

  const supabase = await crearClienteServidor();
  if (idContacto) {
    if (!uuid.safeParse(idContacto).success) return { error: "Datos no válidos." };
    const { client_id, ...cambios } = r.data;
    const { error } = await supabase
      .from("client_contacts")
      .update(cambios)
      .eq("id", idContacto)
      .eq("client_id", client_id);
    if (error) return { error: errorDeBase(error.code, "No se pudo guardar el contacto.") };
  } else {
    const { error } = await supabase.from("client_contacts").insert(r.data);
    if (error) return { error: errorDeBase(error.code, "No se pudo crear el contacto.") };
  }

  revalidatePath("/clientes", "layout");
  return { ok: idContacto ? "Contacto guardado." : "Contacto agregado." };
}

export async function borrarContacto(id: string, clienteId: string): Promise<EstadoAccion> {
  if (!(await puedeTrabajar())) return { error: SIN_PERMISO };
  if (!uuid.safeParse(id).success || !uuid.safeParse(clienteId).success) {
    return { error: "Datos no válidos." };
  }
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("client_contacts").delete().eq("id", id).eq("client_id", clienteId);
  if (error) return { error: errorDeBase(error.code, "No se pudo borrar el contacto.") };

  revalidatePath("/clientes", "layout");
  return { ok: "Contacto borrado." };
}

// ---------- Documentos y fotos ----------
// El archivo ya se subió desde el navegador al almacén privado; aquí se
// guarda su ruta y se borra el archivo anterior.
const tiposArchivo = ["foto", ...DOCUMENTOS.map((d) => d.tipo)] as const;

function columnaDe(tipo: string) {
  if (tipo === "foto") return "photo_url";
  return DOCUMENTOS.find((d) => d.tipo === tipo)?.columna ?? null;
}

const esquemaArchivo = z.object({
  clienteId: uuid,
  tipo: z.enum([...tiposArchivo, "foto_sede"]),
  sedeId: z.uuid().nullable(),
});

export async function registrarArchivo(
  clienteId: string,
  tipo: string,
  ruta: string,
  sedeId: string | null = null,
): Promise<EstadoAccion> {
  if (!(await puedeTrabajar())) return { error: SIN_PERMISO };
  const r = esquemaArchivo.safeParse({ clienteId, tipo, sedeId });
  if (!r.success || !ruta.startsWith(`${clienteId}/`) || ruta.includes("..")) {
    return { error: "Datos no válidos." };
  }

  const supabase = await crearClienteServidor();
  let anterior: string | null = null;

  if (r.data.tipo === "foto_sede") {
    if (!r.data.sedeId) return { error: "Datos no válidos." };
    const { data: sede } = await supabase
      .from("client_sites")
      .select("photo_url")
      .eq("id", r.data.sedeId)
      .eq("client_id", clienteId)
      .maybeSingle();
    anterior = sede?.photo_url ?? null;
    const { error } = await supabase
      .from("client_sites")
      .update({ photo_url: ruta })
      .eq("id", r.data.sedeId)
      .eq("client_id", clienteId);
    if (error) return { error: errorDeBase(error.code, "No se pudo guardar la foto.") };
  } else {
    const columna = columnaDe(r.data.tipo);
    if (!columna) return { error: "Datos no válidos." };
    const { data: cliente } = await supabase.from("clients").select(columna).eq("id", clienteId).maybeSingle();
    anterior = (cliente as Record<string, string | null> | null)?.[columna] ?? null;
    const { error } = await supabase.from("clients").update({ [columna]: ruta }).eq("id", clienteId);
    if (error) return { error: errorDeBase(error.code, "No se pudo guardar el archivo.") };
  }

  if (anterior && anterior !== ruta) await supabase.storage.from("clientes").remove([anterior]);
  revalidatePath("/clientes", "layout");
  return { ok: "Archivo guardado." };
}

export async function quitarArchivo(
  clienteId: string,
  tipo: string,
  sedeId: string | null = null,
): Promise<EstadoAccion> {
  if (!(await puedeTrabajar())) return { error: SIN_PERMISO };
  const r = esquemaArchivo.safeParse({ clienteId, tipo, sedeId });
  if (!r.success) return { error: "Datos no válidos." };

  const supabase = await crearClienteServidor();
  let ruta: string | null = null;

  if (r.data.tipo === "foto_sede") {
    if (!r.data.sedeId) return { error: "Datos no válidos." };
    const { data: sede } = await supabase
      .from("client_sites")
      .select("photo_url")
      .eq("id", r.data.sedeId)
      .eq("client_id", clienteId)
      .maybeSingle();
    ruta = sede?.photo_url ?? null;
    await supabase.from("client_sites").update({ photo_url: null }).eq("id", r.data.sedeId);
  } else {
    const columna = columnaDe(r.data.tipo);
    if (!columna) return { error: "Datos no válidos." };
    const { data: cliente } = await supabase.from("clients").select(columna).eq("id", clienteId).maybeSingle();
    ruta = (cliente as Record<string, string | null> | null)?.[columna] ?? null;
    const { error } = await supabase.from("clients").update({ [columna]: null }).eq("id", clienteId);
    if (error) return { error: errorDeBase(error.code, "No se pudo quitar el archivo.") };
  }

  if (ruta) await supabase.storage.from("clientes").remove([ruta]);
  revalidatePath("/clientes", "layout");
  return { ok: "Archivo quitado." };
}

// ---------- Interacciones ----------
const esquemaInteraccion = z.object({
  client_id: uuid,
  type: z.enum(Object.keys(TIPOS_INTERACCION) as [string, ...string[]], { error: "Elige el tipo." }),
  note: textoRequerido(4000, "Escribe una nota de lo que hablaron."),
  // "2026-11-26T15:30" (hora de Colombia) → fecha con zona horaria
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Elige la fecha y la hora.")
    .transform((v) => `${v}:00-05:00`),
});

export async function registrarInteraccion(
  _antes: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  if (!(await puedeTrabajar())) return { error: SIN_PERMISO };
  const r = esquemaInteraccion.safeParse({
    client_id: leer(datos, "client_id"),
    type: leer(datos, "type"),
    note: leer(datos, "note"),
    date: leer(datos, "date"),
  });
  if (!r.success) return { error: primerError(r.error) };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("interactions").insert(r.data);
  if (error) return { error: errorDeBase(error.code, "No se pudo registrar la interacción.") };

  revalidatePath("/clientes", "layout");
  revalidatePath("/");
  return { ok: "Interacción registrada." };
}
