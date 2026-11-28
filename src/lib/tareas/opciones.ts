// Opciones de las tareas (sirven en el navegador y en el servidor)
import { conMayuscula, sumarDias, textoFecha } from "@/lib/agenda/fechas";

export const PRIORIDADES = {
  alta: { nombre: "Alta", clase: "bg-brand-soft text-brand" },
  media: { nombre: "Media", clase: "bg-warn-soft text-warn" },
  baja: { nombre: "Baja", clase: "bg-mist text-ink-soft" },
} as const;

export type Prioridad = keyof typeof PRIORIDADES;

export function esPrioridad(valor: unknown): valor is Prioridad {
  return typeof valor === "string" && valor in PRIORIDADES;
}

// Grupos de la lista de pendientes, en este orden
export const GRUPOS_TAREA = {
  vencidas: "Vencidas",
  hoy: "Para hoy",
  proximas: "Próximas",
  "sin-fecha": "Sin fecha",
} as const;

export type GrupoTarea = keyof typeof GRUPOS_TAREA;

export function grupoDe(fecha: string | null, hoy: string): GrupoTarea {
  if (!fecha) return "sin-fecha";
  if (fecha < hoy) return "vencidas";
  return fecha === hoy ? "hoy" : "proximas";
}

// "Hoy", "Mañana", "Sáb, 28 de nov" o "Venció el 25 de nov"
export function textoVence(fecha: string | null, hoy: string) {
  if (!fecha) return "Sin fecha";
  if (fecha === hoy) return "Hoy";
  if (fecha === sumarDias(hoy, 1)) return "Mañana";
  if (fecha === sumarDias(hoy, -1)) return "Venció ayer";
  const otroAnio = fecha.slice(0, 4) !== hoy.slice(0, 4) ? ({ year: "numeric" } as const) : {};
  if (fecha < hoy) return `Venció el ${textoFecha(fecha, { day: "numeric", month: "short", ...otroAnio })}`;
  return conMayuscula(textoFecha(fecha, { weekday: "short", day: "numeric", month: "short", ...otroAnio }));
}

// Una tarea lista para mostrar en la lista (la arma el servidor)
export type TareaFila = {
  id: string;
  title: string;
  notes: string | null;
  due_date: string | null;
  priority: Prioridad;
  /** Día (en Colombia) en que se marcó hecha; vacío = pendiente */
  hecha: string | null;
  cliente: { id: string; nombre: string } | null;
  /** Nombre del responsable, solo cuando conviene mostrarlo */
  responsable: string | null;
  /** Quién se la asignó, si fue otra persona */
  asignadaPor: string | null;
  puedeCambiar: boolean;
  puedeBorrar: boolean;
};
