import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { AccionesDespacho } from "@/components/despachos/acciones-despacho";
import { conMayuscula } from "@/lib/agenda/fechas";
import { pesos } from "@/lib/clientes/opciones";
import { enlaceWhatsApp } from "@/lib/contacto";
import type { Despacho } from "@/lib/despachos/datos";
import {
  ENTREGA_PROPIA,
  ESTADOS_DESPACHO,
  cuandoFue,
  destinoAviso,
  diaCorto,
  estadoDespacho,
  textoAvisoDespacho,
  type EstadoDespacho,
} from "@/lib/despachos/opciones";

export function InsigniaDespacho({ estado }: { estado: EstadoDespacho }) {
  const { nombre, clase } = ESTADOS_DESPACHO[estado];
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${clase}`}>{nombre}</span>;
}

type DatosEnvio = Pick<
  Despacho,
  "status" | "updated_at" | "dispatched_at" | "carrier" | "tracking_number" | "dispatch_notes" | "delivered_at" | "received_by"
>;

// Transportadora, guía, fechas y quién recibió
export function DatosDespacho({ pedido, hoy }: { pedido: DatosEnvio; hoy: string }) {
  const filas: { titulo: string; valor: string }[] = [];
  if (pedido.dispatched_at) {
    filas.push({ titulo: "Despachado", valor: conMayuscula(diaCorto(pedido.dispatched_at, hoy)) });
  }
  if (pedido.carrier) filas.push({ titulo: pedido.carrier === ENTREGA_PROPIA ? "Entrega" : "Transportadora", valor: pedido.carrier });
  if (pedido.tracking_number) filas.push({ titulo: "Número de guía", valor: pedido.tracking_number });
  if (pedido.status === "completado") {
    // Los pedidos completados antes de existir los despachos no tienen fecha de entrega: se usa la última modificación
    const entrega = pedido.delivered_at ?? pedido.updated_at;
    filas.push({ titulo: "Entregado", valor: conMayuscula(diaCorto(entrega, hoy)) });
  }
  if (pedido.received_by) filas.push({ titulo: "Recibió", valor: pedido.received_by });
  if (filas.length === 0 && !pedido.dispatch_notes) return null;

  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
      {filas.map((f) => (
        <div key={f.titulo} className="min-w-0">
          <dt className="text-xs text-ink-soft">{f.titulo}</dt>
          <dd className="font-medium break-words">{f.valor}</dd>
        </div>
      ))}
      {pedido.dispatch_notes && (
        <div className="min-w-0 sm:col-span-2">
          <dt className="text-xs text-ink-soft">Notas del despacho</dt>
          <dd className="break-words whitespace-pre-line">{pedido.dispatch_notes}</dd>
        </div>
      )}
    </dl>
  );
}

// "Avisar por WhatsApp": abre WhatsApp con el mensaje de que el pedido ya salió
export function AvisoWhatsApp({
  pedido,
  cliente,
  hoy,
  firma,
}: {
  pedido: { number: number; carrier: string | null; tracking_number: string | null; dispatched_at: string | null };
  cliente: Parameters<typeof destinoAviso>[0] | null;
  hoy: string;
  firma: string;
}) {
  const destino = cliente ? destinoAviso(cliente) : null;
  if (!destino || !pedido.dispatched_at) return null;
  const texto = textoAvisoDespacho({ ...pedido, dispatched_at: pedido.dispatched_at }, destino.saludo, firma, hoy);
  return (
    <a
      href={enlaceWhatsApp(destino.telefono, texto)}
      target="_blank"
      rel="noopener noreferrer"
      title={`Avisarle a ${destino.nombre}`}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold hover:bg-mist"
    >
      <MessageCircle className="size-4 text-ok" aria-hidden />
      Avisar por WhatsApp
    </a>
  );
}

export function TarjetaDespacho({
  pedido,
  hoy,
  firma,
  puedeEditar,
  resaltado,
}: {
  pedido: Despacho;
  hoy: string;
  firma: string;
  puedeEditar: boolean;
  resaltado: boolean;
}) {
  const estado = estadoDespacho(pedido) ?? "por-despachar";
  const cliente = pedido.cliente;
  const lugar = [cliente?.address, cliente?.city].filter(Boolean).join(" · ");
  const aviso =
    estado === "despachado" ? <AvisoWhatsApp pedido={pedido} cliente={cliente} hoy={hoy} firma={firma} /> : null;

  return (
    <li
      className={`flex flex-col gap-4 rounded-xl border p-4 sm:p-5 ${resaltado ? "border-ok ring-2 ring-ok/25" : "border-line"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <Link href={`/pedidos/${pedido.id}`} className="text-lg font-bold tabular-nums hover:text-brand">
              Pedido #{pedido.number}
            </Link>
            <InsigniaDespacho estado={estado} />
          </p>
          {cliente ? (
            <Link href={`/clientes/${cliente.id}`} className="mt-1 block font-semibold break-words hover:text-brand">
              {cliente.trade_name || cliente.name}
            </Link>
          ) : (
            <p className="mt-1 text-ink-soft">Sin cliente</p>
          )}
          {lugar && <p className="text-sm break-words text-ink-soft">{lugar}</p>}
        </div>
        <div className="text-left sm:text-right">
          <p className="text-lg font-bold tabular-nums">{pesos(pedido.total)}</p>
          <p className="text-xs text-ink-soft tabular-nums">
            {pedido.productos} {pedido.productos === 1 ? "producto" : "productos"} · {pedido.unidades}{" "}
            {pedido.unidades === 1 ? "unidad" : "unidades"}
          </p>
        </div>
      </div>

      <p className="text-xs text-ink-soft">
        Vendedor: {pedido.vendedor?.name || pedido.vendedor?.email || "—"} · Pedido hecho {cuandoFue(pedido.created_at, hoy)}
      </p>

      <DatosDespacho pedido={pedido} hoy={hoy} />

      {puedeEditar ? (
        // "key": al cambiar de estado se empieza de cero (con los botones, no con un formulario abierto)
        <AccionesDespacho key={estado} id={pedido.id} estado={estado} hoy={hoy} volver="despachos" extra={aviso} />
      ) : (
        aviso && <div className="flex flex-wrap gap-2">{aviso}</div>
      )}
    </li>
  );
}
