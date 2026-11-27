import "server-only";
import { DIAS_PLAZO, type EstadoCliente, type TipoInteraccion } from "@/lib/clientes/opciones";
import { crearClienteServidor } from "@/lib/supabase/server";

export type ClienteFila = {
  id: string;
  name: string;
  nit_rut: string | null;
  trade_name: string | null;
  city: string | null;
  status: EstadoCliente;
  payment_term_days: number;
  rut_doc_url: string | null;
  camara_comercio_url: string | null;
  tratamiento_datos_url: string | null;
  sedes: number;
  contactos: number;
};

export type Filtros = { q?: string; ciudad?: string; plazo?: string; estado?: string };

// Quita caracteres que confunden la búsqueda (comas, paréntesis, comodines)
function limpiarBusqueda(texto: string) {
  return texto.replace(/[,()*%\\]/g, " ").trim().slice(0, 60);
}

export async function listarClientes(filtros: Filtros) {
  const supabase = await crearClienteServidor();

  let consulta = supabase
    .from("clients")
    .select(
      "id, name, nit_rut, trade_name, city, status, payment_term_days, rut_doc_url, camara_comercio_url, tratamiento_datos_url, client_sites(count), client_contacts(count)",
      { count: "exact" },
    )
    .order("name", { ascending: true })
    .limit(300);

  const q = limpiarBusqueda(filtros.q ?? "");
  if (q) consulta = consulta.or(`name.ilike.%${q}%,trade_name.ilike.%${q}%,nit_rut.ilike.%${q}%`);
  if (filtros.ciudad) consulta = consulta.ilike("city", limpiarBusqueda(filtros.ciudad));
  if (filtros.plazo && DIAS_PLAZO.includes(Number(filtros.plazo))) {
    consulta = consulta.eq("payment_term_days", Number(filtros.plazo));
  }
  if (filtros.estado && ["pendiente", "validado", "inactivo"].includes(filtros.estado)) {
    consulta = consulta.eq("status", filtros.estado);
  }

  const [{ data, count, error }, ciudades, totalGeneral] = await Promise.all([
    consulta,
    supabase.from("clients").select("city").not("city", "is", null),
    supabase.from("clients").select("id", { count: "exact", head: true }),
  ]);

  type Cruda = Omit<ClienteFila, "sedes" | "contactos"> & {
    client_sites: { count: number }[];
    client_contacts: { count: number }[];
  };

  const filas: ClienteFila[] = ((data ?? []) as Cruda[]).map(({ client_sites, client_contacts, ...resto }) => ({
    ...resto,
    sedes: client_sites?.[0]?.count ?? 0,
    contactos: client_contacts?.[0]?.count ?? 0,
  }));

  const listaCiudades = Array.from(
    new Set(((ciudades.data ?? []) as { city: string }[]).map((c) => c.city.trim()).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b, "es"));

  return {
    filas,
    encontrados: count ?? filas.length,
    total: totalGeneral.count ?? 0,
    ciudades: listaCiudades,
    error: error ? "No se pudo cargar la lista de clientes." : null,
  };
}

export type Sede = {
  id: string;
  name: string;
  address: string;
  city: string;
  traffic: string | null;
  opens_at: string | null;
  closes_at: string | null;
  employees: number | null;
  square_meters: number | null;
  notes: string | null;
  service_days: string[];
  products: string[];
  photo_url: string | null;
  created_at?: string;
};

export type Contacto = {
  id: string;
  site_id: string | null;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  role_title: string | null;
  receives_sales: boolean;
  receives_collections: boolean;
  created_at?: string;
};

export type ClienteDetalle = {
  id: string;
  name: string;
  nit_rut: string | null;
  trade_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  business_type: string | null;
  employees: number | null;
  payment_term_days: number;
  notes: string | null;
  status: EstadoCliente;
  photo_url: string | null;
  rut_doc_url: string | null;
  camara_comercio_url: string | null;
  tratamiento_datos_url: string | null;
  created_at: string;
  creador: { name: string; email: string } | null;
  sedes: Sede[];
  contactos: Contacto[];
};

export async function obtenerCliente(id: string): Promise<ClienteDetalle | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("clients")
    .select(
      "id, name, nit_rut, trade_name, email, phone, address, city, business_type, employees, payment_term_days, notes, status, photo_url, rut_doc_url, camara_comercio_url, tratamiento_datos_url, created_at, creador:profiles!clients_created_by_fkey(name, email), sedes:client_sites(id, name, address, city, traffic, opens_at, closes_at, employees, square_meters, notes, service_days, products, photo_url, created_at), contactos:client_contacts(id, site_id, first_name, last_name, phone, email, role_title, receives_sales, receives_collections, created_at)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;

  const cliente = data as unknown as ClienteDetalle;
  const porFecha = (a: { created_at?: string }, b: { created_at?: string }) =>
    (a.created_at ?? "").localeCompare(b.created_at ?? "");
  cliente.sedes.sort(porFecha);
  cliente.contactos.sort(porFecha);
  return cliente;
}

// Enlaces temporales (1 hora) para ver archivos del almacén privado
export async function enlacesFirmados(rutas: (string | null | undefined)[]) {
  const validas = rutas.filter((r): r is string => Boolean(r));
  if (validas.length === 0) return {} as Record<string, string>;
  const supabase = await crearClienteServidor();
  const { data } = await supabase.storage.from("clientes").createSignedUrls(validas, 3600);
  const mapa: Record<string, string> = {};
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) mapa[item.path] = item.signedUrl;
  }
  return mapa;
}

export type Interaccion = {
  id: string;
  type: TipoInteraccion;
  note: string;
  date: string;
  autor: { name: string; email: string } | null;
};

export async function listarInteracciones(clienteId: string): Promise<Interaccion[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("interactions")
    .select("id, type, note, date, autor:profiles!interactions_user_id_fkey(name, email)")
    .eq("client_id", clienteId)
    .order("date", { ascending: false })
    .limit(200);
  return (data ?? []) as unknown as Interaccion[];
}
