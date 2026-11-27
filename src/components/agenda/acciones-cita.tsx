"use client";

import { useState, useTransition } from "react";
import { CalendarCheck, CalendarX, Trash2 } from "lucide-react";
import { Mensaje } from "@/components/formulario";
import { borrarCita, cancelarCita } from "@/lib/acciones/citas";
import type { EstadoAccion } from "@/lib/acciones/tipos";

// Cancelar (queda tachada en la agenda), devolverla a la agenda o borrarla si se creó por error
export function AccionesCita({ id, cancelada }: { id: string; cancelada: boolean }) {
  const [pendiente, iniciar] = useTransition();
  const [mensaje, setMensaje] = useState<EstadoAccion>({});
  const boton = "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-60";

  const cambiar = () => {
    if (!cancelada && !window.confirm("¿Cancelar esta cita? Seguirá en la agenda, tachada.")) return;
    iniciar(async () => setMensaje(await cancelarCita(id, !cancelada)));
  };

  const borrar = () => {
    if (!window.confirm("¿Borrar esta cita? Esto no se puede deshacer. Si solo no se va a hacer, mejor cancélala.")) return;
    iniciar(async () => {
      // Si sale bien, el servidor nos lleva a la agenda
      const r = await borrarCita(id);
      if (r?.error) setMensaje(r);
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={cambiar} disabled={pendiente} className={`${boton} border border-line hover:bg-mist`}>
          {cancelada ? <CalendarCheck className="size-4" aria-hidden /> : <CalendarX className="size-4" aria-hidden />}
          {cancelada ? "Volver a la agenda" : "Cancelar cita"}
        </button>
        <button type="button" onClick={borrar} disabled={pendiente} className={`${boton} text-brand hover:bg-brand-soft`}>
          <Trash2 className="size-4" aria-hidden />
          Borrar cita
        </button>
      </div>
      <Mensaje estado={mensaje} />
    </div>
  );
}
