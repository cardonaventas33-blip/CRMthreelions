// Tipos de visita de la agenda (como la referencia del dueño) y zonas de las sedes.
// Los colores de cada tipo son fijos a propósito (sirven igual en modo claro y oscuro).

export const TIPOS_CITA = {
  personal: { nombre: "Tu calendario", borde: "border-l-sky-500", punto: "bg-sky-500" },
  planificacion: { nombre: "Planificación inicial", borde: "border-l-stone-400", punto: "bg-stone-400" },
  no_planeada: { nombre: "Interacción no planeada", borde: "border-l-orange-400", punto: "bg-orange-400" },
  seguimiento: { nombre: "Seguimiento", borde: "border-l-violet-400", punto: "bg-violet-400" },
  cobro: { nombre: "Compromiso de pago", borde: "border-l-rose-500", punto: "bg-rose-500" },
} as const;

export type TipoCita = keyof typeof TIPOS_CITA;

export function esTipoCita(valor: unknown): valor is TipoCita {
  return typeof valor === "string" && valor in TIPOS_CITA;
}

export const ZONAS = {
  norte: "Norte",
  sur: "Sur",
  oriente: "Oriente",
  occidente: "Occidente",
  centro: "Centro",
} as const;

export type Zona = keyof typeof ZONAS;

// "CALI - NORTE"
export function textoLugar(ciudad: string | null | undefined, zona: string | null | undefined) {
  const nombreZona = zona && zona in ZONAS ? ZONAS[zona as Zona] : null;
  return [ciudad?.trim(), nombreZona].filter(Boolean).join(" - ").toUpperCase();
}
