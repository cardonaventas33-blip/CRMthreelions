"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarCheck,
  CalendarPlus,
  ChevronRight,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Play,
  Plus,
  RefreshCw,
  Star,
  X,
} from "lucide-react";
import { BarraCompra, HistorialCliente } from "@/components/agenda/historial-cliente";
import { semanaDelAnio } from "@/lib/agenda/fechas";
import { TIPOS_CITA } from "@/lib/agenda/opciones";
import type { VisitaRuta } from "@/lib/agenda/ruta";
import { pesos } from "@/lib/clientes/opciones";

// De lunes a sábado (decisión del dueño)
const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase() || "?";
}

// Tarjeta de una visita dentro del día (como la referencia): cliente, sede, ciudad-zona, potencial y barra
function TarjetaVisita({ visita, alAbrir }: { visita: VisitaRuta; alAbrir: () => void }) {
  const tipo = TIPOS_CITA[visita.tipo];
  return (
    <button
      type="button"
      onClick={alAbrir}
      className={`flex w-full flex-col gap-0.5 rounded-lg border border-l-4 border-line ${tipo.borde} bg-mist/60 p-2 text-left transition-colors hover:bg-mist ${
        visita.cancelada ? "opacity-60" : ""
      }`}
    >
      <span className="flex items-start justify-between gap-1.5">
        <span className={`text-xs leading-4 font-bold break-words uppercase ${visita.cancelada ? "line-through" : ""}`}>
          {visita.cliente?.nombre ?? visita.titulo}
        </span>
        <span className="shrink-0 text-[10px] leading-4 text-ink-soft tabular-nums">{visita.hora}</span>
      </span>
      {visita.sede && <span className="text-[10px] leading-4 text-ink-soft uppercase">{visita.sede}</span>}
      {visita.lugar && <span className="text-[10px] leading-4 font-semibold text-brand">{visita.lugar}</span>}
      {visita.potencial !== null && (
        <span className="text-[11px] leading-4 text-ink-soft tabular-nums">Potencial: {pesos(visita.potencial)}</span>
      )}
      {(visita.cliente?.importante || visita.hecha || visita.cancelada) && (
        <span className="mt-0.5 flex items-center gap-1.5">
          {visita.cliente?.importante && <Star className="size-4 fill-amber-400 text-amber-500" aria-label="Cliente importante" />}
          {visita.hecha && <span className="size-3 rounded-full bg-ok" role="img" aria-label="Visita hecha" />}
          {visita.cancelada && <span className="text-[10px] font-semibold text-ink-soft">Cancelada</span>}
        </span>
      )}
      <BarraCompra compra={visita.compra} />
    </button>
  );
}

function Dia({
  dia,
  posicion,
  delMes,
  esHoy,
  visitas,
  alAbrir,
}: {
  dia: string;
  posicion: number;
  delMes: boolean;
  esHoy: boolean;
  visitas: VisitaRuta[];
  alAbrir: (v: VisitaRuta) => void;
}) {
  const total = visitas.filter((v) => !v.cancelada).reduce((suma, v) => suma + (v.potencial ?? 0), 0);
  return (
    <section
      aria-label={`${DIAS[posicion]} ${Number(dia.slice(8))}`}
      className={`flex min-w-0 flex-col gap-2 rounded-xl border p-2 lg:min-h-36 ${
        esHoy ? "border-brand/50 bg-brand-soft/40" : "border-line bg-paper"
      } ${delMes ? "" : "opacity-55"}`}
    >
      <div className="flex items-baseline justify-between gap-2 px-1">
        <p className="text-sm font-semibold tabular-nums">
          <span className="font-normal text-ink-soft lg:hidden">{CORTOS[posicion]} </span>
          {Number(dia.slice(8))}
          {esHoy && <span className="ml-1.5 text-xs font-semibold text-brand">Hoy</span>}
        </p>
        {total > 0 && <p className="text-[11px] text-ink-soft tabular-nums">Total día: {pesos(total)}</p>}
      </div>
      {visitas.map((v) => (
        <TarjetaVisita key={v.id} visita={v} alAbrir={() => alAbrir(v)} />
      ))}
      <Link
        href={`/agenda/nueva?dia=${dia}`}
        className="mt-auto inline-flex min-h-8 items-center gap-1 self-start rounded-lg px-1 text-xs text-ink-soft hover:text-brand"
        aria-label={`Agendar el ${DIAS[posicion].toLowerCase()} ${Number(dia.slice(8))}`}
      >
        <Plus className="size-3.5" aria-hidden />
        Agendar
      </Link>
    </section>
  );
}

// Ventana "Detalles de la visita" (al tocar una tarjeta)
function DetalleVisita({ visita, alCerrar }: { visita: VisitaRuta | null; alCerrar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const ventana = ref.current;
    if (!ventana) return;
    if (visita && !ventana.open) ventana.showModal();
    if (!visita && ventana.open) ventana.close();
  }, [visita]);

  const cerrar = () => ref.current?.close();
  const boton = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold";

  return (
    <dialog
      ref={ref}
      onClose={alCerrar}
      onClick={(e) => {
        if (e.target === ref.current) cerrar(); // tocar afuera cierra
      }}
      aria-label="Detalles de la visita"
      className="m-auto max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-xl overflow-y-auto rounded-2xl border border-line bg-paper p-0 text-ink shadow-xl backdrop:bg-black/50"
    >
      {visita && (
        <div className="flex flex-col">
          <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-line bg-paper px-5 py-3">
            <p className="font-semibold">Detalles de la visita</p>
            <button type="button" onClick={cerrar} aria-label="Cerrar" className="grid size-11 place-items-center rounded-xl hover:bg-mist">
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <div className="flex flex-col gap-5 p-5">
            {/* Cliente */}
            <div className="flex items-center gap-4">
              {visita.cliente?.foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={visita.cliente.foto} alt="" className="size-16 shrink-0 rounded-xl border border-line object-cover" />
              ) : (
                <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-brand-soft text-lg font-bold text-brand">
                  {iniciales(visita.cliente?.nombre ?? visita.titulo)}
                </span>
              )}
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-lg font-bold break-words uppercase">
                  {visita.cliente?.nombre ?? visita.titulo}
                  {visita.cliente?.importante && <Star className="size-5 shrink-0 fill-amber-400 text-amber-500" aria-label="Cliente importante" />}
                </p>
                {visita.sede && <p className="text-sm text-ink-soft uppercase">{visita.sede}</p>}
                {visita.cliente && (
                  <Link href={`/clientes/${visita.cliente.id}`} className="inline-flex min-h-8 items-center gap-0.5 text-sm font-semibold text-brand hover:underline">
                    Ver ficha <ChevronRight className="size-4" aria-hidden />
                  </Link>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-mist px-2.5 py-1 font-medium">
                <span className={`size-2.5 rounded-full ${TIPOS_CITA[visita.tipo].punto}`} aria-hidden />
                {TIPOS_CITA[visita.tipo].nombre}
              </span>
              <span className="text-ink-soft tabular-nums">{visita.horario}</span>
              {visita.hecha && <span className="rounded-full bg-ok-soft px-2.5 py-1 text-xs font-semibold text-ok">Visita hecha</span>}
              {visita.cancelada && <span className="rounded-full bg-mist px-2.5 py-1 text-xs font-semibold text-ink-soft">Cancelada</span>}
            </div>

            {/* Contacto */}
            {visita.contacto && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-y border-line py-3">
                <p className="text-sm">
                  <span className="font-bold uppercase">{visita.contacto.nombre}</span>
                  {visita.contacto.cargo && <span className="text-ink-soft"> · {visita.contacto.cargo}</span>}
                </p>
                <div className="flex flex-wrap gap-2">
                  {visita.contacto.telefono && (
                    <a href={`tel:${visita.contacto.telefono}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line px-2.5 text-sm tabular-nums hover:bg-mist">
                      <Phone className="size-4" aria-hidden />
                      {visita.contacto.telefono}
                    </a>
                  )}
                  {visita.enlaces.whatsapp && !visita.cancelada && (
                    <a href={visita.enlaces.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line px-2.5 text-sm hover:bg-mist">
                      <MessageCircle className="size-4 text-ok" aria-hidden />
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            )}

            {visita.cliente && <HistorialCliente historial={visita} />}

            {visita.direccion && (
              <div className="flex items-start justify-between gap-3 rounded-xl bg-mist p-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-ink-soft uppercase">
                    <MapPin className="size-4 text-brand" aria-hidden />
                    Dirección
                  </p>
                  <p className="mt-1 break-words">{visita.direccion}</p>
                  {visita.lugar && <p className="text-xs font-semibold text-brand">{visita.lugar}</p>}
                </div>
                {visita.enlaces.mapa && (
                  <a href={visita.enlaces.mapa} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-line bg-paper px-2.5 text-sm hover:bg-mist">
                    <Navigation className="size-4" aria-hidden />
                    Cómo llegar
                  </a>
                )}
              </div>
            )}

            <details className="group rounded-xl border border-line p-3">
              <summary className="cursor-pointer text-xs font-semibold tracking-wider text-ink-soft uppercase">Datos de la visita</summary>
              <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-ink-soft">Título</dt>
                  <dd className="break-words">{visita.titulo}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-soft">Responsable</dt>
                  <dd>{visita.responsable}</dd>
                </div>
                {visita.notas && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-ink-soft">Notas</dt>
                    <dd className="break-words whitespace-pre-line">{visita.notas}</dd>
                  </div>
                )}
              </dl>
            </details>
          </div>

          {/* Botones */}
          <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-line bg-paper px-5 py-3">
            {!visita.cancelada && (
              <a href={visita.enlaces.google} target="_blank" rel="noopener noreferrer" className={`${boton} border border-line hover:bg-mist`}>
                <CalendarPlus className="size-4" aria-hidden />
                Google Calendar
              </a>
            )}
            {visita.puedeEditar && !visita.hecha && (
              <Link href={`/agenda/${visita.id}/editar`} className={`${boton} bg-mist hover:bg-line`}>
                <RefreshCw className="size-4" aria-hidden />
                {visita.cancelada ? "Editar" : "Reprogramar"}
              </Link>
            )}
            {visita.puedeEditar && !visita.hecha && !visita.cancelada && (
              <Link href={`/agenda/${visita.id}/visita`} className={`${boton} bg-brand text-on-brand hover:bg-brand-dark`}>
                <Play className="size-4" aria-hidden />
                Iniciar visita
              </Link>
            )}
            {visita.hecha && (
              <Link href={`/agenda/${visita.id}/visita`} className={`${boton} bg-ok-soft text-ok`}>
                <CalendarCheck className="size-4" aria-hidden />
                Ver visita y crear pedido
              </Link>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}

// Agenda del mes (o de la semana): filas por semana con su número, de lunes a sábado.
// En el celular cada día se ve uno debajo del otro.
export function AgendaRuta({
  semanas,
  mes,
  hoy,
  visitas,
}: {
  semanas: string[][];
  mes: string;
  hoy: string;
  visitas: VisitaRuta[];
}) {
  const [abierta, setAbierta] = useState<VisitaRuta | null>(null);
  const porDia = useMemo(() => {
    const mapa = new Map<string, VisitaRuta[]>();
    for (const v of visitas) mapa.set(v.fecha, [...(mapa.get(v.fecha) ?? []), v]);
    return mapa;
  }, [visitas]);

  return (
    <div>
      <div className="hidden grid-cols-[2.75rem_repeat(6,minmax(0,1fr))] gap-2 pb-2 lg:grid" aria-hidden>
        <span />
        {DIAS.map((d) => (
          <p key={d} className="text-center text-sm font-semibold text-ink-soft">
            {d}
          </p>
        ))}
      </div>
      <div className="flex flex-col gap-5 lg:gap-2">
        {semanas.map((semana) => (
          <div key={semana[0]} className="grid grid-cols-1 gap-2 lg:grid-cols-[2.75rem_repeat(6,minmax(0,1fr))]">
            <p className="flex items-center gap-2 text-xs font-semibold text-ink-soft lg:block lg:rounded-xl lg:bg-mist lg:pt-3 lg:text-center">
              <span className="lg:hidden">Semana</span>
              {semanaDelAnio(semana[0])}
            </p>
            {semana.map((dia, i) => (
              <Dia
                key={dia}
                dia={dia}
                posicion={i}
                delMes={dia.startsWith(mes)}
                esHoy={dia === hoy}
                visitas={porDia.get(dia) ?? []}
                alAbrir={setAbierta}
              />
            ))}
          </div>
        ))}
      </div>
      <DetalleVisita visita={abierta} alCerrar={() => setAbierta(null)} />
    </div>
  );
}
