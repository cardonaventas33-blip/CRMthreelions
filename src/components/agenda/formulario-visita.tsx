"use client";

import { BotonEnviar, CampoArea, Mensaje, useFormularioAccion } from "@/components/formulario";
import { registrarVisita } from "@/lib/acciones/citas";
import type { EstadoAccion } from "@/lib/acciones/tipos";

// "¿Cómo te fue?": se guarda en el historial del cliente y la visita queda hecha
export function FormularioVisita({ citaId }: { citaId: string }) {
  const { estado, enviando, ref, alEnviar } = useFormularioAccion<EstadoAccion>(registrarVisita, {});
  return (
    <form ref={ref} onSubmit={alEnviar} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="id" value={citaId} />
      <CampoArea
        id="visita-nota"
        etiqueta="¿Cómo te fue en la visita? *"
        name="nota"
        rows={5}
        maxLength={4000}
        required
        placeholder="Ej.: Hablé con el jefe de compras. Necesita plumillas de 16 y 20 pulgadas; volver en 15 días."
        ayuda="Queda en el historial del cliente (pestaña Interacciones) y la visita se marca como hecha."
      />
      <Mensaje estado={estado} />
      <BotonEnviar enviando={enviando} textoEnviando="Guardando…" className="sm:self-start">
        Guardar visita
      </BotonEnviar>
    </form>
  );
}
