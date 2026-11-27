import Link from "next/link";
import {
  BatteryCharging,
  CalendarDays,
  CircleDollarSign,
  Disc3,
  Package,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  UsersRound,
  Wind,
  type LucideIcon,
} from "lucide-react";
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
  const [usuario, resumen] = await Promise.all([obtenerUsuarioActual(), obtenerResumen()]);
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
          Las ventas se llenan solas cuando se registren pedidos enviados o completados (llega en la Fase 3).
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Tarjeta titulo="Ventas mes en curso" icono={CircleDollarSign} indicador={resumen.ventas} formato={pesos} periodoAnterior={resumen.periodoAnterior} />
        <Tarjeta titulo="Unidades mes en curso" icono={ShoppingCart} indicador={resumen.unidades} formato={(n) => numero.format(n)} periodoAnterior={resumen.periodoAnterior} />
        <Tarjeta titulo="Baterías mes en curso" icono={BatteryCharging} indicador={resumen.categorias.baterias} formato={pesos} periodoAnterior={resumen.periodoAnterior} />
        <Tarjeta titulo="Llantas mes en curso" icono={Disc3} indicador={resumen.categorias.llantas} formato={pesos} periodoAnterior={resumen.periodoAnterior} />
        <Tarjeta titulo="Plumillas mes en curso" icono={Wind} indicador={resumen.categorias.plumillas} formato={pesos} periodoAnterior={resumen.periodoAnterior} />

        <section className="flex flex-col gap-3 rounded-xl border border-line p-5">
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

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
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

        <section className="rounded-xl border border-line p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <CalendarDays className="size-5 text-brand" aria-hidden />
            Próximas citas
          </h2>
          <p className="mt-3 text-sm text-ink-soft">Tus citas de los próximos días aparecerán aquí (Fase 4).</p>
        </section>
      </div>
    </div>
  );
}
