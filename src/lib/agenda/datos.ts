import "server-only";
import { cache } from "react";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Cita = {
  id: string;
  title: string;
  start_at: string;
  end_at: string;
  notes: string | null;
  cancelled: boolean;
  user_id: string;
  client_id: string | null;
  cliente: {
    id: string;
    name: string;
    trade_name: string | null;
    city: string | null;
    address: string | null;
    phone: string | null;
    contactos: { first_name: string; phone: string | null; receives_sales: boolean }[];
  } | null;
  responsable: { name: string; email: string } | null;
};

const CAMPOS =
  "id, title, start_at, end_at, notes, cancelled, user_id, client_id, cliente:clients(id, name, trade_name, city, address, phone, contactos:client_contacts(first_name, phone, receives_sales)), responsable:profiles!appointments_user_id_fkey(name, email)";

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

// Clientes para elegir en una cita
export async function clientesParaCita() {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("clients")
    .select("id, name, trade_name, city")
    .neq("status", "inactivo")
    .order("name", { ascending: true })
    .limit(2000);
  return ((data ?? []) as { id: string; name: string; trade_name: string | null; city: string | null }[]).map((c) => ({
    id: c.id,
    nombre: [c.trade_name || c.name, c.city].filter(Boolean).join(" · "),
  }));
}
