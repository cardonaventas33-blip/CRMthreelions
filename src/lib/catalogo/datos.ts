import "server-only";
import { cache } from "react";
import {
  PATRON_CATEGORIA,
  palabrasDeBusqueda,
  valorMedida,
  type Categoria,
  type EstadoPedido,
} from "@/lib/catalogo/opciones";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Producto = {
  id: string;
  name: string;
  sku: string;
  category: string;
  line: string | null;
  size: string | null;
  brand: string | null;
  price: number;
  stock: number;
  photo_url: string | null;
  description: string | null;
  active: boolean;
  source: string | null;
};

const CAMPOS_PRODUCTO = "id, name, sku, category, line, size, brand, price, stock, photo_url, description, active, source";

// Categorías del catálogo en su orden (las mismas para toda la página)
export const listarCategorias = cache(async (): Promise<Categoria[]> => {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("product_categories")
    .select("slug, name, family, position")
    .order("position", { ascending: true })
    .order("name", { ascending: true });
  return (data ?? []) as Categoria[];
});

// La base ordena por categoría, línea y nombre. Aquí solo se ordenan las medidas
// dentro de una misma línea, para que 9" quede antes que 10"
export function ordenarProductos(productos: Producto[]) {
  return productos
    .map((p, i) => ({ p, i }))
    .sort((a, b) =>
      a.p.line && a.p.category === b.p.category && a.p.line === b.p.line
        ? valorMedida(a.p.size) - valorMedida(b.p.size) || a.i - b.i
        : a.i - b.i,
    )
    .map(({ p }) => p);
}

export const POR_PAGINA = 60;

// Catálogo por páginas (puede tener miles de productos)
// Cuántos productos no tienen precio todavía (el administrador los completa)
export async function contarSinPrecio() {
  const supabase = await crearClienteServidor();
  const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("price", 0);
  return count ?? 0;
}

export async function listarProductos(filtros: {
  q?: string;
  categoria?: string;
  incluirInactivos?: boolean;
  soloSinPrecio?: boolean;
  pagina?: number;
}) {
  const supabase = await crearClienteServidor();
  const pagina = Math.max(1, Math.floor(filtros.pagina ?? 1));
  const desde = (pagina - 1) * POR_PAGINA;

  let consulta = supabase
    .from("products")
    .select(CAMPOS_PRODUCTO, { count: "exact" })
    .order("category", { ascending: true })
    .order("line", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true })
    .range(desde, desde + POR_PAGINA - 1);
  // Busca sin tildes en nombre, código, línea, medida y marca; cada palabra debe aparecer
  for (const palabra of palabrasDeBusqueda(filtros.q ?? "")) consulta = consulta.ilike("search", `%${palabra}%`);
  if (filtros.categoria && PATRON_CATEGORIA.test(filtros.categoria)) consulta = consulta.eq("category", filtros.categoria);
  if (!filtros.incluirInactivos) consulta = consulta.eq("active", true);
  if (filtros.soloSinPrecio) consulta = consulta.eq("price", 0);

  const { data, count, error } = await consulta;
  const productos = ((data ?? []) as Producto[]).map((p) => ({ ...p, price: Number(p.price) }));
  return {
    productos: ordenarProductos(productos),
    total: count ?? productos.length,
    pagina,
    paginas: Math.max(1, Math.ceil((count ?? 0) / POR_PAGINA)),
    error: error ? "No se pudo cargar el catálogo." : null,
  };
}

export async function obtenerProducto(id: string): Promise<Producto | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("products").select(CAMPOS_PRODUCTO).eq("id", id).maybeSingle();
  return data ? { ...(data as Producto), price: Number((data as Producto).price) } : null;
}

// ---------- Pedidos ----------
export type PedidoFila = {
  id: string;
  number: number;
  status: EstadoPedido;
  total: number;
  created_at: string;
  user_id: string;
  cliente: { id: string; name: string; trade_name: string | null } | null;
  vendedor: { name: string; email: string } | null;
  productos: number;
};

export async function listarPedidos(filtros: { estado?: string; clienteId?: string; usuarioId?: string; limite?: number }) {
  const supabase = await crearClienteServidor();
  let consulta = supabase
    .from("orders")
    .select(
      "id, number, status, total, created_at, user_id, cliente:clients(id, name, trade_name), vendedor:profiles!orders_user_id_fkey(name, email), order_items(count)",
    )
    .order("created_at", { ascending: false })
    .limit(filtros.limite ?? 300);
  if (filtros.estado && ["borrador", "enviado", "completado"].includes(filtros.estado)) {
    consulta = consulta.eq("status", filtros.estado);
  }
  if (filtros.clienteId) consulta = consulta.eq("client_id", filtros.clienteId);
  if (filtros.usuarioId) consulta = consulta.eq("user_id", filtros.usuarioId);

  const { data, error } = await consulta;
  type Crudo = Omit<PedidoFila, "productos" | "total"> & { total: number | string; order_items: { count: number }[] };
  const pedidos: PedidoFila[] = ((data ?? []) as unknown as Crudo[]).map(({ order_items, ...p }) => ({
    ...p,
    total: Number(p.total),
    productos: order_items?.[0]?.count ?? 0,
  }));
  return { pedidos, error: error ? "No se pudo cargar la lista de pedidos." : null };
}

export type ItemPedido = {
  id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  producto: Pick<Producto, "id" | "name" | "sku" | "size" | "line" | "photo_url" | "stock" | "category"> | null;
};

export type PedidoDetalle = {
  id: string;
  number: number;
  status: EstadoPedido;
  total: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  // Despacho: transportadora, guía y entrega
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
    nit_rut: string | null;
    city: string | null;
    payment_term_days: number;
    phone: string | null;
    email: string | null;
    contactos: {
      first_name: string;
      last_name: string;
      role_title: string | null;
      phone: string | null;
      email: string | null;
      receives_sales: boolean;
    }[];
  } | null;
  vendedor: { name: string; email: string } | null;
  items: ItemPedido[];
};

// "cache": el título de la pestaña y la página comparten la misma consulta
export const obtenerPedido = cache(async (id: string): Promise<PedidoDetalle | null> => {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("orders")
    .select(
      "id, number, status, total, notes, created_at, updated_at, user_id, dispatched_at, carrier, tracking_number, dispatch_notes, delivered_at, received_by, cliente:clients(id, name, trade_name, nit_rut, city, payment_term_days, phone, email, contactos:client_contacts(first_name, last_name, role_title, phone, email, receives_sales)), vendedor:profiles!orders_user_id_fkey(name, email), items:order_items(id, quantity, unit_price, subtotal, producto:products(id, name, sku, size, line, photo_url, stock, category))",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const pedido = data as unknown as PedidoDetalle;
  pedido.total = Number(pedido.total);
  pedido.items = pedido.items
    .map((i) => ({ ...i, unit_price: Number(i.unit_price), subtotal: Number(i.subtotal) }))
    .sort((a, b) => (a.producto?.name ?? "").localeCompare(b.producto?.name ?? "", "es"));
  return pedido;
});
