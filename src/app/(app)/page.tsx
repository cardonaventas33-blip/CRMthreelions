import Link from "next/link";
import {
  BatteryCharging,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  Disc3,
  Package,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  UsersRound,
  Wind,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { InsigniaPedido } from "@/components/catalogo/insignias";
import { listarCitas } from "@/lib/agenda/datos";
import { conMayuscula, partesColombia, textoFecha, textoHora } from "@/lib/agenda/fechas";
import { listarPedidos } from "@/lib/catalogo/datos";
import { pesos } from "@/lib/clientes/opciones";
import { obtenerUsuarioActual } from "@/lib/sesion";
import { obtenerResumen, type Indicador } from "@/lib/tablero";

const numero = new Intl.NumberFormat("es-CO");

// Flecha verde si sube, roja si baja, comparado con el mismo tramo del mes anterior
function Tendencia({ indicador }: { indicador: Indicador }) {
  const { actual, anterior } = indicador;
  if (anterior === 0) {
    return actual > 0 ? (
      <span className="rounded-full bg-ok-soft px-2 py-0.5 text-xs font-semibold text-ok">Nuevo</span>
    ) : null;
  }
  const cambio = ((actual - anterior) / anterior) * 100;
  const sube = cambio >= 0;
  const Icono = sube ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
        sube ? "bg-ok-soft text-ok" : "bg-brand-soft text-brand"
      }`}
    >
      <Icono className="size-3.5" aria-hidden />
      {sube ? "+" : ""}
      {Math.round(cambio)}%
    </span>
  );
}

function Tarjeta({
  titulo,
  icono: Icono,
  indicador,
  formato,
  periodoAnterior,
}: {
  titulo: string;
  icono: LucideIcon;
  indicador: Indicador;
  formato: (n: number) => string;
  periodoAnterior: string;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-line p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
          <Icono className="size-6" aria-hidden />
        </span>
        <h2 className="min-w-0 flex-1 font-semibold">{titulo}</h2>
        <Tendencia indicador={indicador} />
      </div>
      <p className="text-3xl font-bold tracking-tight tabular-nums">{formato(indicador.actual)}</p>
      <p className="text-sm text-ink-soft tabular-nums">
        vs {formato(indicador.anterior)} {periodoAnterior}
      </p>
    </section>
  );
}

export default async function Inicio() {
  const usuario = await obtenerUsuarioActual();
  const esAdmin = usuario?.rol === "admin";
  const ahora = Date.now();
  const [resumen, recientes, { citas: proximas }] = await Promise.all([
    obtenerResumen(),
    listarPedidos({ limite: 5 }),
    // El administrador ve las del equipo; cada vendedor, las suyas
    listarCitas({
      desde: new Date(ahora).toISOString(),
      hasta: new Date(ahora + 30 * 24 * 60 * 60 * 1000).toISOString(),
      usuarioId: esAdmin ? undefined : usuario?.id,
      limite: 6,
    }),
  ]);
  const primerNombre = usuario?.nombre.trim().split(/\s+/)[0];
  const sinVentas = resumen.ventas.actual === 0 && resumen.ventas.anterior === 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        {primerNombre ? `Hola, ${primerNombre}` : "Inicio"}
      </h1>
      <p className="mt-2 text-base text-ink-soft">Resumen general · mes en curso {resumen.periodo}</p>

      {sinVentas && (
        <p className="mt-6 rounded-xl bg-mist px-4 py-3 text-sm text-ink-soft">
          Las ventas se llenan solas cuando un pedido pasa a «Enviado» o «Completado».
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Tarjeta titulo="Ventas mes en curso" icono={CircleDollarSign} indicador={resumen.ventas} formato={pesos} periodoAnterior={resumen.periodoAnterior} />
        <Tarjeta titulo="Unidades mes en curso" icono={ShoppingCart} indicador={resumen.unidades} formato={(n) => numero.format(n)} periodoAnterior={resumen.periodoAnterior} />

        <section className="flex flex-col gap-3 rounded-xl border border-line p-5 sm:col-span-2 xl:col-span-1">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
              <UsersRound className="size-6" aria-hidden />
            </span>
            <h2 className="flex-1 font-semibold">Clientes</h2>
          </div>
          <p className="text-3xl font-bold tracking-tight tabular-nums">{numero.format(resumen.clientes.total)}</p>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href="/clientes?estado=validado" className="rounded-full bg-ok-soft px-2.5 py-1 font-medium text-ok hover:underline">
              {resumen.clientes.validado} validados
            </Link>
            <Link href="/clientes?estado=pendiente" className="rounded-full bg-warn-soft px-2.5 py-1 font-medium text-warn hover:underline">
              {resumen.clientes.pendiente} pendientes
            </Link>
          </div>
        </section>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Ventas por tipo de producto</h2>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Tarjeta titulo="Llantas" icono={Disc3} indicador={resumen.categorias.llantas} formato={pesos} periodoAnterior={resumen.periodoAnterior} />
        <Tarjeta titulo="Baterías" icono={BatteryCharging} indicador={resumen.categorias.baterias} formato={pesos} periodoAnterior={resumen.periodoAnterior} />
        <Tarjeta titulo="Plumillas" icono={Wind} indicador={resumen.categorias.plumillas} formato={pesos} periodoAnterior={resumen.periodoAnterior} />
        <Tarjeta titulo="Otros productos" icono={Wrench} indicador={resumen.categorias.otros} formato={pesos} periodoAnterior={resumen.periodoAnterior} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-line p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-semibold">
              <ClipboardList className="size-5 text-brand" aria-hidden />
              Pedidos recientes
            </h2>
            <Link href="/pedidos" className="inline-flex min-h-9 items-center text-sm font-semibold text-brand hover:underline">
              Ver todos
            </Link>
          </div>
          {recientes.pedidos.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">
              Todavía no hay pedidos.{" "}
              <Link href="/pedidos/nuevo" className="font-semibold text-brand hover:underline">Crea el primero</Link>.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {recientes.pedidos.map((p) => (
                <li key={p.id}>
                  <Link href={`/pedidos/${p.id}`} className="flex min-h-12 items-center gap-3 py-2 hover:text-brand">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        <span className="tabular-nums">#{p.number}</span> · {p.cliente?.trade_name || p.cliente?.name || "—"}
                      </span>
                      <span className="block truncate text-xs text-ink-soft">{p.vendedor?.name || p.vendedor?.email || "—"}</span>
                    </span>
                    <InsigniaPedido estado={p.status} />
                    <span className="shrink-0 text-sm font-semibold tabular-nums">{pesos(p.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-line p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-semibold">
              <UsersRound className="size-5 text-brand" aria-hidden />
              Últimos clientes
            </h2>
            <Link href="/clientes" className="inline-flex min-h-9 items-center text-sm font-semibold text-brand hover:underline">
              Ver todos
            </Link>
          </div>
          {resumen.ultimosClientes.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">
              Todavía no hay clientes.{" "}
              <Link href="/clientes/nuevo" className="font-semibold text-brand hover:underline">Crea el primero</Link>.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {resumen.ultimosClientes.map((c) => (
                <li key={c.id}>
                  <Link href={`/clientes/${c.id}`} className="flex min-h-12 items-center justify-between gap-3 py-2 hover:text-brand">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{c.name}</span>
                      {(c.trade_name || c.city) && (
                        <span className="block truncate text-xs text-ink-soft">{[c.trade_name, c.city].filter(Boolean).join(" · ")}</span>
                      )}
                    </span>
                    <Package className="size-4 shrink-0 text-ink-soft" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-line p-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 font-semibold">
              <CalendarDays className="size-5 text-brand" aria-hidden />
              {esAdmin ? "Próximas citas del equipo" : "Tus próximas citas"}
            </h2>
            <Link href="/agenda" className="inline-flex min-h-9 items-center text-sm font-semibold text-brand hover:underline">
              Ver agenda
            </Link>
          </div>
          {proximas.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">
              No hay citas en los próximos 30 días.{" "}
              <Link href="/agenda/nueva" className="font-semibold text-brand hover:underline">Agenda una</Link>.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {proximas.map((c) => {
                const { fecha } = partesColombia(c.start_at);
                const detalle = [c.cliente?.trade_name || c.cliente?.name, esAdmin ? c.responsable?.name : null].filter(Boolean).join(" · ");
                return (
                  <li key={c.id}>
                    <Link href={`/agenda?dia=${fecha}`} className="flex min-h-14 items-center gap-3 py-2 hover:text-brand">
                      <span className="w-28 shrink-0 text-sm">
                        <span className="block font-semibold">
                          {conMayuscula(textoFecha(fecha, { weekday: "short", day: "numeric", month: "short" }))}
                        </span>
                        <span className="block text-xs text-ink-soft tabular-nums">{textoHora(c.start_at)}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{c.title}</span>
                        <span className="block truncate text-xs text-ink-soft">{detalle || "Sin cliente"}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
