// Comprueba las claves de Supabase de .env.local SIN mostrar sus valores.
// Uso: npm run verificar:supabase
import { existsSync } from "node:fs";

const envPath = process.argv[2] ?? ".env.local";
if (!existsSync(envPath)) {
  console.log(`No encuentro el archivo ${envPath}`);
  process.exit(1);
}
process.loadEnvFile(envPath);

const limpiar = (v) => (v ?? "").trim().replace(/^["']|["']$/g, "");
const url = limpiar(process.env.NEXT_PUBLIC_SUPABASE_URL);
const pub = limpiar(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
const sec = limpiar(process.env.SUPABASE_SECRET_KEY);

const tipo = (k) =>
  k.startsWith("sb_publishable_")
    ? "publicable (nueva)"
    : k.startsWith("sb_secret_")
      ? "secreta (nueva)"
      : k.startsWith("eyJ")
        ? "formato antiguo (anon / service_role)"
        : "formato desconocido";

let todoBien = true;
const linea = (nombre, bien, detalle) => {
  console.log(`${bien ? "OK" : "XX"}  ${nombre}: ${detalle}`);
  if (!bien) todoBien = false;
};

// 1) Direccion del proyecto
const urlOk = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url);
linea(
  "NEXT_PUBLIC_SUPABASE_URL",
  urlOk,
  !url ? "esta vacia" : urlOk ? "formato correcto" : "no parece https://xxxx.supabase.co",
);

// 2) Clave publicable
const pubOk = pub.length > 20 && !pub.startsWith("sb_secret_");
linea(
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  pubOk,
  !pub ? "esta vacia" : `${tipo(pub)}, ${pub.length} caracteres`,
);
if (pub.startsWith("sb_secret_"))
  console.log("    OJO: aqui quedo la clave SECRETA; esta casilla es para la publicable.");

// 3) Clave secreta
const secOk = sec.length > 20 && !sec.startsWith("sb_publishable_");
linea(
  "SUPABASE_SECRET_KEY",
  secOk,
  !sec ? "esta vacia" : `${tipo(sec)}, ${sec.length} caracteres`,
);
if (sec.startsWith("sb_publishable_"))
  console.log("    OJO: aqui quedo la clave PUBLICABLE; esta casilla es para la secreta.");

if (!todoBien) {
  console.log("\nHay algo por corregir antes de probar la conexion.");
  process.exit(1);
}

const base = url.replace(/\/$/, "");
const cabeceras = (k) =>
  k.startsWith("eyJ") ? { apikey: k, Authorization: `Bearer ${k}` } : { apikey: k };

// Prueba 1: la clave publicable puede hablar con Supabase
const r1 = await fetch(`${base}/auth/v1/settings`, { headers: cabeceras(pub) });
linea("Prueba de conexion con la clave publicable", r1.ok, `Supabase respondio ${r1.status}`);

// Prueba 2: la clave secreta tiene permisos de administrador
const r2 = await fetch(`${base}/auth/v1/admin/users?page=1&per_page=1`, {
  headers: cabeceras(sec),
});
linea("Prueba de permisos con la clave secreta", r2.ok, `Supabase respondio ${r2.status}`);

console.log(todoBien ? "\nTodo bien: las tres claves funcionan." : "\nHay algo por corregir (lineas con XX).");
process.exit(todoBien ? 0 : 1);
