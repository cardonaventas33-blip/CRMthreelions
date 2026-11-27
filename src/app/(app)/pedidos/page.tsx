import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, Plus } from "lucide-react";
import { InsigniaPedido } from "@/components/catalogo/insignias";
import { listarPedidos } from "@/lib/catalogo/datos";
import { ESTADOS_PEDIDO } from "@/lib/catalogo/opciones";
import { pesos } from "@/lib/clientes/opciones";
import { obtenerUsuarioActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Pedidos" };

type Props = { searchParams: Promise<{ estado?: string; mios?: string }> };

const formatoFecha = new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Bogota" });

export default async function Pedidos({ searchParams }: Props) {
  const { estado, mios } = await searchParams;
  const yo = await obtenerUsuarioActual();
  const soloMios = mios === "1";
  const { pedidos, error } = await listarPedidos({ estado, usuarioId: soloMios ? yo?.id : undefined });

  const enlace = (cambios: { estado?: string | null; mios?: boolean }) => {
    const p = new URLSearchParams();
    const e = cambios.estado === undefined ? estado : cambios.estado;
    const m = cambios.mios === undefined ? soloMios : cambios.mios;
    if (e) p.set("estado", e);
    if (m) p.set("mios", "1");
    return p.size ? `/pedidos?${p}` : "/pedidos";
  };

  const chip = (activo: boolean) =>
    `inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-medium ${
      activo ? "border-ink bg-ink text-paper" : "border-line hover:bg-mist"
    }`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
            <ClipboardList className="size-8 shrink-0 text-brand" aria-hidden />
            Pedidos
          </h1>
          <p className="mt-2 text-base text-ink-soft">Totales con IVA incluido.</p>
        </div>
        <Link href="/pedidos/nuevo" className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-4 font-semibold text-on-brand hover:bg-brand-dark">
          <Plus className="size-5" aria-hidden />
          Nuevo pedido
        </Link>
      </div>

      <nav aria-label="Filtrar pedidos" className="mt-6 flex flex-wrap gap-2">
        <Link href={enlace({ estado: null })} className={chip(!estado)} aria-current={!estado ? "page" : undefined}>Todos</Link>
        {Object.entries(ESTADOS_PEDIDO).map(([valor, nombre]) => (
          <Link key={valor} href={enlace({ estado: valor })} className={chip(estado === valor)} aria-current={estado === valor ? "page" : undefined}>
            {nombre}
          </Link>
        ))}
        <Link href={enlace({ mios: !soloMios })} className={chip(soloMios)} aria-pressed={soloMios}>Solo los míos</Link>
      </nav>

      {error && <p className="mt-4 text-sm text-brand">{error}</p>}

      {pedidos.length === 0 && !error ? (
        <div className="mt-6 rounded-xl border border-dashed border-line px-6 py-12 text-center">
          <ClipboardList className="mx-auto size-10 text-ink-soft" aria-hidden />
          <p className="mt-3 font-semibold">No hay pedidos {estado || soloMios ? "con este filtro" : "todavía"}</p>
          <p className="mt-1 text-sm text-ink-soft">Crea uno con &quot;Nuevo pedido&quot; o desde la ficha de un cliente.</p>
        </div>
      ) : (
        <>
          <div className="mt-6 hidden overflow-x-auto rounded-xl border border-line md:block">
            <table className="w-full min-w-[48rem] text-sm">
              <thead>
                <tr className="border-b border-line bg-mist text-left text-xs font-semibold tracking-wider text-ink-soft uppercase">
                  <th scope="col" className="px-4 py-3">Pedido</th>
                  <th scope="col" className="px-4 py-3">Cliente</th>
                  <th scope="col" className="px-4 py-3">Vendedor</th>
                  <th scope="col" className="px-4 py-3">Estado</th>
                  <th scope="col" className="px-4 py-3 text-right">Productos</th>
                  <th scope="col" className="px-4 py-3 text-right">Total</th>
                  <th scope="col" className="px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {pedidos.map((p) => (
                  <tr key={p.id} className="hover:bg-mist/60">
                    <td className="px-4 py-3">
                      <Link href={`/pedidos/${p.id}`} className="font-semibold tabular-nums hover:text-brand">#{p.number}</Link>
                    </td>
                    <td className="px-4 py-3">{p.cliente?.trade_name || p.cliente?.name || "—"}</td>
                    <td className="px-4 py-3 text-ink-soft">{p.vendedor?.name || p.vendedor?.email || "—"}</td>
                    <td className="px-4 py-3"><InsigniaPedido estado={p.status} /></td>
                    <td className="px-4 py-3 text-right tabular-nums">{p.productos}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{pesos(p.total)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-soft">{formatoFecha.format(new Date(p.created_at))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-6 flex flex-col gap-3 md:hidden">
            {pedidos.map((p) => (
              <li key={p.id}>
                <Link href={`/pedidos/${p.id}`} className="flex flex-col gap-2 rounded-xl border border-line p-4 hover:bg-mist/40">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold tabular-nums">Pedido #{p.number}</span>
                    <InsigniaPedido estado={p.status} />
                  </div>
                  <p className="text-sm">{p.cliente?.trade_name || p.cliente?.name || "—"}</p>
                  <div className="flex items-center justify-between text-sm text-ink-soft">
                    <span>{formatoFecha.format(new Date(p.created_at))} · {p.productos} prod.</span>
                    <span className="text-base font-bold text-ink tabular-nums">{pesos(p.total)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
