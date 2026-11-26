"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { EstadoAccion } from "@/lib/acciones/tipos";
import { obtenerUsuarioActual } from "@/lib/sesion";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { crearClienteServidor } from "@/lib/supabase/server";

const SOLO_ADMIN = "Solo un administrador puede hacer esto.";

async function esAdmin() {
  const yo = await obtenerUsuarioActual();
  return yo?.rol === "admin";
}

const esquemaNuevoUsuario = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "Escribe el nombre (mínimo 2 letras).")
    .max(120, "El nombre es muy largo."),
  correo: z.string().trim().toLowerCase().pipe(z.email({ error: "Ese correo no es válido." })),
  contrasena: z
    .string()
    .min(8, "La contraseña temporal debe tener al menos 8 caracteres.")
    .max(72, "La contraseña es muy larga."),
  rol: z.enum(["vendedor", "admin"], { error: "Elige un rol." }),
});

// El administrador crea la cuenta de alguien del equipo
export async function crearUsuario(_antes: EstadoAccion, datos: FormData): Promise<EstadoAccion> {
  if (!(await esAdmin())) return { error: SOLO_ADMIN };

  const r = esquemaNuevoUsuario.safeParse({
    nombre: String(datos.get("nombre") ?? ""),
    correo: String(datos.get("correo") ?? ""),
    contrasena: String(datos.get("contrasena") ?? ""),
    rol: String(datos.get("rol") ?? ""),
  });
  if (!r.success) return { error: r.error.issues[0]?.message ?? "Revisa los datos." };

  const { error } = await crearClienteAdmin().auth.admin.createUser({
    email: r.data.correo,
    password: r.data.contrasena,
    email_confirm: true,
    user_metadata: { name: r.data.nombre },
    app_metadata: { rol: r.data.rol },
  });
  if (error) {
    if (error.code === "weak_password") {
      return { error: "Esa contraseña es muy débil. Usa una más larga o con números." };
    }
    if (error.code === "email_exists") return { error: "Ya existe un usuario con ese correo." };
    return { error: "No se pudo crear el usuario. Intenta de nuevo." };
  }

  revalidatePath("/usuarios");
  return {
    ok: `Listo: ${r.data.nombre} ya puede entrar con ${r.data.correo} y la contraseña temporal.`,
  };
}

const esquemaRol = z.object({
  id: z.uuid(),
  rol: z.enum(["pendiente", "vendedor", "admin"]),
});

// Cambia el rol de alguien. La base de datos vuelve a comprobar que quien
// lo pide es administrador y que no se está quitando el rol a sí mismo.
export async function cambiarRol(id: string, rol: string): Promise<EstadoAccion> {
  const r = esquemaRol.safeParse({ id, rol });
  if (!r.success) return { error: "Datos no válidos." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc("cambiar_rol", { usuario: r.data.id, nuevo_rol: r.data.rol });
  if (error) {
    if (error.message.includes("ti mismo")) {
      return { error: "No puedes quitarte tu propio rol de administrador." };
    }
    if (error.code === "42501") return { error: SOLO_ADMIN };
    return { error: "No se pudo cambiar el rol." };
  }

  revalidatePath("/usuarios");
  return { ok: "Rol actualizado." };
}

const esquemaContrasena = z.object({
  id: z.uuid(),
  contrasena: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .max(72, "La contraseña es muy larga."),
});

// El administrador le da una contraseña nueva a alguien que olvidó la suya
export async function asignarContrasena(
  _antes: EstadoAccion,
  datos: FormData,
): Promise<EstadoAccion> {
  if (!(await esAdmin())) return { error: SOLO_ADMIN };

  const r = esquemaContrasena.safeParse({
    id: String(datos.get("id") ?? ""),
    contrasena: String(datos.get("contrasena") ?? ""),
  });
  if (!r.success) return { error: r.error.issues[0]?.message ?? "Revisa los datos." };

  const { error } = await crearClienteAdmin().auth.admin.updateUserById(r.data.id, {
    password: r.data.contrasena,
  });
  if (error) {
    return {
      error:
        error.code === "weak_password"
          ? "Esa contraseña es muy débil. Usa una más larga o con números."
          : "No se pudo cambiar la contraseña.",
    };
  }
  return { ok: "Contraseña cambiada. Compártela con la persona por un medio seguro." };
}
