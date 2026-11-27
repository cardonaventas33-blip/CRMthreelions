import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ClipboardList, Search } from "lucide-react";
import { BotonCrearPedido } from "@/components/pedidos/crear-pedido";
import { listarClientes, obtenerCliente } from "@/lib/clientes/datos";

export const metadata: Metadata = { title: "Nuevo pedido" };

type Props = { searchParams: Promise<{ cliente?: string; q?: string }> };

export default async function NuevoPedido({ searchParams }: Props) {
  const { cliente: clienteId, q } = await searchParams;
  const elegido = clienteId ? await obtenerCliente(clienteId) : null;
  const { filas } = elegido ? { filas: [] } : await listarClientes({ q });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <Link href="/pedidos" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden />
        Volver a pedidos
      </Link>
      <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
        <ClipboardList className="size-8 shrink-0 text-brand" aria-hidden />
        Nuevo pedido
      </h1>

      {elegido ? (
        <section className="mt-8 flex flex-col gap-4 rounded-xl border border-line p-4 sm:p-6">
          <p className="text-sm text-ink-soft">Cliente</p>
          <div>
            <p className="text-xl font-semibold">{elegido.trade_name || elegido.name}</p>
            <p className="text-sm text-ink-soft">{[elegido.trade_name ? elegido.name : null, elegido.nit_rut, elegido.city].filter(Boolean).join(" · ")}</p>
          </div>
          <div className="sm:max-w-xs">
            <BotonCrearPedido clienteId={elegido.id} texto="Crear pedido para este cliente" />
          </div>
          <Link href="/pedidos/nuevo" className="text-sm font-semibold text-brand hover:underline">Elegir otro cliente</Link>
        </section>
      ) : (
        <>
          <p className="mt-2 text-base text-ink-soft">Busca el cliente y crea el pedido. Después agregas los productos.</p>
          <form role="search" action="/pedidos/nuevo" className="mt-6 flex gap-2">
            <div className="relative flex-1">
              <label htmlFor="nuevo-q" className="sr-only">Buscar cliente</label>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" aria-hidden />
              <input id="nuevo-q" name="q" type="search" defaultValue={q} placeholder="Razón social, nombre comercial o NIT" className="h-11 w-full rounded-xl border border-line bg-paper pr-3 pl-9 text-base outline-none focus:border-ink focus:ring-2 focus:ring-brand/15" />
            </div>
            <button type="submit" className="h-11 rounded-xl bg-ink px-4 text-sm font-semibold text-paper hover:bg-ink/85">Buscar</button>
          </form>

          {filas.length === 0 ? (
            <p className="mt-6 text-sm text-ink-soft">
              {q ? "Ningún cliente coincide." : "Todavía no hay clientes."}{" "}
              <Link href="/clientes/nuevo" className="font-semibold text-brand hover:underline">Crear un cliente</Link>
            </p>
          ) : (
            <ul className="mt-6 divide-y divide-line rounded-xl border border-line">
              {filas.slice(0, 50).map((c) => (
                <li key={c.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold">{c.trade_name || c.name}</p>
                    <p className="text-sm text-ink-soft">{[c.trade_name ? c.name : null, c.nit_rut, c.city].filter(Boolean).join(" · ")}</p>
                  </div>
                  <div className="sm:w-44">
                    <BotonCrearPedido clienteId={c.id} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
