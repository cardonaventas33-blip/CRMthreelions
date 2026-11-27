import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import type { PedidoDetalle } from "@/lib/catalogo/datos";
import { pesos } from "@/lib/clientes/opciones";
import { enlaceCorreo, enlaceWhatsApp, esCorreo, tieneWhatsApp } from "@/lib/contacto";

const MAX_LINEAS = 30;

// El pedido escrito como mensaje (sirve igual para WhatsApp y para correo)
function textoPedido(pedido: PedidoDetalle, saludo: string, firma: string) {
  const lineas = pedido.items
    .slice(0, MAX_LINEAS)
    .map((i) => `• ${i.quantity} × ${i.producto?.name ?? "Producto"}${i.producto?.sku ? ` (${i.producto.sku})` : ""} — ${pesos(i.subtotal)}`);
  if (pedido.items.length > MAX_LINEAS) lineas.push(`… y ${pedido.items.length - MAX_LINEAS} productos más`);
  return [
    saludo,
    "",
    `Le comparto el pedido #${pedido.number} de Three Lions SAS:`,
    "",
    ...lineas,
    "",
    `Total (IVA incluido): ${pesos(pedido.total)}`,
    ...(pedido.notes ? ["", `Notas: ${pedido.notes}`] : []),
    "",
    "Quedo atento a cualquier duda.",
    firma,
  ].join("\n");
}

type Destino = { clave: string; nombre: string; detalle: string; telefono: string | null; correo: string | null; saludo: string };

// A quién se le puede enviar: primero los contactos comerciales, luego los demás y al final la empresa
function destinosDe(cliente: NonNullable<PedidoDetalle["cliente"]>): Destino[] {
  const contactos = [...cliente.contactos].sort((a, b) => Number(b.receives_sales) - Number(a.receives_sales));
  const destinos: Destino[] = contactos.map((c, i) => ({
    clave: `contacto-${i}`,
    nombre: `${c.first_name} ${c.last_name}`.trim(),
    detalle: [c.role_title, c.receives_sales ? "Comercial" : null].filter(Boolean).join(" · "),
    telefono: tieneWhatsApp(c.phone) ? c.phone : null,
    correo: esCorreo(c.email) ? c.email.trim() : null,
    saludo: `Hola ${c.first_name},`,
  }));
  destinos.push({
    clave: "empresa",
    nombre: cliente.trade_name || cliente.name,
    detalle: "Teléfono y correo de la empresa",
    telefono: tieneWhatsApp(cliente.phone) ? cliente.phone : null,
    correo: esCorreo(cliente.email) ? cliente.email.trim() : null,
    saludo: "Hola,",
  });
  return destinos.filter((d) => d.telefono || d.correo);
}

const boton = "inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-medium hover:bg-mist";

// "Enviar al cliente": abre WhatsApp o el correo del vendedor con el pedido ya escrito
export function EnviarPedido({ pedido, firma }: { pedido: PedidoDetalle; firma: string }) {
  const cliente = pedido.cliente;
  const destinos = cliente ? destinosDe(cliente) : [];
  const asunto = `Pedido #${pedido.number} · Three Lions SAS`;

  return (
    <section className="rounded-xl border border-line p-4 sm:p-5">
      <h2 className="font-semibold">Enviar al cliente</h2>
      <p className="mt-1 text-sm text-ink-soft">Abre WhatsApp o tu correo con el pedido ya escrito. Solo lo revisas y lo envías.</p>

      {pedido.items.length === 0 ? (
        <p className="mt-3 text-sm text-ink-soft">Agrega productos para poder enviarlo.</p>
      ) : destinos.length === 0 ? (
        <p className="mt-3 text-sm text-ink-soft">
          Este cliente no tiene celular ni correo registrados.{" "}
          {cliente && (
            <Link href={`/clientes/${cliente.id}/editar`} className="font-semibold text-brand hover:underline">
              Agrégalos en su ficha
            </Link>
          )}
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {destinos.map((d) => {
            const texto = textoPedido(pedido, d.saludo, firma);
            return (
              <li key={d.clave} className="flex flex-col gap-2 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold break-words">{d.nombre}</p>
                  {d.detalle && <p className="text-xs text-ink-soft">{d.detalle}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {d.telefono && (
                    <a href={enlaceWhatsApp(d.telefono, texto)} target="_blank" rel="noopener noreferrer" className={boton}>
                      <MessageCircle className="size-4 text-ok" aria-hidden />
                      WhatsApp
                    </a>
                  )}
                  {d.correo && (
                    <a href={enlaceCorreo(d.correo, asunto, texto)} className={boton}>
                      <Mail className="size-4" aria-hidden />
                      Correo
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {pedido.status === "borrador" && pedido.items.length > 0 && destinos.length > 0 && (
        <p className="mt-2 text-xs text-ink-soft">Cuando se lo envíes, toca &quot;Enviar pedido&quot; para marcarlo como enviado.</p>
      )}
    </section>
  );
}
