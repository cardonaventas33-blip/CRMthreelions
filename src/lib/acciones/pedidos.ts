"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { EstadoAccion } from "@/lib/acciones/tipos";
import { PATRON_CATEGORIA, palabrasDeBusqueda } from "@/lib/catalogo/opciones";
import { obtenerUsuarioActual } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";

const SIN_PERMISO = "No puedes cambiar este pedido.";
const uuid = z.uuid();

async function puedeTrabajar() {
  const yo = await obtenerUsuarioActual();
  return yo !== null && yo.rol !== "pendiente";
}

// Los mensajes "P0001" los escribe la base de datos en español (estado, stock…)
function mensajeError(error: { code?: string; message: string }, porDefecto: string) {
  if (error.code === "P0001") return error.message;
  if (error.code === "42501") return SIN_PERMISO;
  return porDefecto;
}

function refrescar(pedidoId: string) {
  revalidatePath(`/pedidos/${pedidoId}`);
  revalidatePath("/pedidos");
  revalidatePath("/clientes", "layout");
  revalidatePath("/");
}

export type ProductoEncontrado = {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  size: string | null;
  line: string | null;
  photo_url: string | null;
};

// Buscador de productos para agregar a un pedido (busca en el servidor, sin tildes, máximo 30)
export async function buscarProductos(texto: string, categoria: string): Promise<ProductoEncontrado[]> {
  if (!(await puedeTrabajar())) return [];
  const supabase = await crearClienteServidor();
  let consulta = supabase
    .from("products")
    .select("id, name, sku, price, stock, size, line, photo_url")
    .eq("active", true)
    .order("name", { ascending: true })
    .limit(30);
  for (const palabra of palabrasDeBusqueda(typeof texto === "string" ? texto : "")) {
    consulta = consulta.ilike("search", `%${palabra}%`);
  }
  if (typeof categoria === "string" && PATRON_CATEGORIA.test(categoria)) consulta = consulta.eq("category", categoria);
  const { data } = await consulta;
  return ((data ?? []) as ProductoEncontrado[]).map((p) => ({ ...p, price: Number(p.price) }));
}

export async function crearPedido(_antes: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  if (!(await puedeTrabajar())) return { error: "Tu cuenta no tiene permiso para esto." };
  const clienteId = String(datos.get("client_id") ?? "");
  if (!uuid.safeParse(clienteId).success) return { error: "Elige un cliente." };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("orders").insert({ client_id: clienteId }).select("id").single();
  if (error || !data) return { error: mensajeError(error ?? { message: "" }, "No se pudo crear el pedido.") };

  refrescar(data.id);
  redirect(`/pedidos/${data.id}`);
}

export async function agregarProducto(pedidoId: string, productoId: string, cantidad: number): Promise<EstadoAccion> {
  if (!(await puedeTrabajar())) return { error: SIN_PERMISO };
  if (!uuid.safeParse(pedidoId).success || !uuid.safeParse(productoId).success) return { error: "Datos no válidos." };
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 100000) return { error: "La cantidad debe ser un número entero mayor que 0." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("order_items")
    .insert({ order_id: pedidoId, product_id: productoId, quantity: cantidad });

  if (error?.code === "23505") {
    // Ya estaba en el pedido: se suma la cantidad
    const { data: item } = await supabase
      .from("order_items")
      .select("id, quantity")
      .eq("order_id", pedidoId)
      .eq("product_id", productoId)
      .maybeSingle();
    if (!item) return { error: "No se pudo agregar el producto." };
    const { data, error: e2 } = await supabase
      .from("order_items")
      .update({ quantity: item.quantity + cantidad })
      .eq("id", item.id)
      .select("id");
    if (e2 || !data?.length) return { error: e2 ? mensajeError(e2, "No se pudo agregar el producto.") : SIN_PERMISO };
  } else if (error) {
    return { error: mensajeError(error, "No se pudo agregar el producto. Solo se agregan productos a pedidos en borrador.") };
  }

  refrescar(pedidoId);
  return { ok: "Producto agregado." };
}

export async function cambiarCantidad(pedidoId: string, itemId: string, cantidad: number): Promise<EstadoAccion> {
  if (!(await puedeTrabajar())) return { error: SIN_PERMISO };
  if (!uuid.safeParse(itemId).success || !uuid.safeParse(pedidoId).success) return { error: "Datos no válidos." };
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 100000) return { error: "La cantidad debe ser un número entero mayor que 0." };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("order_items")
    .update({ quantity: cantidad })
    .eq("id", itemId)
    .eq("order_id", pedidoId)
    .select("id");
  if (error) return { error: mensajeError(error, "No se pudo cambiar la cantidad.") };
  if (!data?.length) return { error: SIN_PERMISO };

  refrescar(pedidoId);
  return { ok: "Cantidad actualizada." };
}

export async function quitarProducto(pedidoId: string, itemId: string): Promise<EstadoAccion> {
  if (!(await puedeTrabajar())) return { error: SIN_PERMISO };
  if (!uuid.safeParse(itemId).success || !uuid.safeParse(pedidoId).success) return { error: "Datos no válidos." };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("order_items")
    .delete()
    .eq("id", itemId)
    .eq("order_id", pedidoId)
    .select("id");
  if (error) return { error: mensajeError(error, "No se pudo quitar el producto.") };
  if (!data?.length) return { error: SIN_PERMISO };

  refrescar(pedidoId);
  return { ok: "Producto quitado." };
}

export async function guardarNotasPedido(_antes: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  if (!(await puedeTrabajar())) return { error: SIN_PERMISO };
  const pedidoId = String(datos.get("id") ?? "");
  const notas = String(datos.get("notes") ?? "").trim();
  if (!uuid.safeParse(pedidoId).success) return { error: "Datos no válidos." };
  if (notas.length > 2000) return { error: "Las notas son muy largas (máximo 2000 caracteres)." };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("orders")
    .update({ notes: notas || null })
    .eq("id", pedidoId)
    .select("id");
  if (error) return { error: mensajeError(error, "No se pudieron guardar las notas.") };
  if (!data?.length) return { error: SIN_PERMISO };

  refrescar(pedidoId);
  return { ok: "Notas guardadas." };
}

export async function cambiarEstadoPedido(pedidoId: string, estado: string): Promise<EstadoAccion> {
  if (!(await puedeTrabajar())) return { error: SIN_PERMISO };
  const r = z.enum(["borrador", "enviado", "completado"]).safeParse(estado);
  if (!uuid.safeParse(pedidoId).success || !r.success) return { error: "Datos no válidos." };
  // Un pedido se completa al marcarlo como entregado en Despachos (así queda la transportadora y la guía)
  if (r.data === "completado") return { error: "Para completar un pedido, márcalo como entregado en Despachos." };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("orders")
    .update({ status: r.data })
    .eq("id", pedidoId)
    .select("id");
  if (error) return { error: mensajeError(error, "No se pudo cambiar el estado.") };
  if (!data?.length) return { error: SIN_PERMISO };

  refrescar(pedidoId);
  revalidatePath("/despachos");
  return { ok: r.data === "enviado" ? "Pedido enviado. Ya aparece en Despachos, por despachar." : "El pedido volvió a borrador." };
}

export async function borrarPedido(pedidoId: string): Promise<EstadoAccion> {
  if (!(await puedeTrabajar())) return { error: SIN_PERMISO };
  if (!uuid.safeParse(pedidoId).success) return { error: "Datos no válidos." };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("orders").delete().eq("id", pedidoId).select("id");
  if (error) return { error: mensajeError(error, "No se pudo borrar el pedido.") };
  if (!data?.length) return { error: "Solo se pueden borrar pedidos en borrador hechos por ti (o si eres administrador)." };

  revalidatePath("/pedidos");
  revalidatePath("/");
  redirect("/pedidos");
}
