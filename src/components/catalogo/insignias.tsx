import { ESTADOS_PEDIDO, type EstadoPedido } from "@/lib/catalogo/opciones";

export function InsigniaStock({ stock }: { stock: number }) {
  const clase =
    stock === 0 ? "bg-brand-soft text-brand" : stock <= 5 ? "bg-warn-soft text-warn" : "bg-ok-soft text-ok";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${clase}`}>
      {stock === 0 ? "Agotado" : `${stock} en stock`}
    </span>
  );
}

const COLOR_PEDIDO: Record<EstadoPedido, string> = {
  borrador: "bg-mist text-ink-soft",
  enviado: "bg-warn-soft text-warn",
  completado: "bg-ok-soft text-ok",
};

export function InsigniaPedido({ estado }: { estado: EstadoPedido }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${COLOR_PEDIDO[estado]}`}>
      {ESTADOS_PEDIDO[estado]}
    </span>
  );
}
