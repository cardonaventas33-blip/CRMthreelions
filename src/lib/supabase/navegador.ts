import { createBrowserClient } from "@supabase/ssr";

// Cliente de Supabase en el navegador, con la sesión de quien está usando el CRM.
// Se usa para subir documentos y fotos directo al almacén privado (respeta los permisos).
export function crearClienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
