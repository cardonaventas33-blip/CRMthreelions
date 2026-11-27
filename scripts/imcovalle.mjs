// Copiador del catálogo de IMCOVALLE (https://imcovalle.com) al CRM.
//
// IMPORTANTE: los términos de IMCOVALLE (punto 6, Propiedad Intelectual) prohíben reproducir sus
// textos e imágenes sin autorización escrita. Copiar solo cuando el dueño tenga esa autorización.
//
// Uso (PowerShell, en la carpeta del proyecto):
//   node scripts/imcovalle.mjs probar
//       Lee UNA página de su catálogo y muestra lo que entendió. No guarda nada.
//   node scripts/imcovalle.mjs copiar --autorizado
//       Lee todo el catálogo despacio (para no cargar su servidor) y guarda nombre, categoría y foto
//       de cada producto en datos/imcovalle/productos.json (esa carpeta no se sube a GitHub).
//       No copia precios ni existencias: esos los pone el dueño.
//   node scripts/imcovalle.mjs cargar [--simular] [--archivo ruta.json]
//       Agrega al CRM los productos del archivo que todavía no estén. Entran SIN precio y con stock 0.
//       Lo que ya está en el CRM no se toca (ni nombre, ni categoría, ni precio, ni stock, ni foto).
//       Con --simular solo muestra lo que haría, sin cambiar nada.
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const SITIO = "https://imcovalle.com";
const AGENTE = "Mozilla/5.0 (compatible; catalogo-crm/1.0)";
const PAUSA_MS = 600; // pausa entre tandas de páginas
const SIMULTANEAS = 2; // páginas que se piden a la vez
const MAX_PAGINAS = 2000; // tope de seguridad
const MAX_SUELTOS = 3000; // tope de productos que se completan uno por uno
const ARCHIVO = path.join("datos", "imcovalle", "productos.json");
const PATRON_CATEGORIA = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const args = process.argv.slice(2);
const comando = args[0];
const tiene = (bandera) => args.includes(bandera);
const valor = (bandera) => {
  const i = args.indexOf(bandera);
  return i >= 0 ? args[i + 1] : undefined;
};
const esperar = (ms) => new Promise((listo) => setTimeout(listo, ms));
const miles = new Intl.NumberFormat("es-CO");

// ---------- Leer páginas de IMCOVALLE ----------

async function traer(url) {
  for (let intento = 1; intento <= 4; intento++) {
    try {
      const r = await fetch(url, {
        headers: { "user-agent": AGENTE, accept: "text/html,application/xml" },
        signal: AbortSignal.timeout(90_000),
      });
      if (r.status === 404) return null;
      if (!r.ok) throw new Error(`respondió ${r.status}`);
      return await r.text();
    } catch (e) {
      if (intento === 4) throw new Error(`No se pudo leer ${url} (${e.message})`);
      await esperar(3000 * intento * intento); // espera más cada vez
    }
  }
  return null;
}

// Cada página trae los datos de sus productos dentro de trozos de JavaScript:
// self.__next_f.push([1,"..."]). Se juntan esos trozos y se buscan los objetos "product".
function datosEscondidos(html) {
  let texto = "";
  for (const m of html.matchAll(/self\.__next_f\.push\(\[1,("(?:[^"\\]|\\.)*")\]\)/g)) {
    try {
      texto += JSON.parse(m[1]);
    } catch {
      // trozo que no se pudo leer: se ignora
    }
  }
  return texto;
}

// Devuelve el objeto {...} que empieza en "inicio", contando llaves y respetando el texto entre comillas
function objetoDesde(texto, inicio) {
  let nivel = 0;
  let enTexto = false;
  let escapado = false;
  for (let i = inicio; i < texto.length; i++) {
    const c = texto[i];
    if (enTexto) {
      if (escapado) escapado = false;
      else if (c === "\\") escapado = true;
      else if (c === '"') enTexto = false;
    } else if (c === '"') enTexto = true;
    else if (c === "{") nivel++;
    else if (c === "}" && --nivel === 0) return texto.slice(inicio, i + 1);
  }
  return null;
}

function objetosProducto(html) {
  const texto = datosEscondidos(html);
  const marca = '"product":{';
  const productos = [];
  for (let i = texto.indexOf(marca); i >= 0; i = texto.indexOf(marca, i + marca.length)) {
    const crudo = objetoDesde(texto, i + marca.length - 1);
    if (!crudo) continue;
    try {
      const p = JSON.parse(crudo);
      if (typeof p.id === "string" && typeof p.title === "string") productos.push(p);
    } catch {
      // objeto incompleto: se ignora
    }
  }
  return productos;
}

// Solo lo que el CRM necesita: nombre, categoría y foto (sin precio ni existencias)
function resumir(p, slug = null) {
  return {
    id: p.id,
    slug: typeof p.slug === "string" ? p.slug : slug,
    nombre: String(p.title).replace(/\s+/g, " ").trim(),
    categoria: typeof p.category?.slug === "string" ? p.category.slug : null,
    categoriaNombre: typeof p.category?.name === "string" ? p.category.name : null,
    foto: typeof p.thumbnail === "string" && p.thumbnail.startsWith("https://") ? p.thumbnail : null,
  };
}

const paginaCatalogo = (n) => `${SITIO}/productos?sort=name_asc&page=${n}`;

async function probar() {
  const html = await traer(paginaCatalogo(1));
  const productos = objetosProducto(html ?? "").map((p) => resumir(p));
  console.log(`La página 1 trae ${productos.length} productos (deberían ser 24).`);
  for (const p of productos.slice(0, 3)) {
    console.log(`- ${p.nombre} | categoría: ${p.categoria ?? "(ninguna)"} | foto: ${p.foto ? "sí" : "no"}`);
  }
  const sinCategoria = productos.filter((p) => !p.categoria).length;
  console.log(sinCategoria ? `OJO: ${sinCategoria} productos sin categoría.` : "Todos traen categoría.");
  process.exitCode = productos.length > 0 ? 0 : 1;
}

async function copiar() {
  if (!tiene("--autorizado")) {
    console.log("Para copiar hace falta la autorización escrita de IMCOVALLE.");
    console.log("Cuando la tengas: node scripts/imcovalle.mjs copiar --autorizado");
    process.exitCode = 1;
    return;
  }

  // 1) Las páginas del catálogo, ordenadas por nombre (24 productos por página)
  const porId = new Map();
  let vacias = 0;
  for (let n = 1; n <= MAX_PAGINAS && vacias < 2; n += SIMULTANEAS) {
    const numeros = Array.from({ length: SIMULTANEAS }, (_, k) => n + k);
    const tanda = await Promise.all(numeros.map(async (k) => objetosProducto((await traer(paginaCatalogo(k))) ?? "")));
    for (const productos of tanda) {
      vacias = productos.length === 0 ? vacias + 1 : 0;
      for (const p of productos) porId.set(p.id, resumir(p));
    }
    if ((n + SIMULTANEAS - 1) % 40 === 0) console.log(`Página ${n + SIMULTANEAS - 1}: ${miles.format(porId.size)} productos`);
    await esperar(PAUSA_MS);
  }
  console.log(`Catálogo leído: ${miles.format(porId.size)} productos.`);

  // 2) El mapa del sitio dice qué productos existen: se completan los que no salieron en las páginas
  const mapa = (await traer(`${SITIO}/sitemap.xml`)) ?? "";
  const slugsMapa = [...mapa.matchAll(/<loc>https:\/\/imcovalle\.com\/producto\/([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  const copiados = new Set([...porId.values()].map((p) => p.slug));
  const faltan = slugsMapa.filter((s) => !copiados.has(s));
  console.log(`El mapa del sitio tiene ${miles.format(slugsMapa.length)} productos; faltan ${miles.format(faltan.length)}.`);

  const slugPorNombreCategoria = new Map([...porId.values()].filter((p) => p.categoria).map((p) => [p.categoriaNombre, p.categoria]));
  let completados = 0;
  for (const slug of faltan.slice(0, MAX_SUELTOS)) {
    const html = await traer(`${SITIO}/producto/${encodeURI(slug)}`);
    if (html) {
      // El producto principal es el que tiene el mismo nombre que la ficha (JSON-LD "Product")
      const nombreFicha = html.match(/"@type":"Product","name":"((?:[^"\\]|\\.)*)"/)?.[1];
      const objetos = objetosProducto(html);
      const principal = objetos.find((o) => nombreFicha && JSON.stringify(o.title) === `"${nombreFicha}"`) ?? objetos[0];
      if (principal && !porId.has(principal.id)) {
        const p = resumir(principal, slug);
        if (!p.categoria) {
          // La categoría sale de la ruta de navegación: Inicio > Catálogo > Categoría > Producto
          const migas = [...html.matchAll(/"@type":"ListItem","position":3,"name":"([^"]+)"/g)].map((m) => m[1]);
          p.categoria = migas.map((nombre) => slugPorNombreCategoria.get(nombre)).find(Boolean) ?? null;
        }
        porId.set(p.id, p);
        completados++;
      }
    }
    await esperar(PAUSA_MS);
  }
  if (faltan.length) console.log(`Completados uno por uno: ${miles.format(completados)}.`);

  // 3) Guardar
  const productos = [...porId.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  await mkdir(path.dirname(ARCHIVO), { recursive: true });
  await writeFile(ARCHIVO, JSON.stringify({ copiado: new Date().toISOString(), sitio: SITIO, total: productos.length, productos }, null, 1));
  const porCategoria = {};
  for (const p of productos) porCategoria[p.categoria ?? "(sin categoría)"] = (porCategoria[p.categoria ?? "(sin categoría)"] ?? 0) + 1;
  console.log(`\nListo: ${miles.format(productos.length)} productos guardados en ${ARCHIVO}`);
  for (const [categoria, n] of Object.entries(porCategoria).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${categoria}: ${miles.format(n)}`);
  }
}

// ---------- Cargar al CRM (Supabase) ----------

function familiaDe(slug) {
  if (slug.startsWith("llantas")) return "llantas";
  if (slug.startsWith("baterias")) return "baterias";
  if (slug.startsWith("plumillas")) return "plumillas";
  return "otros";
}

// Código del producto en el CRM: IMC- y el comienzo de su código en IMCOVALLE (sin repetir)
function skuPara(id, usados) {
  const base = id.replace(/[^0-9a-z]/gi, "").toUpperCase();
  for (let largo = 10; largo < base.length; largo += 2) {
    const sku = `IMC-${base.slice(0, largo)}`;
    if (!usados.has(sku)) return sku;
  }
  return `IMC-${base}`.slice(0, 60);
}

async function leerTodo(armarConsulta) {
  const filas = [];
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await armarConsulta().range(desde, desde + 999);
    if (error) throw new Error(error.message);
    filas.push(...data);
    if (data.length < 1000) return filas;
  }
}

async function cargar() {
  const archivo = valor("--archivo") ?? ARCHIVO;
  const simular = tiene("--simular");
  if (!existsSync(archivo)) {
    console.log(`No encuentro ${archivo}. Primero hay que copiar: node scripts/imcovalle.mjs copiar --autorizado`);
    process.exitCode = 1;
    return;
  }
  const { productos = [] } = JSON.parse(await readFile(archivo, "utf8"));

  process.loadEnvFile(".env.local");
  const limpiar = (v) => (v ?? "").trim().replace(/^["']|["']$/g, "");
  const supabase = createClient(limpiar(process.env.NEXT_PUBLIC_SUPABASE_URL), limpiar(process.env.SUPABASE_SECRET_KEY), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1) Categorías: las que no existan se crean (grupo "otros" si no es llanta, batería o plumilla)
  const { data: categorias, error: errorCategorias } = await supabase.from("product_categories").select("slug");
  if (errorCategorias) throw new Error(`No se pudieron leer las categorías (${errorCategorias.message})`);
  const existentes = new Set(categorias.map((c) => c.slug));
  const nuevasCategorias = new Map();
  for (const p of productos) {
    if (p.categoria && PATRON_CATEGORIA.test(p.categoria) && !existentes.has(p.categoria) && !nuevasCategorias.has(p.categoria)) {
      nuevasCategorias.set(p.categoria, {
        slug: p.categoria,
        name: String(p.categoriaNombre || p.categoria).slice(0, 80),
        family: familiaDe(p.categoria),
        position: 900,
      });
    }
  }

  // 2) Lo que ya está en el CRM
  const enCrm = await leerTodo(() => supabase.from("products").select("sku, source, source_id").order("id"));
  const skus = new Set(enCrm.map((f) => f.sku));
  const yaCopiados = new Set(enCrm.filter((f) => f.source === "imcovalle").map((f) => f.source_id));
  const idsArchivo = new Set(productos.map((p) => p.id));
  const yaNoEstan = [...yaCopiados].filter((id) => !idsArchivo.has(id)).length;

  // 3) Productos nuevos: sin precio y con stock 0 (el dueño los pone después)
  const nuevos = [];
  for (const p of productos) {
    if (typeof p.id !== "string" || yaCopiados.has(p.id)) continue;
    const nombre = String(p.nombre ?? "").replace(/\s+/g, " ").trim().slice(0, 200);
    if (!nombre) continue;
    const categoria = p.categoria && (existentes.has(p.categoria) || nuevasCategorias.has(p.categoria)) ? p.categoria : "otros";
    const sku = skuPara(p.id, skus);
    skus.add(sku);
    yaCopiados.add(p.id);
    nuevos.push({
      source: "imcovalle",
      source_id: p.id,
      sku,
      name: nombre,
      category: categoria,
      price: 0,
      stock: 0,
      photo_url: typeof p.foto === "string" && p.foto.startsWith("https://") ? p.foto : null,
      active: true,
    });
  }

  console.log(`En el archivo: ${miles.format(productos.length)} productos.`);
  console.log(`Nuevos para agregar: ${miles.format(nuevos.length)} (sin precio, stock 0).`);
  console.log(`Ya estaban en el CRM: ${miles.format(productos.length - nuevos.length)} (no se tocan).`);
  if (yaNoEstan) console.log(`Copiados antes que ya no están en IMCOVALLE: ${miles.format(yaNoEstan)} (no se tocan).`);
  if (nuevasCategorias.size) console.log(`Categorías nuevas: ${[...nuevasCategorias.keys()].join(", ")}`);
  if (simular) {
    console.log("\nSimulación: no se cambió nada.");
    return;
  }

  if (nuevasCategorias.size) {
    const { error } = await supabase.from("product_categories").upsert([...nuevasCategorias.values()], { onConflict: "slug", ignoreDuplicates: true });
    if (error) throw new Error(`No se pudieron crear las categorías (${error.message})`);
  }

  let agregados = 0;
  for (let i = 0; i < nuevos.length; i += 500) {
    const tanda = nuevos.slice(i, i + 500);
    const { error } = await supabase.from("products").upsert(tanda, { onConflict: "source,source_id", ignoreDuplicates: true });
    if (error) throw new Error(`Falló la tanda que empieza en el producto ${i + 1} (${error.message})`);
    agregados += tanda.length;
    console.log(`Agregados ${miles.format(agregados)} de ${miles.format(nuevos.length)}…`);
  }
  console.log(`\nListo: ${miles.format(agregados)} productos nuevos en el CRM.`);
}

const comandos = { probar, copiar, cargar };
if (!comandos[comando]) {
  console.log("Uso: node scripts/imcovalle.mjs probar | copiar --autorizado | cargar [--simular] [--archivo ruta.json]");
  process.exitCode = 1;
} else {
  try {
    await comandos[comando]();
  } catch (e) {
    console.error(`\nError: ${e.message}`);
    process.exitCode = 1;
  }
}
