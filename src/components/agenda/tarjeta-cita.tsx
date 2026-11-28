import Link from "next/link";
import { CalendarCheck, CalendarPlus, MapPin, MessageCircle, Pencil, Play, UserRound } from "lucide-react";
import type { Cita } from "@/lib/agenda/datos";
import { conMayuscula, enlaceGoogleCalendar, partesColombia, textoFecha, textoHora } from "@/lib/agenda/fechas";
import { TIPOS_CITA } from "@/lib/agenda/opciones";
import { enlaceWhatsApp, tieneWhatsApp } from "@/lib/contacto";

// Celular para avisarle al cliente: primero un contacto comercial, luego cualquier contacto, luego el de la empresa
function celularDelCliente(cita: Cita) {
  const contactos = cita.cliente?.contactos ?? [];
  const contacto =
    contactos.find((c) => c.receives_sales && tieneWhatsApp(c.phone)) ?? contactos.find((c) => tieneWhatsApp(c.phone));
  if (contacto?.phone) return { telefono: contacto.phone, nombre: contacto.first_name };
  if (tieneWhatsApp(cita.cliente?.phone)) return { telefono: cita.cliente.phone, nombre: null };
  return null;
}

const botonChico =
  "inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line px-2.5 text-sm font-medium hover:bg-mist";

// Una cita con sus botones: Editar, Google Calendar y WhatsApp al cliente
export function TarjetaCita({
  cita,
  puedeEditar,
  conFecha = false,
}: {
  cita: Cita;
  puedeEditar: boolean;
  conFecha?: boolean;
}) {
  const { fecha } = partesColombia(cita.start_at);
  const nombreCliente = cita.cliente ? cita.cliente.trade_name || cita.cliente.name : null;
  const lugar = [cita.cliente?.address, cita.cliente?.city].filter(Boolean).join(", ");
  const diaLargo = textoFecha(fecha, { weekday: "long", day: "numeric", month: "long" });
  const horario = `${textoHora(cita.start_at)} – ${textoHora(cita.end_at)}`;
  const celular = celularDelCliente(cita);

  const mensajeWhatsApp = celular
    ? `Hola${celular.nombre ? ` ${celular.nombre}` : ""}, le escribo de Three Lions para confirmar nuestra cita (${cita.title}) el ${diaLargo} a las ${textoHora(cita.start_at)}. ¡Gracias!`
    : "";

  const google = enlaceGoogleCalendar({
    titulo: nombreCliente ? `${cita.title} · ${nombreCliente}` : cita.title,
    inicio: cita.start_at,
    fin: cita.end_at,
    detalles: [nombreCliente && `Cliente: ${nombreCliente}`, cita.notes, "Agendada en el CRM Three Lions"].filter(Boolean).join("\n"),
    lugar,
  });

  return (
    <article
      className={`flex flex-col gap-1.5 rounded-xl border border-l-4 border-line ${TIPOS_CITA[cita.kind].borde} p-3 ${cita.cancelled ? "bg-mist/60" : ""}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-semibold text-ink-soft tabular-nums">
          {conFecha && `${conMayuscula(textoFecha(fecha, { weekday: "short", day: "numeric", month: "short" }))} · `}
          {horario}
        </p>
        <span className="text-xs text-ink-soft">{TIPOS_CITA[cita.kind].nombre}</span>
        {cita.completed_at && <span className="rounded-full bg-ok-soft px-2 py-0.5 text-xs font-semibold text-ok">Hecha</span>}
        {cita.cancelled && (
          <span className="rounded-full bg-mist px-2 py-0.5 text-xs font-semibold text-ink-soft">Cancelada</span>
        )}
      </div>
      <p className={`font-semibold break-words ${cita.cancelled ? "text-ink-soft line-through" : ""}`}>{cita.title}</p>
      {cita.cliente && (
        <Link href={`/clientes/${cita.cliente.id}`} className="self-start text-sm font-semibold break-words text-brand hover:underline">
          {nombreCliente}
        </Link>
      )}
      {lugar && (
        <p className="flex items-start gap-1.5 text-xs text-ink-soft">
          <MapPin className="mt-px size-3.5 shrink-0" aria-hidden />
          {lugar}
        </p>
      )}
      <p className="flex items-center gap-1.5 text-xs text-ink-soft">
        <UserRound className="size-3.5 shrink-0" aria-hidden />
        {cita.responsable?.name || cita.responsable?.email || "—"}
      </p>
      {cita.notes && <p className="line-clamp-3 text-sm break-words whitespace-pre-line">{cita.notes}</p>}

      <div className="mt-1 flex flex-wrap gap-2">
        {puedeEditar && !cita.completed_at && !cita.cancelled && (
          <Link href={`/agenda/${cita.id}/visita`} className={`${botonChico} border-brand/40 text-brand`}>
            <Play className="size-4" aria-hidden />
            Iniciar visita
          </Link>
        )}
        {cita.completed_at && (
          <Link href={`/agenda/${cita.id}/visita`} className={botonChico}>
            <CalendarCheck className="size-4 text-ok" aria-hidden />
            Ver visita
          </Link>
        )}
        {puedeEditar && !cita.completed_at && (
          <Link href={`/agenda/${cita.id}/editar`} className={botonChico}>
            <Pencil className="size-4" aria-hidden />
            Editar
          </Link>
        )}
        {!cita.cancelled && (
          <a href={google} target="_blank" rel="noopener noreferrer" className={botonChico}>
            <CalendarPlus className="size-4" aria-hidden />
            Google Calendar
          </a>
        )}
        {!cita.cancelled && celular && (
          <a href={enlaceWhatsApp(celular.telefono, mensajeWhatsApp)} target="_blank" rel="noopener noreferrer" className={botonChico}>
            <MessageCircle className="size-4 text-ok" aria-hidden />
            Confirmar por WhatsApp
          </a>
        )}
      </div>
    </article>
  );
}
