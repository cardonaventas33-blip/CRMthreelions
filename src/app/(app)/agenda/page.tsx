import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Plus, Search } from "lucide-react";
import { NoProgramados, type ClienteSinProgramar } from "@/components/agenda/no-programados";
import { AgendaRuta } from "@/components/calendario";
import { estadoCompra } from "@/lib/agenda/compras";
import { clientesSinProgramar, datosDeRuta, listarCitas, type Cita } from "@/lib/agenda/datos";
import {
  conMayuscula,
  esFecha,
  hoyColombia,
  instanteColombia,
  lunesDe,
  primerDiaDelMes,
  semanasDelMes,
  sinDomingo,
  sumarDias,
  textoFecha,
} from "@/lib/agenda/fechas";
import { TIPOS_CITA } from "@/lib/agenda/opciones";
import { armarVisita } from "@/lib/agenda/ruta";
import { normalizarTexto, palabrasDeBusqueda } from "@/lib/catalogo/opciones";
import { obtenerUsuarioActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Agenda" };

type Props = { searchParams: Promise<{ dia?: string; vista?: string; ver?: string; q?: string }> };

export default async function Agenda({ searchParams }: Props) {
  const p = await searchParams;
  const yo = await obtenerUsuarioActual();
  const esAdmin = yo?.rol === "admin";
  const hoy = hoyColombia();
  const dia = sinDomingo(esFecha(p.dia) ? p.dia : hoy);
  const vista = p.vista === "semana" ? "semana" : "mes";
  // El administrador ve al equipo; cada vendedor, sus citas (los dos pueden cambiarlo)
  const verEquipo = p.ver === "equipo" || (p.ver !== "mias" && esAdmin);
  const busqueda = (p.q ?? "").slice(0, 80);
  const ahora = Date.now();

  const lunes = lunesDe(dia);
  const semanas = vista === "mes" ? semanasDelMes(dia) : [Array.from({ length: 6 }, (_, i) => sumarDias(lunes, i))];
  const dias = semanas.flat();
  const inicioMes = primerDiaDelMes(dia);

  const [{ citas, error }, sinProgramar] = await Promise.all([
    listarCitas({
      desde: instanteColombia(dias[0], "00:00").toISOString(),
      hasta: instanteColombia(sumarDias(dias[dias.length - 1], 1), "00:00").toISOString(),
      usuarioId: verEquipo ? undefined : yo?.id,
      incluirCanceladas: true,
    }),
    clientesSinProgramar(
      instanteColombia(inicioMes, "00:00").toISOString(),
      instanteColombia(primerDiaDelMes(dia, 1), "00:00").toISOString(),
    ),
  ]);

  // Buscar cliente: cada palabra debe estar en el nombre del cliente, su razón social o el título de la cita
  const palabras = palabrasDeBusqueda(busqueda);
  const coincide = (c: Cita) => {
    const texto = normalizarTexto([c.cliente?.trade_name, c.cliente?.name, c.title].filter(Boolean).join(" "));
    return palabras.every((palabra) => texto.includes(palabra));
  };
  const filtradas = palabras.length ? citas.filter(coincide) : citas;

  const datos = await datosDeRuta(
    filtradas.flatMap((c) => (c.cliente ? [{ id: c.cliente.id, photo_url: c.cliente.photo_url }] : [])),
  );
  const visitas = filtradas.map((c) =>
    armarVisita(c, c.client_id ? datos.get(c.client_id) : undefined, esAdmin || c.user_id === yo?.id, ahora),
  );

  const prioridad = (c: ClienteSinProgramar) =>
    c.compra.tipo === "con-frecuencia" ? c.compra.porcentaje : c.compra.tipo === "una-compra" ? 50 : 0;
  const noProgramados: ClienteSinProgramar[] = sinProgramar
    .map((c) => ({
      id: c.id,
      nombre: c.trade_name || c.name,
      ciudad: c.city,
      importante: c.is_key,
      potencial: c.resumen?.promedio ?? null,
      compra: estadoCompra(c.resumen, ahora),
    }))
    .sort((a, b) => prioridad(b) - prioridad(a) || Number(b.importante) - Number(a.importante) || a.nombre.localeCompare(b.nombre, "es"));

  const enlace = (cambios: { dia?: string; vista?: string; ver?: string; q?: string }) => {
    const q = new URLSearchParams({ dia: cambios.dia ?? dia });
    if ((cambios.vista ?? vista) === "semana") q.set("vista", "semana");
    q.set("ver", cambios.ver ?? (verEquipo ? "equipo" : "mias"));
    const texto = cambios.q ?? busqueda;
    if (texto) q.set("q", texto);
    return `/agenda?${q}`;
  };
  const chip = (activo: boolean) =>
    `inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium ${activo ? "bg-paper text-ink shadow-sm dark:bg-line" : "text-ink-soft hover:text-ink"}`;
  const botonGris = "inline-flex h-11 items-center gap-1.5 rounded-xl bg-mist px-4 text-sm font-semibold hover:bg-line";

  const mesTexto = conMayuscula(textoFecha(inicioMes, { month: "long", year: "numeric" }));
  const anterior = vista === "mes" ? sinDomingo(primerDiaDelMes(dia, -1)) : sumarDias(lunes, -7);
  const siguiente = vista === "mes" ? sinDomingo(primerDiaDelMes(dia, 1)) : sumarDias(lunes, 7);
  const subtitulo =
    vista === "mes"
      ? mesTexto
      : `Semana del ${textoFecha(lunes, { day: "numeric", month: "short" })} al ${textoFecha(sumarDias(lunes, 5), { day: "numeric", month: "short", year: "numeric" })}`;

  return (
    <div className="mx-auto max-w-[96rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Encabezado como la referencia del dueño */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line p-4 sm:p-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{vista === "mes" ? "Agenda del mes" : "Agenda de la semana"}</h1>
          <p className="mt-1 text-ink-soft">{subtitulo}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <NoProgramados clientes={noProgramados} dia={dia} mesTexto={textoFecha(inicioMes, { month: "long" })} />
          <Link href={enlace({ dia: anterior })} scroll={false} className={botonGris}>
            <ArrowLeft className="size-4" aria-hidden />
            Anterior
          </Link>
          <Link href={enlace({ dia: hoy })} scroll={false} className={botonGris}>
            Hoy
          </Link>
          <Link href={enlace({ dia: siguiente })} scroll={false} className={botonGris}>
            Siguiente
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link
            href={`/agenda/nueva?dia=${dia}`}
            className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-semibold text-on-brand hover:bg-brand-dark"
          >
            <Plus className="size-4" aria-hidden />
            Nueva cita
          </Link>
        </div>
      </div>

      {/* Colores de cada tipo y buscador de clientes */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line p-3 sm:px-5">
        <ul className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Tipos de visita">
          {Object.entries(TIPOS_CITA).map(([clave, tipo]) => (
            <li key={clave} className="flex items-center gap-2 text-sm text-ink-soft">
              <span className={`size-3 rounded ${tipo.punto}`} aria-hidden />
              {tipo.nombre}
            </li>
          ))}
        </ul>
        <form role="search" action="/agenda" className="relative w-full sm:w-72">
          <input type="hidden" name="dia" value={dia} />
          {vista === "semana" && <input type="hidden" name="vista" value="semana" />}
          <input type="hidden" name="ver" value={verEquipo ? "equipo" : "mias"} />
          <label htmlFor="agenda-q" className="sr-only">Buscar cliente</label>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" aria-hidden />
          <input
            id="agenda-q"
            name="q"
            type="search"
            defaultValue={busqueda}
            placeholder="Buscar cliente…"
            className="h-11 w-full rounded-xl border border-line bg-paper pr-3 pl-9 text-base outline-none focus:border-ink focus:ring-2 focus:ring-brand/15 sm:text-sm"
          />
        </form>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
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
        {busqueda && (
          <p className="text-sm text-ink-soft">
            {filtradas.length} {filtradas.length === 1 ? "visita" : "visitas"} con &quot;{busqueda}&quot; ·{" "}
            <Link href={enlace({ q: "" })} className="font-semibold text-brand hover:underline">Quitar búsqueda</Link>
          </p>
        )}
      </div>

      {error && <p className="mt-4 text-sm text-brand">{error}</p>}

      <div className="mt-4">
        <AgendaRuta semanas={semanas} mes={dia.slice(0, 7)} hoy={hoy} visitas={visitas} />
      </div>
    </div>
  );
}
