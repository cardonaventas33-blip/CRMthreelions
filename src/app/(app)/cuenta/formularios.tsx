"use client";

import {
  BotonEnviar,
  Campo,
  CampoContrasena,
  Mensaje,
  useFormularioAccion,
} from "@/components/formulario";
import { actualizarNombre, cambiarMiContrasena } from "@/lib/acciones/cuenta";
import type { EstadoAccion } from "@/lib/acciones/tipos";

export function FormularioNombre({ nombre }: { nombre: string }) {
  const { estado, enviando, ref, alEnviar } = useFormularioAccion<EstadoAccion>(actualizarNombre, {});

  return (
    <form ref={ref} onSubmit={alEnviar} noValidate className="mt-4 flex flex-col gap-4">
      <Campo
        id="mi-nombre"
        etiqueta="Nombre completo"
        name="nombre"
        autoComplete="name"
        defaultValue={nombre}
        maxLength={120}
        required
      />
      <Mensaje estado={estado} />
      <BotonEnviar enviando={enviando} textoEnviando="Guardando…">
        Guardar nombre
      </BotonEnviar>
    </form>
  );
}

export function FormularioContrasena() {
  const { estado, enviando, ref, alEnviar } = useFormularioAccion<EstadoAccion>(
    cambiarMiContrasena,
    {},
    { limpiarAlTerminar: true },
  );

  return (
    <form ref={ref} onSubmit={alEnviar} noValidate className="mt-4 flex flex-col gap-4">
      <CampoContrasena
        id="clave-nueva"
        etiqueta="Contraseña nueva"
        name="nueva"
        autoComplete="new-password"
        minLength={8}
        required
        ayuda="Mínimo 8 caracteres."
      />
      <CampoContrasena
        id="clave-repetir"
        etiqueta="Repite la contraseña nueva"
        name="repetir"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <Mensaje estado={estado} />
      <BotonEnviar enviando={enviando} textoEnviando="Cambiando…">
        Cambiar contraseña
      </BotonEnviar>
    </form>
  );
}
