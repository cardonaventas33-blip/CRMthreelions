"use client";

import { useState, useTransition } from "react";
import { KeyRound } from "lucide-react";
import {
  BotonEnviar,
  Campo,
  CampoContrasena,
  Mensaje,
  useFormularioAccion,
} from "@/components/formulario";
import type { EstadoAccion } from "@/lib/acciones/tipos";
import { asignarContrasena, cambiarRol, crearUsuario } from "@/lib/acciones/usuarios";
import { iniciales, type Rol } from "@/lib/roles";

const claseSelect = "h-12 rounded-xl border border-line bg-paper px-3 text-base text-ink";

export function FormularioNuevoUsuario() {
  const { estado, enviando, ref, alEnviar } = useFormularioAccion<EstadoAccion>(
    crearUsuario,
    {},
    { limpiarAlTerminar: true },
  );

  return (
    <form ref={ref} onSubmit={alEnviar} noValidate className="mt-4 flex flex-col gap-4">
      <Campo id="nuevo-nombre" etiqueta="Nombre" name="nombre" autoComplete="off" maxLength={120} required />
      <Campo
        id="nuevo-correo"
        etiqueta="Correo"
        name="correo"
        type="email"
        inputMode="email"
        autoComplete="off"
        required
      />
      <CampoContrasena
        id="nuevo-contrasena"
        etiqueta="Contraseña temporal"
        name="contrasena"
        autoComplete="new-password"
        minLength={8}
        required
        ayuda="Mínimo 8 caracteres. Compártela con la persona por un medio seguro."
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="nuevo-rol" className="text-sm font-medium">
          Rol
        </label>
        <select id="nuevo-rol" name="rol" defaultValue="vendedor" className={claseSelect}>
          <option value="vendedor">Vendedor</option>
          <option value="admin">Administrador</option>
        </select>
      </div>
      <Mensaje estado={estado} />
      <BotonEnviar enviando={enviando} textoEnviando="Creando…">
        Crear usuario
      </BotonEnviar>
    </form>
  );
}

export function FilaUsuario({
  id,
  nombre,
  correo,
  rol,
  esYo,
}: {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  esYo: boolean;
}) {
  const [rolActual, setRolActual] = useState<Rol>(rol);
  const [mensaje, setMensaje] = useState<EstadoAccion>({});
  const [guardando, iniciar] = useTransition();

  const alCambiarRol = (nuevo: Rol) => {
    const anterior = rolActual;
    setRolActual(nuevo);
    iniciar(async () => {
      const resultado = await cambiarRol(id, nuevo);
      setMensaje(resultado);
      if (resultado.error) setRolActual(anterior);
    });
  };

  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:px-5">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand">
          {iniciales({ nombre, correo })}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">
            {nombre || "Sin nombre"}
            {esYo && <span className="ml-1 text-xs font-normal text-ink-soft">(tú)</span>}
          </p>
          <p className="truncate text-sm text-ink-soft">{correo}</p>
        </div>
        <label htmlFor={`rol-${id}`} className="sr-only">
          Rol de {nombre || correo}
        </label>
        <select
          id={`rol-${id}`}
          value={rolActual}
          disabled={guardando || esYo}
          onChange={(e) => alCambiarRol(e.target.value as Rol)}
          className="h-11 shrink-0 rounded-xl border border-line bg-paper px-2 text-sm text-ink disabled:opacity-60"
        >
          <option value="vendedor">Vendedor</option>
          <option value="admin">Administrador</option>
          <option value="pendiente">Sin acceso</option>
        </select>
      </div>
      <Mensaje estado={mensaje} />
      {!esYo && <NuevaContrasena id={id} />}
    </li>
  );
}

// El administrador le pone una contraseña nueva a alguien que olvidó la suya
function NuevaContrasena({ id }: { id: string }) {
  const { estado, enviando, ref, alEnviar } = useFormularioAccion<EstadoAccion>(
    asignarContrasena,
    {},
    { limpiarAlTerminar: true },
  );

  return (
    <details className="rounded-xl border border-line">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-xl px-3 text-sm font-medium hover:bg-mist [&::-webkit-details-marker]:hidden">
        <KeyRound className="size-4 text-ink-soft" aria-hidden />
        Darle una contraseña nueva
      </summary>
      <form ref={ref} onSubmit={alEnviar} noValidate className="flex flex-col gap-3 border-t border-line p-3">
        <input type="hidden" name="id" value={id} />
        <CampoContrasena
          id={`clave-${id}`}
          etiqueta="Contraseña nueva"
          name="contrasena"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <Mensaje estado={estado} />
        <BotonEnviar enviando={enviando} textoEnviando="Guardando…">
          Guardar contraseña
        </BotonEnviar>
      </form>
    </details>
  );
}
