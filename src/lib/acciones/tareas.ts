"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { EstadoAccion } from "@/lib/acciones/tipos";
import { esFecha } from "@/lib/agenda/fechas";
import { esPrioridad } from "@/lib/tareas/opciones";
import { obtenerUsuarioActual } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";

const SIN_PERMISO = "No puedes cambiar esta tarea: es de otra persona del equipo.";
const uuid = z.uuid();
const opcional = z.union([z.uuid(), z.literal("")]).transform((v) => (v === "" ? null : v));

// Todo el CRM, porque el numerito de "Tareas" está en el menú de todas las pantallas
function refrescar() {
  revalidatePath("/", "layout");
}

function mensajeError(error: { code?: string }, porDefecto: string) {
  if (error.code === "42501") return SIN_PERMISO;
  if (error.code === "23503") return "El cliente o el responsable elegido ya no existe.";
  return porDefecto;
}

const esquemaTarea = z.object({
  title: z.string().trim().min(1, "Escribe qué hay que hacer.").max(200, "El texto es muy largo (máximo 200)."),
  due_date: z
    .string()
    .refine((v) => v === "" || esFecha(v), "La fecha no es válida.")
    .transform((v) => (v === "" ? null : v)),
  priority: z.string().refine(esPrioridad, "Elige la prioridad."),
  client_id: opcional,
  assigned_to: opcional,
  notes: z
    .string()
    .trim()
    .max(2000, "Las notas son muy largas (máximo 2000).")
    .transform((v) => (v === "" ? null : v)),
});

// Crear o editar una tarea. El vendedor se la asigna a sí mismo; el administrador puede elegir a otra persona.
export async function guardarTarea(_antes: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const yo = await obtenerUsuarioActual();
  if (!yo || yo.rol === "pendiente") return { error: "Tu cuenta no tiene permiso para esto." };
  const leer = (clave: string) => String(datos.get(clave) ?? "");
  const r = esquemaTarea.safeParse({
    title: leer("title"),
    due_date: leer("due_date"),
    priority: leer("priority") || "media",
    client_id: leer("client_id"),
    assigned_to: leer("assigned_to"),
    notes: leer("notes"),
  });
  if (!r.success) return { error: r.error.issues[0]?.message ?? "Revisa los datos de la tarea." };

  const { assigned_to, ...resto } = r.data;
  const responsable = yo.rol === "admin" && assigned_to ? assigned_to : yo.id;
  const supabase = await crearClienteServidor();
  const id = leer("id");

  if (id) {
    if (!uuid.safeParse(id).success) return { error: "Datos no válidos." };
    const cambios = yo.rol === "admin" ? { ...resto, assigned_to: responsable } : resto;
    const { data, error } = await supabase.from("tasks").update(cambios).eq("id", id).select("id");
    if (error) return { error: mensajeError(error, "No se pudo guardar la tarea.") };
    if (!data?.length) return { error: SIN_PERMISO };
    refrescar();
    redirect("/tareas");
  }

  const { error } = await supabase.from("tasks").insert({ ...resto, assigned_to: responsable });
  if (error) return { error: mensajeError(error, "No se pudo crear la tarea.") };
  refrescar();
  return { ok: "Tarea agregada." };
}

export async function marcarTarea(id: string, hecha: boolean): Promise<EstadoAccion> {
  const yo = await obtenerUsuarioActual();
  if (!yo || yo.rol === "pendiente") return { error: SIN_PERMISO };
  if (!uuid.safeParse(id).success || typeof hecha !== "boolean") return { error: "Datos no válidos." };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("tasks")
    .update({ done_at: hecha ? new Date().toISOString() : null })
    .eq("id", id)
    .select("id");
  if (error) return { error: mensajeError(error, "No se pudo cambiar la tarea.") };
  if (!data?.length) return { error: SIN_PERMISO };
  refrescar();
  return { ok: hecha ? "¡Tarea hecha!" : "La tarea volvió a pendientes." };
}

// Borrar una tarea (si "volver", después lleva a la lista de tareas)
export async function borrarTarea(id: string, volver = false): Promise<EstadoAccion> {
  const yo = await obtenerUsuarioActual();
  if (!yo || yo.rol === "pendiente") return { error: SIN_PERMISO };
  if (!uuid.safeParse(id).success) return { error: "Datos no válidos." };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("tasks").delete().eq("id", id).select("id");
  if (error) return { error: mensajeError(error, "No se pudo borrar la tarea.") };
  if (!data?.length) return { error: "Solo quien creó la tarea o un administrador puede borrarla." };
  refrescar();
  if (volver === true) redirect("/tareas");
  return { ok: "Tarea borrada." };
}
