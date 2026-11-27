// Opciones del catálogo y de los pedidos (navegador y servidor)

export const CATEGORIAS = {
  plumillas: "Plumillas",
  llantas: "Llantas",
  baterias: "Baterías",
} as const;

export type CategoriaProducto = keyof typeof CATEGORIAS;

export const ESTADOS_PEDIDO = {
  borrador: "Borrador",
  enviado: "Enviado",
  completado: "Completado",
} as const;

export type EstadoPedido = keyof typeof ESTADOS_PEDIDO;

// Las fotos de productos están en un almacén público (son fotos de catálogo)
export function urlFotoProducto(ruta: string | null | undefined) {
  if (!ruta) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/productos/${ruta}`;
}

// "$ 25.000", "25.000" o "25000" → 25000 (pesos enteros)
export function leerPesos(texto: string) {
  const limpio = texto.replace(/[^\d]/g, "");
  return limpio === "" ? Number.NaN : Number(limpio);
}

// Para ordenar medidas de menor a mayor: '14"' antes que '16"'
export function valorMedida(medida: string | null | undefined) {
  const n = Number.parseFloat((medida ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
}

export const TAMANO_MAXIMO_FOTO = 5 * 1024 * 1024;
export const TIPOS_FOTO = ["image/jpeg", "image/png", "image/webp"];
