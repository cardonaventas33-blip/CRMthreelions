import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { InsigniaPedido } from "@/components/catalogo/insignias";
import { EditorPedido } from "@/components/pedidos/editor";
import { listarCategorias, obtenerPedido } from "@/lib/catalogo/datos";
import { nombrePlazo } from "@/lib/clientes/opciones";
import { obtenerUsuarioActual } from "@/lib/sesion";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const pedido = await obtenerPedido(id);
  return { title: pedido ? `Pedido #${pedido.number}` : "Pedido" };
}

const formatoFecha = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" });

export default async function PaginaPedido({ params }: Props) {
  const { id } = await params;
  const [yo, pedido, categorias] = await Promise.all([obtenerUsuarioActual(), obtenerPedido(id), listarCategorias()]);
  if (!pedido) notFound();
  const puedeEditar = yo?.rol === "admin" || yo?.id === pedido.user_id;

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
        <EditorPedido pedido={pedido} puedeEditar={puedeEditar} categorias={categorias} />
      </div>
    </div>
  );
}
