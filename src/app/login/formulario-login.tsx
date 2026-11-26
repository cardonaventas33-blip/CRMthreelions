"use client";

import { BotonEnviar, Campo, CampoContrasena, Mensaje, useFormularioAccion } from "@/components/formulario";
import { iniciarSesion } from "@/lib/acciones/sesion";
import type { EstadoLogin } from "@/lib/acciones/tipos";

export function FormularioLogin() {
  const { estado, enviando, ref, alEnviar } = useFormularioAccion<EstadoLogin>(iniciarSesion, {});

  return (
    <form ref={ref} onSubmit={alEnviar} noValidate className="mt-6 flex flex-col gap-4">
      <Campo
        id="correo"
        etiqueta="Correo"
        name="correo"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
      />
      <CampoContrasena
        id="contrasena"
        etiqueta="Contraseña"
        name="contrasena"
        autoComplete="current-password"
        required
      />
      <Mensaje estado={{ error: estado.error }} />
      <BotonEnviar enviando={enviando} textoEnviando="Entrando…">
        Entrar
      </BotonEnviar>
    </form>
  );
}
