"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { Check, Pencil, Trash2 } from "lucide-react";
import { borrarTarea, marcarTarea } from "@/lib/acciones/tareas";
import { textoFecha } from "@/lib/agenda/fechas";
import { PRIORIDADES, grupoDe, textoVence, type TareaFila } from "@/lib/tareas/opciones";

// Una tarea: el círculo la marca como hecha (o la devuelve a pendientes)
export function FilaTarea({ tarea, hoy }: { tarea: TareaFila; hoy: string }) {
  const [pendiente, iniciar] = useTransition();
  const [hecha, ponerHecha] = useOptimistic(Boolean(tarea.hecha));
  const [error, setError] = useState("");
  const vencida = !hecha && grupoDe(tarea.due_date, hoy) === "vencidas";
  const prioridad = PRIORIDADES[tarea.priority];

  const marcar = () =>
    iniciar(async () => {
      ponerHecha(!hecha);
      const r = await marcarTarea(tarea.id, !hecha);
      setError(r.error ?? "");
    });

  const borrar = () => {
    if (!window.confirm(`¿Borrar la tarea «${tarea.title}»? Esto no se puede deshacer.`)) return;
    iniciar(async () => {
      const r = await borrarTarea(tarea.id);
      setError(r.error ?? "");
    });
  };

  const fecha = tarea.hecha
    ? tarea.hecha === hoy
      ? "Hecha hoy"
      : `Hecha el ${textoFecha(tarea.hecha, { day: "numeric", month: "short" })}`
    : textoVence(tarea.due_date, hoy);

  return (
    <li className="flex gap-3 py-3">
      <button
        type="button"
        role="checkbox"
        aria-checked={hecha}
        aria-label={`${hecha ? "Volver a pendientes" : "Marcar como hecha"}: ${tarea.title}`}
        title={tarea.puedeCambiar ? undefined : "Solo el responsable, quien la creó o un administrador puede marcarla"}
        disabled={!tarea.puedeCambiar || pendiente}
        onClick={marcar}
        className="group -my-2.5 -mr-1 -ml-2.5 grid size-11 shrink-0 place-items-center rounded-full disabled:cursor-not-allowed"
      >
        <span
          className={`grid size-6 place-items-center rounded-full border-2 transition-colors ${
            hecha
              ? "border-ok bg-ok text-on-brand"
              : vencida
                ? "border-brand group-enabled:group-hover:bg-brand-soft"
                : "border-ink-soft/50 group-enabled:group-hover:border-ink"
          } ${!tarea.puedeCambiar ? "opacity-50" : ""}`}
        >
          {hecha && <Check className="size-4" strokeWidth={3} aria-hidden />}
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <p className={`font-medium break-words ${hecha ? "text-ink-soft line-through" : ""}`}>{tarea.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span
            className={`rounded-full px-2 py-0.5 font-semibold ${
              vencida ? "bg-brand text-on-brand" : tarea.hecha ? "bg-ok-soft text-ok" : "bg-mist text-ink"
            }`}
          >
            {fecha}
          </span>
          {!tarea.hecha && (
            <span className={`rounded-full px-2 py-0.5 font-semibold ${prioridad.clase}`}>
              Prioridad {prioridad.nombre.toLowerCase()}
            </span>
          )}
          {tarea.cliente && (
            <Link href={`/clientes/${tarea.cliente.id}`} className="font-medium text-ink underline-offset-2 hover:text-brand hover:underline">
              {tarea.cliente.nombre}
            </Link>
          )}
          {tarea.responsable && <span className="text-ink-soft">Responsable: {tarea.responsable}</span>}
          {tarea.asignadaPor && <span className="text-ink-soft">La asignó {tarea.asignadaPor}</span>}
        </div>
        {tarea.notes && <p className="mt-1 line-clamp-2 text-sm whitespace-pre-line text-ink-soft">{tarea.notes}</p>}
        {error && (
          <p role="alert" className="mt-1 text-sm text-brand">
            {error}
          </p>
        )}
      </div>

      <div className="-my-1 flex shrink-0 items-start">
        {tarea.puedeCambiar && (
          <Link
            href={`/tareas/${tarea.id}/editar`}
            aria-label={`Editar: ${tarea.title}`}
            title="Editar"
            className="grid size-10 place-items-center rounded-lg text-ink-soft hover:bg-mist hover:text-ink"
          >
            <Pencil className="size-4" aria-hidden />
          </Link>
        )}
        {tarea.puedeBorrar && (
          <button
            type="button"
            onClick={borrar}
            disabled={pendiente}
            aria-label={`Borrar: ${tarea.title}`}
            title="Borrar"
            className="grid size-10 place-items-center rounded-lg text-ink-soft hover:bg-brand-soft hover:text-brand disabled:opacity-50"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        )}
      </div>
    </li>
  );
}
