"use client";

import Link from "next/link";
import { useRef } from "react";
import { CalendarPlus, CalendarX2, Star, X } from "lucide-react";
import { BarraCompra } from "@/components/agenda/historial-cliente";
import type { EstadoCompra } from "@/lib/agenda/compras";
import { pesos } from "@/lib/clientes/opciones";

export type ClienteSinProgramar = {
  id: string;
  nombre: string;
  ciudad: string | null;
  importante: boolean;
  potencial: number | null;
  compra: EstadoCompra;
};

// "No programados": clientes sin visita este mes, primero los que ya les toca comprar
export function NoProgramados({ clientes, dia, mesTexto }: { clientes: ClienteSinProgramar[]; dia: string; mesTexto: string }) {
  const ref = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="inline-flex h-11 items-center gap-2 rounded-xl bg-warn-soft px-4 text-sm font-semibold text-warn hover:brightness-95"
      >
        <CalendarX2 className="size-4" aria-hidden />
        No programados ({clientes.length})
      </button>
      <dialog
        ref={ref}
        aria-label="Clientes no programados"
        onClick={(e) => {
          if (e.target === ref.current) ref.current?.close();
        }}
        className="m-auto max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto rounded-2xl border border-line bg-paper p-0 text-ink shadow-xl backdrop:bg-black/50"
      >
        <div className="sticky top-0 flex items-center justify-between gap-2 border-b border-line bg-paper px-5 py-3">
          <div>
            <p className="font-semibold">No programados</p>
            <p className="text-xs text-ink-soft">Clientes sin visita en {mesTexto}. Primero los que ya les toca comprar.</p>
          </div>
          <button type="button" onClick={() => ref.current?.close()} aria-label="Cerrar" className="grid size-11 shrink-0 place-items-center rounded-xl hover:bg-mist">
            <X className="size-5" aria-hidden />
          </button>
        </div>
        {clientes.length === 0 ? (
          <p className="p-5 text-sm text-ink-soft">Todos los clientes activos tienen visita este mes. ¡Bien!</p>
        ) : (
          <ul className="divide-y divide-line">
            {clientes.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-sm font-semibold break-words uppercase">
                    {c.nombre}
                    {c.importante && <Star className="size-4 shrink-0 fill-amber-400 text-amber-500" aria-label="Cliente importante" />}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {[c.ciudad, c.potencial !== null ? `Potencial: ${pesos(c.potencial)}` : "Sin compras todavía"].filter(Boolean).join(" · ")}
                  </p>
                  <BarraCompra compra={c.compra} />
                </div>
                <Link
                  href={`/agenda/nueva?cliente=${c.id}&dia=${dia}`}
                  className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-medium hover:bg-mist"
                >
                  <CalendarPlus className="size-4" aria-hidden />
                  Agendar
                </Link>
              </li>
            ))}
          </ul>
        )}
      </dialog>
    </>
  );
}
