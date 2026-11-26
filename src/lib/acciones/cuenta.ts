"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { EstadoAccion } from "@/lib/acciones/tipos";
import { obtenerUsuarioActual } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";

const SESION_TERMINADA = "Tu sesión terminó. Vuelve a entrar.";

const esquemaNombre = z
  .string()
  .trim()
  .min(2, "Escribe tu nombre (mínimo 2 letras).")
  .max(120, "El nombre es muy largo.");

export async function actualizarNombre(_antes: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  const yo = await obtenerUsuarioActual();
  if (!yo) return { error: SESION_TERMINADA };

  const r = esquemaNombre.safeParse(String(datos.get("nombre") ?? ""));
  if (!r.success) return { error: r.error.issues[0]?.message ?? "Revisa tu nombre." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("profiles").update({ name: r.data }).eq("id", yo.id);
  if (error) return { error: "No se pudo guardar tu nombre." };

  revalidatePath("/", "layout");
  return { ok: "Nombre guardado." };
}

const esquemaClave = z
  .object({
    nueva: z
      .string()
      .min(8, "La nueva contraseña debe tener al menos 8 caracteres.")
      .max(72, "La contraseña es muy larga."),
    repetir: z.string(),
  })
  .refine((d) => d.nueva === d.repetir, { error: "Las dos contraseñas no coinciden." });

export async function cambiarMiContrasena(
  _antes: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  const yo = await obtenerUsuarioActual();
  if (!yo) return { error: SESION_TERMINADA };

  const r = esquemaClave.safeParse({
    nueva: String(datos.get("nueva") ?? ""),
    repetir: String(datos.get("repetir") ?? ""),
  });
  if (!r.success) return { error: r.error.issues[0]?.message ?? "Revisa los datos." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.updateUser({ password: r.data.nueva });
  if (error) {
    if (error.code === "same_password") {
      return { error: "La nueva contraseña debe ser distinta a la actual." };
    }
    if (error.code === "weak_password") {
      return { error: "Esa contraseña es muy débil. Usa una más larga o con números." };
    }
    if (error.code === "reauthentication_needed") {
      return { error: "Por seguridad, cierra sesión, vuelve a entrar e inténtalo otra vez." };
    }
    return { error: "No se pudo cambiar la contraseña." };
  }
  return { ok: "Tu contraseña quedó cambiada." };
}
