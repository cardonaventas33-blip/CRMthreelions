"use client";

import { useState, useTransition } from "react";
import { CircleCheck, CircleDashed } from "lucide-react";
import { Mensaje } from "@/components/formulario";
import { cambiarEstadoCliente } from "@/lib/acciones/clientes";
import type { EstadoAccion } from "@/lib/acciones/tipos";
import type { EstadoCliente } from "@/lib/clientes/opciones";

type Punto = { texto: string; listo: boolean };

// Lista de lo que falta y botones para validar, volver a pendiente o inactivar
export function ValidacionCliente({
  clienteId,
  estado,
  puntos,
}: {
  clienteId: string;
  estado: EstadoCliente;
  puntos: Punto[];
}) {
  const [pendiente, iniciar] = useTransition();
  const [mensaje, setMensaje] = useState<EstadoAccion>({});
  const completo = puntos.every((p) => p.listo);

  const cambiar = (nuevo: EstadoCliente) => {
    if (nuevo === "validado" && !completo) {
      const ok = window.confirm("Todavía faltan cosas por completar. ¿Marcar como validado de todos modos?");
      if (!ok) return;
    }
    iniciar(async () => setMensaje(await cambiarEstadoCliente(clienteId, nuevo)));
  };

  const claseBoton = "inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold disabled:opacity-60";

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2">
        {puntos.map((p) => (
          <li key={p.texto} className="flex items-center gap-2 text-sm">
            {p.listo ? (
              <CircleCheck className="size-5 shrink-0 text-ok" aria-hidden />
            ) : (
              <CircleDashed className="size-5 shrink-0 text-ink-soft" aria-hidden />
            )}
            <span className={p.listo ? "" : "text-ink-soft"}>{p.texto}</span>
            <span className="sr-only">{p.listo ? "(listo)" : "(falta)"}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2">
        {estado !== "validado" && (
          <button type="button" disabled={pendiente} onClick={() => cambiar("validado")} className={`${claseBoton} bg-brand text-on-brand hover:bg-brand-dark`}>
            Marcar como validado
          </button>
        )}
        {estado === "validado" && (
          <button type="button" disabled={pendiente} onClick={() => cambiar("pendiente")} className={`${claseBoton} border border-line hover:bg-mist`}>
            Volver a pendiente
          </button>
        )}
        {estado !== "inactivo" ? (
          <button type="button" disabled={pendiente} onClick={() => cambiar("inactivo")} className={`${claseBoton} text-ink-soft hover:bg-mist`}>
            Marcar como inactivo
          </button>
        ) : (
          <button type="button" disabled={pendiente} onClick={() => cambiar("pendiente")} className={`${claseBoton} border border-line hover:bg-mist`}>
            Reactivar cliente
          </button>
        )}
      </div>
      <Mensaje estado={mensaje} />
    </div>
  );
}
