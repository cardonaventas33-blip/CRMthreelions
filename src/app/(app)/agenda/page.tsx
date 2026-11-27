import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { TarjetaCita } from "@/components/agenda/tarjeta-cita";
import { CalendarioMes } from "@/components/calendario";
import { listarCitas, type Cita } from "@/lib/agenda/datos";
import {
  conMayuscula,
  esFecha,
  hoyColombia,
  instanteColombia,
  lunesDe,
  partesColombia,
  semanasDelMes,
  sinDomingo,
  sumarDias,
  textoFecha,
} from "@/lib/agenda/fechas";
import { obtenerUsuarioActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Agenda" };

type Props = { searchParams: Promise<{ dia?: string; vista?: string; ver?: string }> };

export default async function Agenda({ searchParams }: Props) {
  const p = await searchParams;
  const yo = await obtenerUsuarioActual();
  const esAdmin = yo?.rol === "admin";
  const hoy = hoyColombia();
  const dia = sinDomingo(esFecha(p.dia) ? p.dia : hoy);
  const vista = p.vista === "semana" ? "semana" : "mes";
  // El administrador ve al equipo; cada vendedor, sus citas (los dos pueden cambiarlo)
  const verEquipo = p.ver === "equipo" || (p.ver !== "mias" && esAdmin);

  const lunes = lunesDe(dia);
  const dias = vista === "mes" ? semanasDelMes(dia).flat() : Array.from({ length: 6 }, (_, i) => sumarDias(lunes, i));
  const { citas, error } = await listarCitas({
    desde: instanteColombia(dias[0], "00:00").toISOString(),
    hasta: instanteColombia(sumarDias(dias[dias.length - 1], 1), "00:00").toISOString(),
    usuarioId: verEquipo ? undefined : yo?.id,
    incluirCanceladas: true,
  });

  const porDia = new Map<string, Cita[]>();
  for (const cita of citas) {
    const fecha = partesColombia(cita.start_at).fecha;
    porDia.set(fecha, [...(porDia.get(fecha) ?? []), cita]);
  }

  const enlace = (cambios: { dia?: string; vista?: string; ver?: string }) => {
    const q = new URLSearchParams({ dia: cambios.dia ?? dia });
    if ((cambios.vista ?? vista) === "semana") q.set("vista", "semana");
    q.set("ver", cambios.ver ?? (verEquipo ? "equipo" : "mias"));
    return `/agenda?${q}`;
  };
  const puedeEditar = (c: Cita) => esAdmin || c.user_id === yo?.id;
  const chip = (activo: boolean) =>
    `inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium ${activo ? "bg-paper text-ink shadow-sm dark:bg-line" : "text-ink-soft hover:text-ink"}`;

  const citasDelDia = porDia.get(dia) ?? [];
  const nombreDia = (d: string) => conMayuscula(textoFecha(d, { weekday: "long", day: "numeric", month: "long" }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
            <CalendarDays className="size-8 shrink-0 text-brand" aria-hidden />
            Agenda
          </h1>
          <p className="mt-2 text-base text-ink-soft">De lunes a sábado. Toca un día para ver sus citas.</p>
        </div>
        <Link
          href={`/agenda/nueva?dia=${dia}`}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-4 font-semibold text-on-brand hover:bg-brand-dark"
        >
          <Plus className="size-5" aria-hidden />
          Nueva cita
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <nav aria-label="Vista de la agenda" className="inline-flex gap-1 rounded-xl bg-mist p-1">
          <Link href={enlace({ vista: "mes" })} scroll={false} className={chip(vista === "mes")} aria-current={vista === "mes" ? "page" : undefined}>
            Mes
          </Link>
          <Link href={enlace({ vista: "semana" })} scroll={false} className={chip(vista === "semana")} aria-current={vista === "semana" ? "page" : undefined}>
            Semana
          </Link>
        </nav>
        <nav aria-label="De quién son las citas" className="inline-flex gap-1 rounded-xl bg-mist p-1">
          <Link href={enlace({ ver: "mias" })} scroll={false} className={chip(!verEquipo)} aria-current={!verEquipo ? "page" : undefined}>
            Mis citas
          </Link>
          <Link href={enlace({ ver: "equipo" })} scroll={false} className={chip(verEquipo)} aria-current={verEquipo ? "page" : undefined}>
            Todo el equipo
          </Link>
        </nav>
      </div>

      {error && <p className="mt-4 text-sm text-brand">{error}</p>}

      {vista === "mes" ? (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <CalendarioMes dia={dia} hoy={hoy} porDia={porDia} enlace={(d) => enlace({ dia: d })} />

          {/* El día elegido y sus citas */}
          <section aria-label={`Citas del ${nombreDia(dia)}`} className="flex flex-col gap-3 rounded-xl border border-line p-4 sm:p-5">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-semibold">{nombreDia(dia)}</h2>
              <Link href={`/agenda/nueva?dia=${dia}`} className="inline-flex min-h-9 shrink-0 items-center gap-1 text-sm font-semibold text-brand hover:underline">
                <Plus className="size-4" aria-hidden />
                Agendar
              </Link>
            </div>
            {citasDelDia.length === 0 ? (
              <p className="text-sm text-ink-soft">No hay citas para este día.</p>
            ) : (
              citasDelDia.map((c) => <TarjetaCita key={c.id} cita={c} puedeEditar={puedeEditar(c)} />)
            )}
          </section>
        </div>
      ) : (
        <section aria-label="Semana" className="mt-6 overflow-hidden rounded-xl border border-line">
          <div className="flex items-center gap-1 border-b border-line px-2 py-2 sm:px-4">
            <h2 className="min-w-0 flex-1 truncate px-1 text-lg font-semibold">
              Semana del {textoFecha(lunes, { day: "numeric", month: "short" })} al{" "}
              {textoFecha(sumarDias(lunes, 5), { day: "numeric", month: "short" })}
            </h2>
            <Link href={enlace({ dia: hoy })} scroll={false} className="inline-flex h-11 items-center rounded-xl border border-line px-3 text-sm font-medium hover:bg-mist">
              Hoy
            </Link>
            <Link href={enlace({ dia: sumarDias(lunes, -7) })} scroll={false} aria-label="Semana anterior" className="grid size-11 place-items-center rounded-xl hover:bg-mist">
              <ChevronLeft className="size-5" aria-hidden />
            </Link>
            <Link href={enlace({ dia: sumarDias(lunes, 7) })} scroll={false} aria-label="Semana siguiente" className="grid size-11 place-items-center rounded-xl hover:bg-mist">
              <ChevronRight className="size-5" aria-hidden />
            </Link>
          </div>
          <ol className="divide-y divide-line">
            {dias.map((d) => {
              const delDia = porDia.get(d) ?? [];
              return (
                <li key={d} className={`flex flex-col gap-3 p-4 sm:p-5 ${d === hoy ? "bg-brand-soft/40" : ""}`}>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold">
                      {nombreDia(d)}
                      {d === hoy && <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-on-brand">Hoy</span>}
                    </h3>
                    <Link href={`/agenda/nueva?dia=${d}`} className="inline-flex min-h-9 shrink-0 items-center gap-1 text-sm font-semibold text-brand hover:underline">
                      <Plus className="size-4" aria-hidden />
                      Agendar
                    </Link>
                  </div>
                  {delDia.length === 0 ? (
                    <p className="text-sm text-ink-soft">Sin citas.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {delDia.map((c) => (
                        <TarjetaCita key={c.id} cita={c} puedeEditar={puedeEditar(c)} />
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </div>
  );
}
