"use client";

import { BotonEnviar, Mensaje, useFormularioAccion } from "@/components/formulario";
import { crearPedido } from "@/lib/acciones/pedidos";
import type { EstadoAccion } from "@/lib/acciones/tipos";

// Botón que crea un pedido en borrador para un cliente y abre el pedido
export function BotonCrearPedido({ clienteId, texto = "Crear pedido" }: { clienteId: string; texto?: string }) {
  const { estado, enviando, ref, alEnviar } = useFormularioAccion<EstadoAccion>(crearPedido, {});
  return (
    <form ref={ref} onSubmit={alEnviar} className="flex flex-col gap-2">
      <input type="hidden" name="client_id" value={clienteId} />
      <BotonEnviar enviando={enviando} textoEnviando="Creando…" className="h-11">
        {texto}
      </BotonEnviar>
      <Mensaje estado={estado} />
    </form>
  );
}
