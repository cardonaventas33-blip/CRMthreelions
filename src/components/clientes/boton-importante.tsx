"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { marcarImportante } from "@/lib/acciones/clientes";
import type { EstadoAccion } from "@/lib/acciones/tipos";

// Solo para el administrador: marcar o quitar "cliente importante" (estrella en la agenda)
export function BotonImportante({ clienteId, importante }: { clienteId: string; importante: boolean }) {
  const [pendiente, iniciar] = useTransition();
  const [mensaje, setMensaje] = useState<EstadoAccion>({});

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={pendiente}
        aria-pressed={importante}
        onClick={() => iniciar(async () => setMensaje(await marcarImportante(clienteId, !importante)))}
        className="inline-flex h-11 items-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold hover:bg-mist disabled:opacity-60"
      >
        <Star className={`size-4 ${importante ? "fill-amber-400 text-amber-500" : "text-ink-soft"}`} aria-hidden />
        {importante ? "Cliente importante" : "Marcar importante"}
      </button>
      {mensaje.error && (
        <p role="alert" className="text-xs text-brand">
          {mensaje.error}
        </p>
      )}
    </div>
  );
}
