import "server-only";
import { cache } from "react";
import { partesColombia } from "@/lib/agenda/fechas";
import type { Prioridad, TareaFila } from "@/lib/tareas/opciones";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Tarea = {
  id: string;
  title: string;
  notes: string | null;
  due_date: string | null;
  priority: Prioridad;
  done_at: string | null;
  client_id: string | null;
  assigned_to: string;
  created_by: string;
  cliente: { id: string; name: string; trade_name: string | null } | null;
  responsable: { name: string; email: string } | null;
  creador: { name: string; email: string } | null;
};

const CAMPOS =
  "id, title, notes, due_date, priority, done_at, client_id, assigned_to, created_by, " +
  "cliente:clients!tasks_client_id_fkey(id, name, trade_name), " +
  "responsable:profiles!tasks_assigned_to_fkey(name, email), " +
  "creador:profiles!tasks_created_by_fkey(name, email)";

const ORDEN_PRIORIDAD: Record<Prioridad, number> = { alta: 0, media: 1, baja: 2 };

// Primero las de fecha más cercana (las sin fecha al final); en el mismo día, la de más prioridad
function ordenar(tareas: Tarea[]) {
  return tareas.sort(
    (a, b) =>
      (a.due_date ?? "9999-12-31").localeCompare(b.due_date ?? "9999-12-31") ||
      ORDEN_PRIORIDAD[a.priority] - ORDEN_PRIORIDAD[b.priority] ||
      a.title.localeCompare(b.title, "es"),
  );
}

// Tareas pendientes y, si se pide, las últimas hechas
export async function listarTareas(filtros: {
  usuarioId?: string;
  clienteId?: string;
  /** Solo pendientes con fecha hasta este día (para "hoy y vencidas") */
  hastaFecha?: string;
  hechas?: number;
}) {
  const supabase = await crearClienteServidor();

  let pendientes = supabase.from("tasks").select(CAMPOS).is("done_at", null).limit(500);
  if (filtros.usuarioId) pendientes = pendientes.eq("assigned_to", filtros.usuarioId);
  if (filtros.clienteId) pendientes = pendientes.eq("client_id", filtros.clienteId);
  if (filtros.hastaFecha) pendientes = pendientes.lte("due_date", filtros.hastaFecha);

  let hechas = supabase
    .from("tasks")
    .select(CAMPOS)
    .not("done_at", "is", null)
    .order("done_at", { ascending: false })
    .limit(Math.max(1, filtros.hechas ?? 1));
  if (filtros.usuarioId) hechas = hechas.eq("assigned_to", filtros.usuarioId);
  if (filtros.clienteId) hechas = hechas.eq("client_id", filtros.clienteId);

  const [p, h] = await Promise.all([pendientes, filtros.hechas ? hechas : Promise.resolve({ data: [], error: null })]);
  return {
    pendientes: ordenar((p.data ?? []) as unknown as Tarea[]),
    hechas: (h.data ?? []) as unknown as Tarea[],
    error: p.error || h.error ? "No se pudieron cargar las tareas." : null,
  };
}

export const obtenerTarea = cache(async (id: string): Promise<Tarea | null> => {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("tasks").select(CAMPOS).eq("id", id).maybeSingle();
  return (data as unknown as Tarea) ?? null;
});

// De la base a la fila que se muestra (con lo que cada quien puede hacer)
export function aFilaTarea(t: Tarea, yo: { id: string; rol: string } | null, mostrarResponsable: boolean): TareaFila {
  const esAdmin = yo?.rol === "admin";
  const nombre = (p: { name: string; email: string } | null) => p?.name || p?.email || "Alguien del equipo";
  return {
    id: t.id,
    title: t.title,
    notes: t.notes,
    due_date: t.due_date,
    priority: t.priority,
    hecha: t.done_at ? partesColombia(t.done_at).fecha : null,
    cliente: t.cliente ? { id: t.cliente.id, nombre: t.cliente.trade_name || t.cliente.name } : null,
    responsable: mostrarResponsable ? (t.assigned_to === yo?.id ? "Tú" : nombre(t.responsable)) : null,
    asignadaPor: t.created_by !== t.assigned_to && t.created_by !== yo?.id ? nombre(t.creador) : null,
    puedeCambiar: esAdmin || t.assigned_to === yo?.id || t.created_by === yo?.id,
    puedeBorrar: esAdmin || t.created_by === yo?.id,
  };
}
