import "server-only";
import { createClient } from "@supabase/supabase-js";

// Cliente con la clave SECRETA: se salta los permisos (RLS).
// Solo se usa en el servidor, para tareas de administrador ya verificadas
// (por ejemplo, crear usuarios). Nunca llega al navegador.
export function crearClienteAdmin() {
  const secreta = process.env.SUPABASE_SECRET_KEY;
  if (!secreta) {
    throw new Error("Falta SUPABASE_SECRET_KEY en las variables de entorno.");
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, secreta, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
