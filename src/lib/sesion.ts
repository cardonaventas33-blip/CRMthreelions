import "server-only";
import { cache } from "react";
import type { Rol } from "@/lib/roles";
import { crearClienteServidor } from "@/lib/supabase/server";

export type UsuarioActual = { id: string; correo: string; nombre: string; rol: Rol };

// Quién está usando el CRM en esta visita (se consulta una sola vez por visita)
export const obtenerUsuarioActual = cache(async (): Promise<UsuarioActual | null> => {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) return null;

  const { data: perfil } = await supabase
    .from("profiles")
    .select("email, name, role")
    .eq("id", id)
    .maybeSingle();

  const correoSesion = typeof data.claims.email === "string" ? data.claims.email : "";
  return {
    id,
    correo: perfil?.email ?? correoSesion,
    nombre: perfil?.name ?? "",
    rol: (perfil?.role as Rol | undefined) ?? "pendiente",
  };
});
