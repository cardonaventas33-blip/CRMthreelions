"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { EstadoLogin } from "@/lib/acciones/tipos";
import { crearClienteServidor } from "@/lib/supabase/server";

const correoValido = z.email().max(200);

export async function iniciarSesion(_antes: EstadoLogin, datos: FormData): Promise<EstadoLogin> {
  const correo = String(datos.get("correo") ?? "").trim().toLowerCase();
  const contrasena = String(datos.get("contrasena") ?? "");

  if (!correoValido.safeParse(correo).success || !contrasena || contrasena.length > 200) {
    return { error: "Escribe tu correo y tu contraseña.", correo };
  }

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email: correo, password: contrasena });
  if (error) {
    return {
      error:
        error.status === 429
          ? "Demasiados intentos. Espera un momento y vuelve a intentarlo."
          : "El correo o la contraseña no son correctos.",
      correo,
    };
  }
  redirect("/");
}

export async function cerrarSesion() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/login");
}
