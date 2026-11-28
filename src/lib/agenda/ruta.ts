// Arma cada visita de la agenda con todo lo que muestran la tarjeta y la ventana de detalle.
// Se ejecuta en el servidor; el resultado son datos simples que viajan al navegador.
import { estadoCompra, type EstadoCompra } from "@/lib/agenda/compras";
import type { Cita, DatosCliente } from "@/lib/agenda/datos";
import { enlaceGoogleCalendar, partesColombia, textoFecha, textoHora } from "@/lib/agenda/fechas";
import { textoLugar, type TipoCita } from "@/lib/agenda/opciones";
import { enlaceWhatsApp, tieneWhatsApp } from "@/lib/contacto";

export type HistorialVisita = {
  ultimaCompra: { total: number; fecha: string } | null;
  potencial: number | null;
  frecuenciaDias: number | null;
  compra: EstadoCompra;
  seLlevo: { cantidad: number; nombre: string }[];
  referenciasMas: number;
};

export type VisitaRuta = HistorialVisita & {
  id: string;
  titulo: string;
  fecha: string;
  hora: string;
  horario: string;
  tipo: TipoCita;
  cancelada: boolean;
  hecha: boolean;
  notas: string | null;
  puedeEditar: boolean;
  responsable: string;
  cliente: { id: string; nombre: string; razonSocial: string; importante: boolean; foto: string | null } | null;
  sede: string | null;
  lugar: string;
  direccion: string | null;
  contacto: { nombre: string; cargo: string | null; telefono: string | null } | null;
  enlaces: { google: string; whatsapp: string | null; mapa: string | null };
};

const formatoFechaCorta = { day: "2-digit", month: "short", year: "numeric" } as const;

export function historialDe(datos: DatosCliente | undefined | null, ahora = Date.now()): HistorialVisita {
  const resumen = datos?.resumen ?? null;
  return {
    ultimaCompra:
      resumen?.ultima_compra && resumen.ultimo_total !== null
        ? { total: resumen.ultimo_total, fecha: textoFecha(partesColombia(resumen.ultima_compra).fecha, formatoFechaCorta) }
        : null,
    potencial: resumen?.promedio ?? null,
    frecuenciaDias: resumen?.frecuencia_dias ?? null,
    compra: estadoCompra(resumen, ahora),
    seLlevo: datos?.seLlevo ?? [],
    referenciasMas: datos?.referenciasMas ?? 0,
  };
}

export function armarVisita(cita: Cita, datos: DatosCliente | undefined, puedeEditar: boolean, ahora = Date.now()): VisitaRuta {
  const cliente = cita.cliente;
  const { fecha } = partesColombia(cita.start_at);
  const nombreCliente = cliente ? cliente.trade_name || cliente.name : null;
  const ciudad = cita.sede?.city ?? cliente?.city ?? null;
  const direccion = cita.sede?.address ?? cliente?.address ?? null;

  // Contacto: primero el comercial, si no el primero que haya
  const contactos = cliente?.contactos ?? [];
  const contacto = contactos.find((c) => c.receives_sales) ?? contactos[0] ?? null;
  const celular = [contacto?.phone, ...contactos.map((c) => c.phone), cliente?.phone].find((t) => tieneWhatsApp(t)) ?? null;

  const diaLargo = textoFecha(fecha, { weekday: "long", day: "numeric", month: "long" });
  const mensaje = `Hola${contacto ? ` ${contacto.first_name}` : ""}, le escribo de Three Lions para confirmar nuestra visita el ${diaLargo} a las ${textoHora(cita.start_at)}. ¡Gracias!`;

  return {
    ...historialDe(datos, ahora),
    id: cita.id,
    titulo: cita.title,
    fecha,
    hora: textoHora(cita.start_at),
    horario: `${textoHora(cita.start_at)} – ${textoHora(cita.end_at)}`,
    tipo: cita.kind,
    cancelada: cita.cancelled,
    hecha: Boolean(cita.completed_at),
    notas: cita.notes,
    puedeEditar,
    responsable: cita.responsable?.name || cita.responsable?.email || "—",
    cliente: cliente
      ? { id: cliente.id, nombre: nombreCliente!, razonSocial: cliente.name, importante: cliente.is_key, foto: datos?.foto ?? null }
      : null,
    sede: cita.sede?.name ?? null,
    lugar: textoLugar(ciudad, cita.sede?.zone),
    direccion,
    contacto: contacto
      ? { nombre: `${contacto.first_name} ${contacto.last_name}`.trim(), cargo: contacto.role_title, telefono: contacto.phone }
      : null,
    enlaces: {
      google: enlaceGoogleCalendar({
        titulo: nombreCliente ? `${cita.title} · ${nombreCliente}` : cita.title,
        inicio: cita.start_at,
        fin: cita.end_at,
        detalles: [nombreCliente && `Cliente: ${nombreCliente}`, cita.sede?.name, cita.notes, "Agendada en el CRM Three Lions"]
          .filter(Boolean)
          .join("\n"),
        lugar: [direccion, ciudad].filter(Boolean).join(", "),
      }),
      whatsapp: celular ? enlaceWhatsApp(celular, mensaje) : null,
      mapa: direccion
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([direccion, ciudad].filter(Boolean).join(", "))}`
        : null,
    },
  };
}
