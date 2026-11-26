// Crea (o convierte) un usuario ADMINISTRADOR del CRM usando la clave secreta.
// Lo usa scripts/crear-admin.ps1, que pide los datos sin mostrar la contraseña.
// Recibe los datos por variables de entorno; no guarda la contraseña en ningún lado.
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secreta = process.env.SUPABASE_SECRET_KEY;
const correo = (process.env.CRM_ADMIN_CORREO ?? "").trim().toLowerCase();
const nombre = (process.env.CRM_ADMIN_NOMBRE ?? "").trim().slice(0, 120);
const clave = process.env.CRM_ADMIN_CLAVE ?? "";

async function principal() {
  if (!url || !secreta) return "Faltan las claves de Supabase en .env.local.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return "Ese correo no parece valido.";
  if (clave.length < 8 || clave.length > 72) return "La contrasena debe tener entre 8 y 72 caracteres.";

  const admin = createClient(url, secreta, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: creado, error } = await admin.auth.admin.createUser({
    email: correo,
    password: clave,
    email_confirm: true,
    user_metadata: { name: nombre },
    app_metadata: { rol: "admin" },
  });
  if (!error) {
    // El perfil nace "pendiente": Supabase guarda el rol un instante después
    // de crear el usuario, así que aquí se marca como administrador aparte.
    const { error: errorPerfil } = await admin
      .from("profiles")
      .update(nombre ? { role: "admin", name: nombre } : { role: "admin" })
      .eq("id", creado.user.id);
    if (errorPerfil) return `Se creo el usuario, pero no se pudo marcar como administrador: ${errorPerfil.message}`;
    return null;
  }

  if (error.code !== "email_exists") return `No se pudo crear el usuario: ${error.message}`;

  // Ya existía: se vuelve administrador y queda con la contraseña que acabas de escribir
  const { data: lista, error: errorLista } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (errorLista) return `No se pudo revisar los usuarios: ${errorLista.message}`;
  const usuario = lista.users.find((u) => u.email?.toLowerCase() === correo);
  if (!usuario) return "Ese correo ya existe, pero no lo encontre.";

  const { error: errorAuth } = await admin.auth.admin.updateUserById(usuario.id, {
    password: clave,
    app_metadata: { ...usuario.app_metadata, rol: "admin" },
    user_metadata: { ...usuario.user_metadata, ...(nombre ? { name: nombre } : {}) },
  });
  if (errorAuth) return `No se pudo actualizar el usuario: ${errorAuth.message}`;

  const cambios = nombre ? { role: "admin", name: nombre } : { role: "admin" };
  const { error: errorPerfil } = await admin.from("profiles").update(cambios).eq("id", usuario.id);
  if (errorPerfil) return `No se pudo marcar como administrador: ${errorPerfil.message}`;
  return null;
}

const problema = await principal();
if (problema) {
  console.log(`\nXX  ${problema}`);
  process.exitCode = 1;
} else {
  console.log(`\nOK  Listo: ${correo} es ADMINISTRADOR del CRM.`);
  console.log("    Ya puedes entrar con ese correo y la contrasena que escribiste.");
}
