"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { EstadoAccion } from "@/lib/acciones/tipos";
import { leerPesos } from "@/lib/catalogo/opciones";
import { obtenerUsuarioActual } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";

const SOLO_ADMIN = "Solo un administrador puede cambiar el catálogo.";
const leer = (datos: FormData, clave: string) => String(datos.get(clave) ?? "");

async function esAdmin() {
  const yo = await obtenerUsuarioActual();
  return yo?.rol === "admin";
}

const opcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres.`)
    .transform((v) => (v === "" ? null : v));

const esquemaProducto = z.object({
  name: z.string().trim().min(1, "Escribe el nombre del producto.").max(200, "El nombre es muy largo."),
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9][A-Z0-9._\-/]{0,59}$/, "El código (SKU) solo lleva letras, números, puntos o guiones."),
  category: z.enum(["plumillas", "llantas", "baterias"], { error: "Elige la categoría." }),
  line: opcional(120),
  size: opcional(20),
  brand: opcional(60),
  price: z.number({ error: "Escribe el precio." }).int().min(0, "El precio no puede ser negativo.").max(999999999, "El precio es muy alto."),
  stock: z.number({ error: "Escribe el stock." }).int("El stock va sin decimales.").min(0, "El stock no puede ser negativo.").max(1000000, "El stock es muy alto."),
  description: opcional(2000),
  active: z.boolean(),
});

export async function guardarProducto(_antes: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  if (!(await esAdmin())) return { error: SOLO_ADMIN };

  const linea = leer(datos, "line").trim();
  const medida = leer(datos, "size").trim();
  const r = esquemaProducto.safeParse({
    // Si no escriben nombre, se arma con la línea y la medida: "Plumilla Siliconada 16""
    name: leer(datos, "name").trim() || `${linea} ${medida}`.trim(),
    sku: leer(datos, "sku"),
    category: leer(datos, "category"),
    line: linea,
    size: medida,
    brand: leer(datos, "brand"),
    price: leerPesos(leer(datos, "price")),
    stock: leer(datos, "stock").trim() === "" ? 0 : Number(leer(datos, "stock")),
    description: leer(datos, "description"),
    active: datos.get("active") === "on",
  });
  if (!r.success) return { error: r.error.issues[0]?.message ?? "Revisa los datos." };

  const supabase = await crearClienteServidor();
  const id = leer(datos, "id");

  if (id) {
    if (!z.uuid().safeParse(id).success) return { error: "Datos no válidos." };
    const { data, error } = await supabase.from("products").update(r.data).eq("id", id).select("id");
    if (error) {
      return { error: error.code === "23505" ? "Ya existe un producto con ese código (SKU)." : "No se pudo guardar el producto." };
    }
    if (!data?.length) return { error: SOLO_ADMIN };
    revalidatePath("/catalogo", "layout");
    return { ok: "Producto guardado." };
  }

  const { data, error } = await supabase.from("products").insert(r.data).select("id").single();
  if (error || !data) {
    return { error: error?.code === "23505" ? "Ya existe un producto con ese código (SKU)." : "No se pudo crear el producto." };
  }
  revalidatePath("/catalogo", "layout");
  redirect(`/catalogo/${data.id}/editar?nuevo=1`);
}

// Borra la foto del almacén solo si ningún otro producto la usa (la línea puede compartirla)
async function borrarFotoSiNadieLaUsa(ruta: string | null, productoId: string) {
  if (!ruta) return;
  const supabase = await crearClienteServidor();
  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("photo_url", ruta)
    .neq("id", productoId);
  if (!count) await supabase.storage.from("productos").remove([ruta]);
}

export async function registrarFotoProducto(productoId: string, ruta: string): Promise<EstadoAccion> {
  if (!(await esAdmin())) return { error: SOLO_ADMIN };
  if (!z.uuid().safeParse(productoId).success || !ruta.startsWith(`${productoId}/`) || ruta.includes("..")) {
    return { error: "Datos no válidos." };
  }
  const supabase = await crearClienteServidor();
  const { data: actual } = await supabase.from("products").select("photo_url").eq("id", productoId).maybeSingle();
  const { error } = await supabase.from("products").update({ photo_url: ruta }).eq("id", productoId);
  if (error) return { error: "No se pudo guardar la foto." };
  if (actual?.photo_url && actual.photo_url !== ruta) await borrarFotoSiNadieLaUsa(actual.photo_url, productoId);
  revalidatePath("/catalogo", "layout");
  return { ok: "Foto guardada." };
}

export async function quitarFotoProducto(productoId: string): Promise<EstadoAccion> {
  if (!(await esAdmin())) return { error: SOLO_ADMIN };
  if (!z.uuid().safeParse(productoId).success) return { error: "Datos no válidos." };
  const supabase = await crearClienteServidor();
  const { data: actual } = await supabase.from("products").select("photo_url").eq("id", productoId).maybeSingle();
  const { error } = await supabase.from("products").update({ photo_url: null }).eq("id", productoId);
  if (error) return { error: "No se pudo quitar la foto." };
  await borrarFotoSiNadieLaUsa(actual?.photo_url ?? null, productoId);
  revalidatePath("/catalogo", "layout");
  return { ok: "Foto quitada." };
}

// Pone la foto de este producto a todas las medidas de su misma línea
export async function usarFotoEnLinea(productoId: string): Promise<EstadoAccion> {
  if (!(await esAdmin())) return { error: SOLO_ADMIN };
  if (!z.uuid().safeParse(productoId).success) return { error: "Datos no válidos." };
  const supabase = await crearClienteServidor();
  const { data: producto } = await supabase.from("products").select("line, photo_url").eq("id", productoId).maybeSingle();
  if (!producto?.line || !producto.photo_url) return { error: "Este producto necesita una línea y una foto." };
  const { data, error } = await supabase
    .from("products")
    .update({ photo_url: producto.photo_url })
    .eq("line", producto.line)
    .is("photo_url", null)
    .select("id");
  if (error) return { error: "No se pudo copiar la foto." };
  revalidatePath("/catalogo", "layout");
  return { ok: data?.length ? `Foto puesta en ${data.length} medidas más de la línea.` : "Todas las medidas de la línea ya tenían foto." };
}

// Borra un producto creado por error. Si ya está en algún pedido, la base de datos
// no deja borrarlo (para no dañar los pedidos): en ese caso se desactiva.
export async function borrarProducto(productoId: string): Promise<EstadoAccion> {
  if (!(await esAdmin())) return { error: SOLO_ADMIN };
  if (!z.uuid().safeParse(productoId).success) return { error: "Datos no válidos." };
  const supabase = await crearClienteServidor();
  const { data: actual } = await supabase.from("products").select("photo_url").eq("id", productoId).maybeSingle();
  const { data, error } = await supabase.from("products").delete().eq("id", productoId).select("id");
  if (error) {
    return {
      error:
        error.code === "23503"
          ? "Este producto ya está en pedidos, así que no se puede borrar. Desmarca «Activo» y guarda para ocultarlo."
          : "No se pudo borrar el producto.",
    };
  }
  if (!data?.length) return { error: SOLO_ADMIN };
  await borrarFotoSiNadieLaUsa(actual?.photo_url ?? null, productoId);
  revalidatePath("/catalogo", "layout");
  redirect("/catalogo");
}
