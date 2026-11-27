"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Mensaje } from "@/components/formulario";
import { borrarProducto } from "@/lib/acciones/productos";
import type { EstadoAccion } from "@/lib/acciones/tipos";

// Botón para borrar un producto creado por error (pide confirmación)
export function BorrarProducto({ productoId, nombre }: { productoId: string; nombre: string }) {
  const [borrando, iniciar] = useTransition();
  const [mensaje, setMensaje] = useState<EstadoAccion>({});

  const borrar = () => {
    if (!window.confirm(`¿Borrar «${nombre}» del catálogo? Esto no se puede deshacer.`)) return;
    iniciar(async () => {
      // Si sale bien, el servidor nos lleva de vuelta al catálogo
      const r = await borrarProducto(productoId);
      if (r?.error) setMensaje(r);
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink-soft">
        Solo se puede borrar si nunca se ha usado en un pedido. Si ya se usó, desmarca «Activo» y guarda para ocultarlo.
      </p>
      <button
        type="button"
        onClick={borrar}
        disabled={borrando}
        className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl border border-brand/30 px-4 text-sm font-semibold text-brand hover:bg-brand-soft disabled:opacity-60"
      >
        <Trash2 className="size-4" aria-hidden />
        {borrando ? "Borrando…" : "Borrar producto"}
      </button>
      <Mensaje estado={mensaje} />
    </div>
  );
}
