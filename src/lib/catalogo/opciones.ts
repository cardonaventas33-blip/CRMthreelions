// Opciones del catálogo y de los pedidos (navegador y servidor)

// Familias: agrupan las categorías para el tablero (ventas por tipo de producto)
export const FAMILIAS = {
  llantas: "Llantas",
  baterias: "Baterías",
  plumillas: "Plumillas",
  otros: "Otros productos",
} as const;

export type Familia = keyof typeof FAMILIAS;

// Una categoría del catálogo (vienen de la tabla product_categories)
export type Categoria = { slug: string; name: string; family: Familia; position: number };

// Forma del código de una categoría: "llantas-moto", "aceites"…
export const PATRON_CATEGORIA = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const ESTADOS_PEDIDO = {
  borrador: "Borrador",
  enviado: "Enviado",
  completado: "Completado",
} as const;

export type EstadoPedido = keyof typeof ESTADOS_PEDIDO;

// La foto puede ser una ruta del almacén "productos" (subida aquí)
// o una dirección https de la página de donde se copió el producto
export function esFotoExterna(ruta: string | null | undefined) {
  return /^https:\/\//.test(ruta ?? "");
}

export function urlFotoProducto(ruta: string | null | undefined) {
  if (!ruta) return null;
  if (esFotoExterna(ruta)) return ruta;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/productos/${ruta}`;
}

// Palabras para buscar: sin tildes, en minúsculas y sin signos que confunden la búsqueda.
// Cada palabra debe aparecer en el producto: "bateria akt" encuentra "Batería ... AKT ...".
export function palabrasDeBusqueda(texto: string) {
  return texto
    .slice(0, 200)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[,()*%\\_"']/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6)
    .map((palabra) => palabra.slice(0, 40));
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
