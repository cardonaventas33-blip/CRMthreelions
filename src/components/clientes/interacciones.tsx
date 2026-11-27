"use client";

import { useState } from "react";
import { BotonEnviar, CampoArea, CampoLista, Mensaje, useFormularioAccion } from "@/components/formulario";
import { registrarInteraccion } from "@/lib/acciones/clientes";
import type { EstadoAccion } from "@/lib/acciones/tipos";
import { TIPOS_INTERACCION } from "@/lib/clientes/opciones";

const opcionesTipo = Object.entries(TIPOS_INTERACCION).map(([valor, nombre]) => ({ valor, nombre }));

// Fecha y hora actual de Colombia en formato "2026-11-26T15:30"
function ahoraColombia() {
  const ahora = new Date(Date.now() - 5 * 60 * 60 * 1000);
  return ahora.toISOString().slice(0, 16);
}

export function FormularioInteraccion({ clienteId }: { clienteId: string }) {
  const { estado, enviando, ref, alEnviar } = useFormularioAccion<EstadoAccion>(registrarInteraccion, {}, {
    limpiarAlTerminar: true,
  });
  const [fecha] = useState(ahoraColombia);

  return (
    <form ref={ref} onSubmit={alEnviar} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <input type="hidden" name="client_id" value={clienteId} />
      <CampoLista id="int-tipo" etiqueta="Tipo" name="type" opciones={opcionesTipo} defaultValue="llamada" />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="int-fecha" className="text-sm font-medium">
          Fecha y hora
        </label>
        <input
          id="int-fecha"
          type="datetime-local"
          name="date"
          defaultValue={fecha}
          required
          className="h-12 w-full rounded-xl border border-line bg-paper px-3 text-base text-ink outline-none focus:border-ink focus:ring-2 focus:ring-brand/15"
        />
      </div>
      <div className="sm:col-span-2">
        <CampoArea id="int-nota" etiqueta="¿Qué hablaron?" name="note" maxLength={4000} required placeholder="Ej.: Pidió precios de baterías 12V; volver a llamar el lunes." />
      </div>
      <div className="flex flex-col gap-3 sm:col-span-2">
        <Mensaje estado={estado} />
        <BotonEnviar enviando={enviando} textoEnviando="Guardando…" className="sm:self-start">
          Registrar interacción
        </BotonEnviar>
      </div>
    </form>
  );
}
