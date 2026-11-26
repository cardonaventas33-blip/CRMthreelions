import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cliente de Supabase para el servidor, con la sesión de quien visita.
// Respeta los permisos (RLS): cada persona solo ve lo que su rol permite.
export async function crearClienteServidor() {
  const almacen = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return almacen.getAll();
        },
        setAll(cookiesParaGuardar) {
          try {
            cookiesParaGuardar.forEach(({ name, value, options }) =>
              almacen.set(name, value, options),
            );
          } catch {
            // Desde una página no se pueden escribir cookies. No pasa nada:
            // el middleware renueva la sesión en cada visita.
          }
        },
      },
    },
  );
}
