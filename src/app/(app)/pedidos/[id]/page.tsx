import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { InsigniaPedido } from "@/components/catalogo/insignias";
import { AccionesDespacho } from "@/components/despachos/acciones-despacho";
import { AvisoWhatsApp, DatosDespacho, InsigniaDespacho } from "@/components/despachos/tarjeta-despacho";
import { EditorPedido } from "@/components/pedidos/editor";
import { EnviarPedido } from "@/components/pedidos/enviar-pedido";
import { hoyColombia } from "@/lib/agenda/fechas";
import { listarCategorias, obtenerPedido } from "@/lib/catalogo/datos";
import { nombrePlazo } from "@/lib/clientes/opciones";
import { estadoDespacho } from "@/lib/despachos/opciones";
import { obtenerUsuarioActual } from "@/lib/sesion";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const pedido = await obtenerPedido(id);
  return { title: pedido ? `Pedido #${pedido.number}` : "Pedido" };
}

const formatoFecha = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" });
const PESTANA = { "por-despachar": "por-despachar", despachado: "despachados", entregado: "entregados" } as const;

export default async function PaginaPedido({ params }: Props) {
  const { id } = await params;
  const [yo, pedido, categorias] = await Promise.all([obtenerUsuarioActual(), obtenerPedido(id), listarCategorias()]);
  if (!pedido) notFound();
  const puedeEditar = yo?.rol === "admin" || yo?.id === pedido.user_id;
  const firma = [yo?.nombre, "Three Lions SAS"].filter(Boolean).join("\n");
  const hoy = hoyColombia();

  // Despacho: aparece cuando el pedido ya se envió
  const envio = estadoDespacho(pedido);
  const aviso = envio === "despachado" ? <AvisoWhatsApp pedido={pedido} cliente={pedido.cliente} hoy={hoy} firma={firma} /> : null;
  const despacho = envio && (
    <section className="rounded-xl border border-line p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">Despacho</h2>
        <InsigniaDespacho estado={envio} />
      </div>
      {envio === "por-despachar" && <p className="mt-1 text-sm text-ink-soft">Todavía no ha salido.</p>}
      <div className="mt-3 flex flex-col gap-4">
        <DatosDespacho pedido={pedido} hoy={hoy} />
        {puedeEditar ? <AccionesDespacho key={envio} id={pedido.id} estado={envio} hoy={hoy} volver="pedido" extra={aviso} /> : aviso}
      </div>
      <Link href={`/despachos?ver=${PESTANA[envio]}`} className="mt-3 inline-flex min-h-9 items-center text-sm font-semibold text-brand hover:underline">
        Ver todos los despachos
      </Link>
    </section>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <Link href="/pedidos" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden />
        Volver a pedidos
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">Pedido #{pedido.number}</h1>
        <InsigniaPedido estado={pedido.status} />
      </div>
      <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-ink-soft">
        {pedido.cliente && (
          <Link href={`/clientes/${pedido.cliente.id}?pestana=pedidos`} className="font-semibold text-ink hover:text-brand">
            {pedido.cliente.trade_name || pedido.cliente.name}
          </Link>
        )}
        {pedido.cliente?.city && <span>{pedido.cliente.city}</span>}
        {pedido.cliente && <span>Plazo: {nombrePlazo(pedido.cliente.payment_term_days)}</span>}
        <span>Vendedor: {pedido.vendedor?.name || pedido.vendedor?.email || "—"}</span>
        <span>Creado: {formatoFecha.format(new Date(pedido.created_at))}</span>
      </p>

      <div className="mt-8">
        <EditorPedido
          pedido={pedido}
          puedeEditar={puedeEditar}
          categorias={categorias}
          despacho={despacho}
          enviar={<EnviarPedido pedido={pedido} firma={firma} />}
        />
      </div>
    </div>
  );
}
