import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarCheck, MapPin, MessageCircle, Navigation, Phone, Star } from "lucide-react";
import { FormularioVisita } from "@/components/agenda/formulario-visita";
import { HistorialCliente } from "@/components/agenda/historial-cliente";
import { BotonCrearPedido } from "@/components/pedidos/crear-pedido";
import { datosDeRuta, obtenerCita } from "@/lib/agenda/datos";
import { conMayuscula, partesColombia, textoFecha, textoHora } from "@/lib/agenda/fechas";
import { TIPOS_CITA } from "@/lib/agenda/opciones";
import { armarVisita } from "@/lib/agenda/ruta";
import { obtenerUsuarioActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Visita" };

type Props = { params: Promise<{ id: string }> };

export default async function Visita({ params }: Props) {
  const { id } = await params;
  const [yo, cita] = await Promise.all([obtenerUsuarioActual(), obtenerCita(id)]);
  if (!cita) notFound();
  const puedeEditar = yo?.rol === "admin" || cita.user_id === yo?.id;
  const datos = cita.cliente ? (await datosDeRuta([{ id: cita.cliente.id, photo_url: cita.cliente.photo_url }])).get(cita.cliente.id) : undefined;
  const visita = armarVisita(cita, datos, puedeEditar);
  const { fecha } = partesColombia(cita.start_at);
  const nombre = visita.cliente?.nombre ?? visita.titulo;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <Link href={`/agenda?dia=${fecha}`} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden />
        Volver a la agenda
      </Link>
      <h1 className="mt-2 flex items-center gap-3 text-2xl font-bold tracking-tight break-words uppercase sm:text-3xl">
        {nombre}
        {visita.cliente?.importante && <Star className="size-6 shrink-0 fill-amber-400 text-amber-500" aria-label="Cliente importante" />}
      </h1>
      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
        <span className="inline-flex items-center gap-1.5 font-medium text-ink">
          <span className={`size-2.5 rounded-full ${TIPOS_CITA[visita.tipo].punto}`} aria-hidden />
          {TIPOS_CITA[visita.tipo].nombre}
        </span>
        <span>{conMayuscula(textoFecha(fecha, { weekday: "long", day: "numeric", month: "long" }))}, {visita.horario}</span>
        {visita.sede && <span className="uppercase">{visita.sede}</span>}
        <span>Responsable: {visita.responsable}</span>
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <section className="flex flex-col gap-5 rounded-xl border border-line p-4 sm:p-6">
          {cita.completed_at ? (
            <div className="flex flex-col gap-4">
              <p className="flex items-start gap-2 rounded-xl bg-ok-soft px-4 py-3 text-sm">
                <CalendarCheck className="mt-0.5 size-5 shrink-0 text-ok" aria-hidden />
                Visita registrada el {textoFecha(partesColombia(cita.completed_at).fecha, { day: "numeric", month: "long" })} (
                {textoHora(cita.completed_at)}). La nota quedó en el historial del cliente.
              </p>
              {visita.cliente ? (
                <>
                  <p className="text-sm text-ink-soft">¿Te pidió productos? Crea el pedido de una vez:</p>
                  <div className="sm:max-w-xs">
                    <BotonCrearPedido clienteId={visita.cliente.id} texto={`Crear pedido para ${visita.cliente.nombre}`} />
                  </div>
                  <Link href={`/clientes/${visita.cliente.id}?pestana=interacciones`} className="text-sm font-semibold text-brand hover:underline">
                    Ver el historial del cliente
                  </Link>
                </>
              ) : null}
            </div>
          ) : !puedeEditar ? (
            <p className="text-ink-soft">Esta visita es de {visita.responsable}. Solo esa persona o un administrador pueden registrarla.</p>
          ) : cita.cancelled ? (
            <p className="text-ink-soft">
              Esta visita está cancelada.{" "}
              <Link href={`/agenda/${cita.id}/editar`} className="font-semibold text-brand hover:underline">
                Devuélvela a la agenda
              </Link>{" "}
              si sí se hizo.
            </p>
          ) : (
            <>
              <h2 className="font-semibold">Registrar la visita</h2>
              <FormularioVisita citaId={cita.id} />
            </>
          )}

          {visita.cliente && <HistorialCliente historial={visita} />}
        </section>

        <aside className="flex flex-col gap-4">
          {visita.contacto && (
            <section className="flex flex-col gap-2 rounded-xl border border-line p-4">
              <p className="text-xs font-semibold tracking-wider text-ink-soft uppercase">Contacto</p>
              <p className="font-semibold">{visita.contacto.nombre}</p>
              {visita.contacto.cargo && <p className="text-sm text-ink-soft">{visita.contacto.cargo}</p>}
              <div className="flex flex-wrap gap-2">
                {visita.contacto.telefono && (
                  <a href={`tel:${visita.contacto.telefono}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-line px-3 text-sm hover:bg-mist">
                    <Phone className="size-4" aria-hidden />
                    Llamar
                  </a>
                )}
                {visita.enlaces.whatsapp && (
                  <a href={visita.enlaces.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-line px-3 text-sm hover:bg-mist">
                    <MessageCircle className="size-4 text-ok" aria-hidden />
                    WhatsApp
                  </a>
                )}
              </div>
            </section>
          )}
          {visita.direccion && (
            <section className="flex flex-col gap-2 rounded-xl border border-line p-4">
              <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-ink-soft uppercase">
                <MapPin className="size-4 text-brand" aria-hidden />
                Dirección
              </p>
              <p className="break-words">{visita.direccion}</p>
              {visita.lugar && <p className="text-xs font-semibold text-brand">{visita.lugar}</p>}
              {visita.enlaces.mapa && (
                <a href={visita.enlaces.mapa} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1.5 self-start rounded-lg border border-line px-3 text-sm hover:bg-mist">
                  <Navigation className="size-4" aria-hidden />
                  Cómo llegar
                </a>
              )}
            </section>
          )}
          {visita.notas && (
            <section className="rounded-xl border border-line p-4">
              <p className="text-xs font-semibold tracking-wider text-ink-soft uppercase">Notas de la cita</p>
              <p className="mt-1 text-sm break-words whitespace-pre-line">{visita.notas}</p>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
