import "server-only";
import type { EstadoPedido } from "@/lib/catalogo/opciones";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Despacho = {
  id: string;
  number: number;
  status: EstadoPedido;
  total: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  dispatched_at: string | null;
  carrier: string | null;
  tracking_number: string | null;
  dispatch_notes: string | null;
  delivered_at: string | null;
  received_by: string | null;
  cliente: {
    id: string;
    name: string;
    trade_name: string | null;
    city: string | null;
    address: string | null;
    phone: string | null;
    contactos: { first_name: string; last_name: string; phone: string | null; receives_sales: boolean }[];
  } | null;
  vendedor: { name: string; email: string } | null;
  productos: number;
  unidades: number;
};

const CAMPOS =
  "id, number, status, total, created_at, updated_at, user_id, " +
  "dispatched_at, carrier, tracking_number, dispatch_notes, delivered_at, received_by, " +
  "cliente:clients(id, name, trade_name, city, address, phone, contactos:client_contacts(first_name, last_name, phone, receives_sales)), " +
  "vendedor:profiles!orders_user_id_fkey(name, email), items:order_items(quantity)";

export const MAX_ENTREGADOS = 30;

// Los pedidos enviados (por despachar y despachados, los más viejos primero) y los últimos entregados
export async function listarDespachos() {
  const supabase = await crearClienteServidor();
  const [enviados, entregados] = await Promise.all([
    supabase.from("orders").select(CAMPOS).eq("status", "enviado").order("created_at", { ascending: true }).limit(500),
    supabase.from("orders").select(CAMPOS).eq("status", "completado").order("updated_at", { ascending: false }).limit(MAX_ENTREGADOS),
  ]);

  type Crudo = Omit<Despacho, "total" | "productos" | "unidades"> & { total: number | string; items: { quantity: number }[] };
  const limpiar = (filas: unknown): Despacho[] =>
    ((filas ?? []) as Crudo[]).map(({ items, ...p }) => ({
      ...p,
      total: Number(p.total),
      productos: items?.length ?? 0,
      unidades: (items ?? []).reduce((suma, i) => suma + i.quantity, 0),
    }));

  const lista = limpiar(enviados.data);
  return {
    porDespachar: lista.filter((p) => !p.dispatched_at),
    despachados: lista
      .filter((p) => p.dispatched_at)
      .sort((a, b) => (a.dispatched_at ?? "").localeCompare(b.dispatched_at ?? "")),
    entregados: limpiar(entregados.data),
    error: enviados.error || entregados.error ? "No se pudieron cargar los despachos." : null,
  };
}
