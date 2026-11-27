// Monta en el catálogo las plumillas IMCOV de Three Lions: cada medida es un producto
// SIN precio y con stock 0 (el dueño los pone después), con la foto de su línea.
//
// Uso (PowerShell, en la carpeta del proyecto):
//   node scripts/cargar-plumillas.mjs --simular   → muestra lo que haría, sin cambiar nada
//   node scripts/cargar-plumillas.mjs             → sube las fotos y crea los productos
// Si un código ya existe en el catálogo no se toca: se puede correr varias veces sin repetir nada.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// Las 5 líneas que mostró el dueño (fotos en fotos-catalogo/plumillas)
const LINEAS = [
  { linea: "Plumilla Multiacople Trasera", codigo: "MAT", desde: 10, hasta: 16, foto: "plumilla-multiacople-trasera.jpg" },
  { linea: "Plumilla Multiacople Delantera", codigo: "MAD", desde: 14, hasta: 26, foto: "plumilla-multiacople-delantera.jpg" },
  { linea: "Plumilla Metálica", codigo: "MET", desde: 14, hasta: 26, foto: "plumilla-metalica.jpg" },
  { linea: "Plumilla Aerodinámica De Lujo", codigo: "AER", desde: 14, hasta: 26, foto: "plumilla-aerodinamica-de-lujo.jpg" },
  { linea: "Plumilla Siliconada", codigo: "SIL", desde: 14, hasta: 26, foto: "plumilla-siliconada.jpg" },
];

// Medida comercial en milímetros de cada largo en pulgadas
const MILIMETROS = {
  10: 250, 11: 280, 12: 300, 13: 330, 14: 350, 15: 380, 16: 400, 17: 430, 18: 450,
  19: 480, 20: 500, 21: 530, 22: 550, 23: 580, 24: 600, 25: 630, 26: 650,
};

const CARPETA_FOTOS = path.join("fotos-catalogo", "plumillas");
const simular = process.argv.includes("--simular");

process.loadEnvFile(".env.local");
const limpiar = (v) => (v ?? "").trim().replace(/^["']|["']$/g, "");
const supabase = createClient(limpiar(process.env.NEXT_PUBLIC_SUPABASE_URL), limpiar(process.env.SUPABASE_SECRET_KEY), {
  auth: { persistSession: false, autoRefreshToken: false },
});

const medidas = (l) => Array.from({ length: l.hasta - l.desde + 1 }, (_, i) => l.desde + i);
const codigo = (l, n) => `PLU-${l.codigo}-${n}`;

try {
  // 1) ¿Cuáles ya están en el catálogo?
  const todos = LINEAS.flatMap((l) => medidas(l).map((n) => codigo(l, n)));
  const { data: existentes, error: errorLeer } = await supabase.from("products").select("sku").in("sku", todos);
  if (errorLeer) throw new Error(`No se pudo leer el catálogo (${errorLeer.message})`);
  const yaEstan = new Set(existentes.map((p) => p.sku));

  // 2) Fotos: una por línea, compartida por todas sus medidas
  for (const l of LINEAS) {
    l.ruta = `lineas/${l.foto}`;
    if (simular) continue;
    const archivo = await readFile(path.join(CARPETA_FOTOS, l.foto));
    const { error } = await supabase.storage
      .from("productos")
      .upload(l.ruta, archivo, { contentType: "image/jpeg", upsert: true });
    if (error) throw new Error(`No se pudo subir la foto ${l.foto} (${error.message})`);
    console.log(`Foto subida: ${l.linea}`);
  }

  // 3) Productos nuevos
  const nuevos = LINEAS.flatMap((l) =>
    medidas(l)
      .filter((n) => !yaEstan.has(codigo(l, n)))
      .map((n) => ({
        sku: codigo(l, n),
        name: `${l.linea} ${n}"`,
        category: "plumillas",
        line: l.linea,
        size: `${n}"`,
        brand: "IMCOV",
        price: 0,
        stock: 0,
        photo_url: l.ruta,
        description: `Plumilla IMCOV de ${n} pulgadas (${MILIMETROS[n]} mm).`,
        active: true,
      })),
  );

  console.log(`Plumillas en total: ${todos.length}. Ya estaban: ${yaEstan.size}. Nuevas para crear: ${nuevos.length}.`);
  for (const l of LINEAS) console.log(`  ${l.linea}: ${l.desde}" a ${l.hasta}" (${medidas(l).length} medidas)`);
  if (simular) {
    console.log("\nSimulación: no se cambió nada.");
  } else if (nuevos.length) {
    const { error } = await supabase.from("products").insert(nuevos);
    if (error) throw new Error(`No se pudieron crear las plumillas (${error.message})`);
    console.log(`\nListo: ${nuevos.length} plumillas creadas (sin precio, stock 0).`);
  } else {
    console.log("\nNo había nada nuevo para crear.");
  }
} catch (e) {
  console.error(`\nError: ${e.message}`);
  process.exitCode = 1;
}
