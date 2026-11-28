// Despachos: transportadoras, estados y el aviso por WhatsApp (sirven en el navegador y en el servidor)
import { partesColombia, sumarDias, textoFecha } from "@/lib/agenda/fechas";
import { tieneWhatsApp } from "@/lib/contacto";

export const TRANSPORTADORAS = ["Servientrega", "Coordinadora", "Interrapidísimo", "Envía", "TCC", "Deprisa"] as const;
export const ENTREGA_PROPIA = "Entrega propia";
export const OTRA_TRANSPORTADORA = "Otra";

// Por despachar → Despachado → Entregado (al entregar, el pedido queda completado)
export const ESTADOS_DESPACHO = {
  "por-despachar": { nombre: "Por despachar", clase: "bg-warn-soft text-warn" },
  despachado: { nombre: "Despachado", clase: "bg-sky-500/15 text-sky-700 dark:text-sky-300" },
  entregado: { nombre: "Entregado", clase: "bg-ok-soft text-ok" },
} as const;

export type EstadoDespacho = keyof typeof ESTADOS_DESPACHO;

export function estadoDespacho(pedido: { status: string; dispatched_at: string | null }): EstadoDespacho | null {
  if (pedido.status === "completado") return "entregado";
  if (pedido.status !== "enviado") return null;
  return pedido.dispatched_at ? "despachado" : "por-despachar";
}

// "hoy", "ayer" o "25 de nov" (según el día en Colombia)
export function diaCorto(instante: string, hoy: string) {
  const { fecha } = partesColombia(instante);
  if (fecha === hoy) return "hoy";
  if (fecha === sumarDias(hoy, -1)) return "ayer";
  const otroAnio = fecha.slice(0, 4) !== hoy.slice(0, 4) ? ({ year: "numeric" } as const) : {};
  return textoFecha(fecha, { day: "numeric", month: "short", ...otroAnio });
}

// "hoy", "ayer" o "el 25 de nov"
export function cuandoFue(instante: string, hoy: string) {
  const dia = diaCorto(instante, hoy);
  return dia === "hoy" || dia === "ayer" ? dia : `el ${dia}`;
}

type ClienteAviso = {
  name: string;
  trade_name: string | null;
  phone: string | null;
  contactos: { first_name: string; last_name: string; phone: string | null; receives_sales: boolean }[];
};

// A quién avisarle: primero el contacto comercial, luego otro contacto y al final el teléfono de la empresa
export function destinoAviso(cliente: ClienteAviso) {
  const contactos = [...cliente.contactos].sort((a, b) => Number(b.receives_sales) - Number(a.receives_sales));
  const contacto = contactos.find((c) => tieneWhatsApp(c.phone));
  if (contacto?.phone) {
    return { telefono: contacto.phone, nombre: `${contacto.first_name} ${contacto.last_name}`.trim(), saludo: `Hola ${contacto.first_name},` };
  }
  if (tieneWhatsApp(cliente.phone)) return { telefono: cliente.phone, nombre: cliente.trade_name || cliente.name, saludo: "Hola," };
  return null;
}

// El mensaje de "su pedido ya salió", con la transportadora y la guía
export function textoAvisoDespacho(
  pedido: { number: number; carrier: string | null; tracking_number: string | null; dispatched_at: string },
  saludo: string,
  firma: string,
  hoy: string,
) {
  const cuando = cuandoFue(pedido.dispatched_at, hoy);
  const propia = pedido.carrier === ENTREGA_PROPIA;
  return [
    saludo,
    "",
    propia
      ? `Le cuento que su pedido #${pedido.number} de Three Lions SAS salió ${cuando}: se lo llevamos nosotros.`
      : `Le cuento que su pedido #${pedido.number} de Three Lions SAS salió ${cuando} por ${pedido.carrier}.`,
    ...(!propia && pedido.tracking_number ? [`Número de guía: ${pedido.tracking_number}`] : []),
    "",
    "Quedo atento a cualquier duda.",
    firma,
  ].join("\n");
}
