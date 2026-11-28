// Fechas y horas de la agenda (navegador y servidor).
// Todo va en hora de Colombia: UTC-5 todo el año, sin horario de verano.
// Los días se manejan como texto "AAAA-MM-DD" para no confundirse con zonas horarias.

export const ZONA = "America/Bogota";
const DESFASE_MS = 5 * 60 * 60 * 1000;

// Hoy en Colombia: "2026-11-27"
export function hoyColombia(ahora = Date.now()) {
  return new Date(ahora - DESFASE_MS).toISOString().slice(0, 10);
}

export function esFecha(texto: unknown): texto is string {
  if (typeof texto !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const d = new Date(`${texto}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === texto;
}

// Día de la semana: 0 = domingo, 1 = lunes … 6 = sábado
export function diaSemana(fecha: string) {
  return new Date(`${fecha}T00:00:00Z`).getUTCDay();
}

export function sumarDias(fecha: string, dias: number) {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

// La agenda va de lunes a sábado: un domingo pasa al lunes
export function sinDomingo(fecha: string) {
  return diaSemana(fecha) === 0 ? sumarDias(fecha, 1) : fecha;
}

export function lunesDe(fecha: string) {
  const d = diaSemana(fecha);
  return sumarDias(fecha, d === 0 ? -6 : 1 - d);
}

// Primer día del mes de esa fecha, movido "paso" meses (−1 = mes anterior)
export function primerDiaDelMes(fecha: string, paso = 0) {
  const [anio, mes] = fecha.split("-").map(Number);
  return new Date(Date.UTC(anio, mes - 1 + paso, 1)).toISOString().slice(0, 10);
}

// Semanas (de lunes a sábado) que muestra el calendario del mes de esa fecha
export function semanasDelMes(fecha: string): string[][] {
  const mes = fecha.slice(0, 7);
  let lunes = lunesDe(primerDiaDelMes(fecha));
  const semanas: string[][] = [];
  for (let s = 0; s < 7; s++) {
    const semana = Array.from({ length: 6 }, (_, d) => sumarDias(lunes, d));
    if (semana.some((dia) => dia.startsWith(mes))) semanas.push(semana);
    lunes = sumarDias(lunes, 7);
  }
  return semanas;
}

// Número de la semana en el año (semana ISO, la que usan los calendarios): 9-nov-2026 → 46
export function semanaDelAnio(fecha: string) {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const inicioAnio = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - inicioAnio) / 86_400_000 + 1) / 7);
}

// Fecha y hora de Colombia → instante para guardar en la base
export function instanteColombia(fecha: string, hora: string) {
  return new Date(`${fecha}T${hora}:00-05:00`);
}

// Instante de la base → fecha y hora de Colombia ("2026-11-27", "09:30")
export function partesColombia(instante: string) {
  const texto = new Date(new Date(instante).getTime() - DESFASE_MS).toISOString();
  return { fecha: texto.slice(0, 10), hora: texto.slice(11, 16) };
}

export const conMayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

// "jueves, 27 de noviembre" a partir de "2026-11-27"
export function textoFecha(fecha: string, opciones: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("es-CO", { ...opciones, timeZone: "UTC" }).format(new Date(`${fecha}T12:00:00Z`));
}

// "9:00 a. m." a partir de un instante de la base
const formatoHora = new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit", timeZone: ZONA });
export function textoHora(instante: string) {
  return formatoHora.format(new Date(instante));
}

export const DURACIONES = [
  { minutos: 15, nombre: "15 minutos" },
  { minutos: 30, nombre: "30 minutos" },
  { minutos: 45, nombre: "45 minutos" },
  { minutos: 60, nombre: "1 hora" },
  { minutos: 90, nombre: "1 hora y media" },
  { minutos: 120, nombre: "2 horas" },
  { minutos: 180, nombre: "3 horas" },
  { minutos: 240, nombre: "4 horas" },
] as const;

export const TITULOS_SUGERIDOS = ["Visita", "Llamada", "Reunión", "Entrega de pedido", "Cobro", "Presentar catálogo"];

// Enlace que abre Google Calendar con la cita ya llena (el vendedor solo toca Guardar)
function fechaGoogle(instante: string) {
  return new Date(instante).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
export function enlaceGoogleCalendar(cita: { titulo: string; inicio: string; fin: string; detalles?: string; lugar?: string }) {
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: cita.titulo,
    dates: `${fechaGoogle(cita.inicio)}/${fechaGoogle(cita.fin)}`,
    ctz: ZONA,
  });
  if (cita.detalles) p.set("details", cita.detalles);
  if (cita.lugar) p.set("location", cita.lugar);
  return `https://calendar.google.com/calendar/render?${p}`;
}
