"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { EstadoAccion } from "@/lib/acciones/tipos";
import { DURACIONES, diaSemana, esFecha, instanteColombia } from "@/lib/agenda/fechas";
import { HORAS } from "@/lib/clientes/opciones";
import { obtenerUsuarioActual } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";

const SIN_PERMISO = "No puedes cambiar esta cita: es de otra persona del equipo.";
const uuid = z.uuid();

function mensajeError(error: { code?: string }, porDefecto: string) {
  if (error.code === "42501") return SIN_PERMISO;
  if (error.code === "23503") return "El cliente o el responsable elegido ya no existe.";
  if (error.code === "23514") return "Revisa la hora y la duración de la cita.";
  return porDefecto;
}

function refrescar() {
  revalidatePath("/agenda", "layout");
  revalidatePath("/clientes", "layout");
  revalidatePath("/");
}

const opcional = z.union([z.uuid(), z.literal("")]).transform((v) => (v === "" ? null : v));

const esquemaCita = z.object({
  title: z.string().trim().min(1, "Escribe de qué es la cita (ej.: Visita).").max(200, "El título es muy largo."),
  fecha: z
    .string()
    .refine(esFecha, "Elige la fecha.")
    .refine((f) => diaSemana(f) !== 0, "La agenda va de lunes a sábado: elige otro día."),
  hora: z.string().refine((h) => HORAS.includes(h), "Elige la hora."),
  duracion: z.number().refine((m) => DURACIONES.some((d) => d.minutos === m), "Elige la duración."),
  client_id: opcional,
  user_id: opcional,
  notes: z
    .string()
    .trim()
    .max(2000, "Las notas son muy largas (máximo 2000 caracteres).")
    .transform((v) => (v === "" ? null : v)),
});

// Crear o editar una cita. El vendedor agenda a su nombre; el administrador puede elegir a otra persona.
export async function guardarCita(_antes: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const yo = await obtenerUsuarioActual();
  if (!yo || yo.rol === "pendiente") return { error: "Tu cuenta no tiene permiso para esto." };

  const leer = (clave: string) => String(datos.get(clave) ?? "");
  const r = esquemaCita.safeParse({
    title: leer("title"),
    fecha: leer("fecha"),
    hora: leer("hora"),
    duracion: Number(leer("duracion")),
    client_id: leer("client_id"),
    user_id: leer("user_id"),
    notes: leer("notes"),
  });
  if (!r.success) return { error: r.error.issues[0]?.message ?? "Revisa los datos de la cita." };

  const inicio = instanteColombia(r.data.fecha, r.data.hora);
  const fin = new Date(inicio.getTime() + r.data.duracion * 60_000);
  const fila = {
    title: r.data.title,
    start_at: inicio.toISOString(),
    end_at: fin.toISOString(),
    client_id: r.data.client_id,
    notes: r.data.notes,
  };
  const responsable = yo.rol === "admin" && r.data.user_id ? r.data.user_id : yo.id;

  const supabase = await crearClienteServidor();
  const id = leer("id");
  if (id) {
    if (!uuid.safeParse(id).success) return { error: "Datos no válidos." };
    // Solo el administrador cambia el responsable
    const cambios = yo.rol === "admin" ? { ...fila, user_id: responsable } : fila;
    const { data, error } = await supabase.from("appointments").update(cambios).eq("id", id).select("id");
    if (error) return { error: mensajeError(error, "No se pudo guardar la cita.") };
    if (!data?.length) return { error: SIN_PERMISO };
  } else {
    const { error } = await supabase.from("appointments").insert({ ...fila, user_id: responsable });
    if (error) return { error: mensajeError(error, "No se pudo crear la cita.") };
  }

  refrescar();
  redirect(`/agenda?dia=${r.data.fecha}`);
}

// Cancelar una cita (queda en la agenda tachada) o devolverla a la agenda
export async function cancelarCita(id: string, cancelar: boolean): Promise<EstadoAccion> {
  const yo = await obtenerUsuarioActual();
  if (!yo || yo.rol === "pendiente") return { error: SIN_PERMISO };
  if (!uuid.safeParse(id).success || typeof cancelar !== "boolean") return { error: "Datos no válidos." };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("appointments").update({ cancelled: cancelar }).eq("id", id).select("id");
  if (error) return { error: mensajeError(error, "No se pudo cambiar la cita.") };
  if (!data?.length) return { error: SIN_PERMISO };

  refrescar();
  return { ok: cancelar ? "Cita cancelada. Sigue en la agenda, tachada." : "La cita volvió a la agenda." };
}

// Borrar una cita creada por error
export async function borrarCita(id: string): Promise<EstadoAccion> {
  const yo = await obtenerUsuarioActual();
  if (!yo || yo.rol === "pendiente") return { error: SIN_PERMISO };
  if (!uuid.safeParse(id).success) return { error: "Datos no válidos." };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("appointments").delete().eq("id", id).select("start_at");
  if (error) return { error: mensajeError(error, "No se pudo borrar la cita.") };
  if (!data?.length) return { error: SIN_PERMISO };

  refrescar();
  redirect("/agenda");
}
