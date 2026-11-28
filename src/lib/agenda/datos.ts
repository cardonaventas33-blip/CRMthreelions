import "server-only";
import { cache } from "react";
import type { ResumenCompras } from "@/lib/agenda/compras";
import type { TipoCita } from "@/lib/agenda/opciones";
import { enlacesFirmados } from "@/lib/clientes/datos";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Cita = {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  notes: string | null;
  cancelled: boolean;
  kind: TipoCita;
  completed_at: string | null;
  user_id: string;
  client_id: string | null;
  site_id: string | null;
  cliente: {
    id: string;
    name: string;
    trade_name: string | null;
    city: string | null;
    address: string | null;
    phone: string | null;
    is_key: boolean;
    photo_url: string | null;
    contactos: {
      first_name: string;
      last_name: string;
      role_title: string | null;
      phone: string | null;
      receives_sales: boolean;
    }[];
  } | null;
  sede: { id: string; name: string; address: string; city: string; zone: string | null } | null;
  responsable: { name: string; email: string } | null;
};

const CAMPOS =
  "id, title, start_at, end_at, notes, cancelled, kind, completed_at, user_id, client_id, site_id, " +
  "cliente:clients!appointments_client_id_fkey(id, name, trade_name, city, address, phone, is_key, photo_url, contactos:client_contacts(first_name, last_name, role_title, phone, receives_sales)), " +
  "sede:client_sites!appointments_site_id_fkey(id, name, address, city, zone), " +
  "responsable:profiles!appointments_user_id_fkey(name, email)";

// Citas que empiezan entre "desde" y "hasta" (instantes ISO)
export async function listarCitas(filtros: {
  desde: string;
  hasta: string;
  usuarioId?: string;
  clienteId?: string;
  incluirCanceladas?: boolean;
  recientesPrimero?: boolean;
  limite?: number;
}) {
  const supabase = await crearClienteServidor();
  let consulta = supabase
    .from("appointments")
    .select(CAMPOS)
    .gte("start_at", filtros.desde)
    .lt("start_at", filtros.hasta)
    .order("start_at", { ascending: !filtros.recientesPrimero })
    .limit(filtros.limite ?? 500);
  if (filtros.usuarioId) consulta = consulta.eq("user_id", filtros.usuarioId);
  if (filtros.clienteId) consulta = consulta.eq("client_id", filtros.clienteId);
  if (!filtros.incluirCanceladas) consulta = consulta.eq("cancelled", false);

  const { data, error } = await consulta;
  return { citas: (data ?? []) as unknown as Cita[], error: error ? "No se pudo cargar la agenda." : null };
}

export const obtenerCita = cache(async (id: string): Promise<Cita | null> => {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("appointments").select(CAMPOS).eq("id", id).maybeSingle();
  return (data as unknown as Cita) ?? null;
});

// ---------- Historial de compras (para la ruta) ----------

const CAMPOS_RESUMEN = "client_id, compras, ultima_compra, ultimo_total, ultimo_pedido, promedio, frecuencia_dias";

function aResumen(fila: Record<string, unknown>): ResumenCompras {
  const numero = (v: unknown) => (v === null || v === undefined ? null : Number(v));
  return {
    compras: Number(fila.compras ?? 0),
    ultima_compra: (fila.ultima_compra as string | null) ?? null,
    ultimo_total: numero(fila.ultimo_total),
    ultimo_pedido: (fila.ultimo_pedido as string | null) ?? null,
    promedio: numero(fila.promedio),
    frecuencia_dias: numero(fila.frecuencia_dias),
  };
}

export type DatosCliente = {
  resumen: ResumenCompras | null;
  seLlevo: { cantidad: number; nombre: string }[];
  referenciasMas: number;
  foto: string | null;
};

const MAX_SE_LLEVO = 6;

// Para cada cliente de la agenda: su resumen de compras, lo que se llevó la última vez y su foto
export async function datosDeRuta(clientes: { id: string; photo_url: string | null }[]) {
  const mapa = new Map<string, DatosCliente>();
  const ids = [...new Set(clientes.map((c) => c.id))];
  if (ids.length === 0) return mapa;

  const supabase = await crearClienteServidor();
  const { data: filas } = await supabase.from("client_purchase_stats").select(CAMPOS_RESUMEN).in("client_id", ids);
  const resumenes = new Map((filas ?? []).map((f) => [f.client_id as string, aResumen(f)]));
  const pedidos = [...resumenes.values()].map((r) => r.ultimo_pedido).filter((p): p is string => Boolean(p));

  const [items, fotos] = await Promise.all([
    pedidos.length
      ? supabase.from("order_items").select("order_id, quantity, producto:products(name)").in("order_id", pedidos)
      : Promise.resolve({ data: [] }),
    enlacesFirmados(clientes.map((c) => c.photo_url)),
  ]);

  type Item = { order_id: string; quantity: number; producto: { name: string } | null };
  const porPedido = new Map<string, Item[]>();
  for (const item of (items.data ?? []) as unknown as Item[]) {
    porPedido.set(item.order_id, [...(porPedido.get(item.order_id) ?? []), item]);
  }

  for (const cliente of clientes) {
    if (mapa.has(cliente.id)) continue;
    const resumen = resumenes.get(cliente.id) ?? null;
    const lineas = (resumen?.ultimo_pedido ? porPedido.get(resumen.ultimo_pedido) ?? [] : []).sort(
      (a, b) => b.quantity - a.quantity,
    );
    mapa.set(cliente.id, {
      resumen,
      seLlevo: lineas.slice(0, MAX_SE_LLEVO).map((l) => ({ cantidad: l.quantity, nombre: l.producto?.name ?? "Producto" })),
      referenciasMas: Math.max(0, lineas.length - MAX_SE_LLEVO),
      foto: cliente.photo_url ? fotos[cliente.photo_url] ?? null : null,
    });
  }
  return mapa;
}

// Clientes activos sin ninguna visita (no cancelada) entre "desde" y "hasta"
export async function clientesSinProgramar(desde: string, hasta: string) {
  const supabase = await crearClienteServidor();
  const [{ data: clientes }, { data: programados }, { data: filas }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, trade_name, city, is_key")
      .neq("status", "inactivo")
      .order("name", { ascending: true })
      .limit(2000),
    supabase
      .from("appointments")
      .select("client_id")
      .gte("start_at", desde)
      .lt("start_at", hasta)
      .eq("cancelled", false)
      .not("client_id", "is", null)
      .limit(5000),
    supabase.from("client_purchase_stats").select(CAMPOS_RESUMEN).limit(5000),
  ]);
  const conVisita = new Set((programados ?? []).map((p) => p.client_id as string));
  const resumenes = new Map((filas ?? []).map((f) => [f.client_id as string, aResumen(f)]));
  return ((clientes ?? []) as { id: string; name: string; trade_name: string | null; city: string | null; is_key: boolean }[])
    .filter((c) => !conVisita.has(c.id))
    .map((c) => ({ ...c, resumen: resumenes.get(c.id) ?? null }));
}

// Personas que pueden ser responsables de una cita (vendedores y administradores)
export async function listarEquipo() {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("profiles")
    .select("id, name, email")
    .in("role", ["vendedor", "admin"])
    .order("name", { ascending: true });
  return ((data ?? []) as { id: string; name: string; email: string }[]).map((p) => ({
    id: p.id,
    nombre: p.name || p.email,
  }));
}

// Clientes (con sus sedes) para elegir en una cita
export async function clientesParaCita() {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("clients")
    .select("id, name, trade_name, city, sedes:client_sites(id, name, city)")
    .neq("status", "inactivo")
    .order("name", { ascending: true })
    .limit(2000);
  type Fila = {
    id: string;
    name: string;
    trade_name: string | null;
    city: string | null;
    sedes: { id: string; name: string; city: string }[];
  };
  return ((data ?? []) as unknown as Fila[]).map((c) => ({
    id: c.id,
    nombre: [c.trade_name || c.name, c.city].filter(Boolean).join(" · "),
    sedes: c.sedes.map((s) => ({ id: s.id, nombre: `${s.name} · ${s.city}` })),
  }));
}
