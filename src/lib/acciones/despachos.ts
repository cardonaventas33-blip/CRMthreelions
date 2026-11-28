"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { EstadoAccion } from "@/lib/acciones/tipos";
import { esFecha, hoyColombia, instanteColombia, partesColombia, textoFecha } from "@/lib/agenda/fechas";
import { ENTREGA_PROPIA, OTRA_TRANSPORTADORA } from "@/lib/despachos/opciones";
import { obtenerUsuarioActual } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";

const SIN_PERMISO = "Solo el vendedor de este pedido o un administrador puede despacharlo.";
const CAMBIO = "El pedido cambió mientras tanto. Recarga la página.";
const uuid = z.uuid();

function mensajeError(error: { code?: string; message?: string }, porDefecto: string) {
  if (error.code === "P0001" && error.message) {
    return error.message.startsWith("Stock insuficiente")
      ? `${error.message}. Actualiza el stock en el Catálogo y vuelve a intentarlo.`
      : error.message;
  }
  if (error.code === "42501") return SIN_PERMISO;
  if (error.code === "23514") return "Algún dato es muy largo. Revísalo.";
  return porDefecto;
}

function refrescar(id: string) {
  revalidatePath("/despachos");
  revalidatePath(`/pedidos/${id}`);
  revalidatePath("/pedidos");
  revalidatePath("/clientes", "layout");
  revalidatePath("/catalogo", "layout");
  revalidatePath("/");
}

// A dónde volver: a la pestaña de Despachos donde quedó el pedido, o a la página del pedido
function volverA(volver: unknown, id: string, pestana: string) {
  return volver === "pedido" ? `/pedidos/${id}` : `/despachos?ver=${pestana}&pedido=${id}`;
}

// Si es hoy, la hora de ahora; si fue otro día, ese día al mediodía
function instanteDe(fecha: string, hoy: string) {
  return fecha === hoy ? new Date().toISOString() : instanteColombia(fecha, "12:00").toISOString();
}

const fechaCorta = (instante: string) => textoFecha(partesColombia(instante).fecha, { day: "numeric", month: "short" });

type Pedido = { id: string; status: string; user_id: string; created_at: string; dispatched_at: string | null };

// Lee el pedido y revisa que esta persona pueda cambiarlo (así los avisos son claros)
async function pedidoParaCambiar(id: string): Promise<{ pedido: Pedido } | { error: string }> {
  const yo = await obtenerUsuarioActual();
  if (!yo || yo.rol === "pendiente") return { error: SIN_PERMISO };
  if (!uuid.safeParse(id).success) return { error: "Datos no válidos." };

  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("orders")
    .select("id, status, user_id, created_at, dispatched_at")
    .eq("id", id)
    .maybeSingle();
  if (!data) return { error: "Ese pedido ya no existe." };
  if (yo.rol !== "admin" && data.user_id !== yo.id) return { error: SIN_PERMISO };
  if (data.status === "completado") return { error: "Este pedido ya se entregó." };
  if (data.status !== "enviado") return { error: "Este pedido está en borrador: primero hay que enviarlo." };
  return { pedido: data as Pedido };
}

const texto = (max: number, aviso: string) =>
  z
    .string()
    .trim()
    .max(max, aviso)
    .transform((v) => (v === "" ? null : v));

const esquemaDespacho = z.object({
  carrier: z.string().trim().min(1, "Elige la transportadora (o «Entrega propia»).").max(80, "El nombre de la transportadora es muy largo."),
  tracking_number: texto(80, "El número de guía es muy largo (máximo 80)."),
  fecha: z.string().refine(esFecha, "Elige la fecha del despacho."),
  dispatch_notes: texto(1000, "Las notas son muy largas (máximo 1000)."),
});

// Por despachar → Despachado: transportadora, número de guía, fecha y notas
export async function despacharPedido(_antes: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const leer = (clave: string) => String(datos.get(clave) ?? "");
  const elegida = leer("carrier");
  if (elegida === OTRA_TRANSPORTADORA && !leer("carrier_otra").trim()) return { error: "Escribe el nombre de la transportadora." };
  const r = esquemaDespacho.safeParse({
    carrier: elegida === OTRA_TRANSPORTADORA ? leer("carrier_otra") : elegida,
    tracking_number: elegida === ENTREGA_PROPIA ? "" : leer("tracking_number"),
    fecha: leer("fecha"),
    dispatch_notes: leer("dispatch_notes"),
  });
  if (!r.success) return { error: r.error.issues[0]?.message ?? "Revisa los datos del despacho." };

  const id = leer("id");
  const revisado = await pedidoParaCambiar(id);
  if ("error" in revisado) return revisado;
  const { pedido } = revisado;
  if (pedido.dispatched_at) return { error: "Este pedido ya se despachó." };

  const hoy = hoyColombia();
  if (r.data.fecha > hoy) return { error: "La fecha del despacho no puede ser después de hoy." };
  if (r.data.fecha < partesColombia(pedido.created_at).fecha) {
    return { error: `La fecha del despacho no puede ser antes del pedido (${fechaCorta(pedido.created_at)}).` };
  }

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("orders")
    .update({
      dispatched_at: instanteDe(r.data.fecha, hoy),
      carrier: r.data.carrier,
      tracking_number: r.data.tracking_number,
      dispatch_notes: r.data.dispatch_notes,
    })
    .eq("id", id)
    .eq("status", "enviado")
    .is("dispatched_at", null)
    .select("id");
  if (error) return { error: mensajeError(error, "No se pudo registrar el despacho.") };
  if (!data?.length) return { error: CAMBIO };

  refrescar(id);
  redirect(volverA(leer("volver"), id, "despachados"));
}

// Despachado → Por despachar (por si se registró por error); se borran la transportadora y la guía
export async function deshacerDespacho(id: string, volver: string): Promise<EstadoAccion> {
  const revisado = await pedidoParaCambiar(id);
  if ("error" in revisado) return revisado;
  if (!revisado.pedido.dispatched_at) return { error: "Este pedido todavía no se ha despachado." };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("orders")
    .update({ dispatched_at: null, carrier: null, tracking_number: null, dispatch_notes: null })
    .eq("id", id)
    .eq("status", "enviado")
    .not("dispatched_at", "is", null)
    .select("id");
  if (error) return { error: mensajeError(error, "No se pudo deshacer el despacho.") };
  if (!data?.length) return { error: CAMBIO };

  refrescar(id);
  redirect(volverA(volver, id, "por-despachar"));
}

const esquemaEntrega = z.object({
  received_by: texto(120, "El nombre es muy largo (máximo 120)."),
  fecha: z.string().refine(esFecha, "Elige la fecha de entrega."),
});

// Despachado → Entregado: el pedido queda completado y la base descuenta el stock
export async function entregarPedido(_antes: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const leer = (clave: string) => String(datos.get(clave) ?? "");
  const r = esquemaEntrega.safeParse({ received_by: leer("received_by"), fecha: leer("fecha") });
  if (!r.success) return { error: r.error.issues[0]?.message ?? "Revisa los datos de la entrega." };

  const id = leer("id");
  const revisado = await pedidoParaCambiar(id);
  if ("error" in revisado) return revisado;
  const { pedido } = revisado;
  if (!pedido.dispatched_at) return { error: "Primero despacha el pedido." };

  const hoy = hoyColombia();
  if (r.data.fecha > hoy) return { error: "La fecha de entrega no puede ser después de hoy." };
  if (r.data.fecha < partesColombia(pedido.dispatched_at).fecha) {
    return { error: `La fecha de entrega no puede ser antes del despacho (${fechaCorta(pedido.dispatched_at)}).` };
  }

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("orders")
    .update({ status: "completado", delivered_at: instanteDe(r.data.fecha, hoy), received_by: r.data.received_by })
    .eq("id", id)
    .eq("status", "enviado")
    .select("id");
  if (error) return { error: mensajeError(error, "No se pudo registrar la entrega.") };
  if (!data?.length) return { error: CAMBIO };

  refrescar(id);
  redirect(volverA(leer("volver"), id, "entregados"));
}
