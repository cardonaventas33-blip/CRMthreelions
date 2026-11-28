"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { BotonEnviar, Campo, CampoArea, CampoLista, Mensaje, useFormularioAccion } from "@/components/formulario";
import { borrarTarea, guardarTarea } from "@/lib/acciones/tareas";
import type { EstadoAccion } from "@/lib/acciones/tipos";
import { PRIORIDADES, type Prioridad } from "@/lib/tareas/opciones";

type Opcion = { id: string; nombre: string };

export type TareaEditable = {
  id: string;
  title: string;
  notes: string | null;
  due_date: string | null;
  priority: Prioridad;
  client_id: string | null;
  assigned_to: string;
};

const opcionesPrioridad = Object.entries(PRIORIDADES).map(([valor, p]) => ({ valor, nombre: p.nombre }));

export function FormularioTarea({
  tarea,
  hoy,
  clientes,
  equipo,
  yoId,
}: {
  tarea?: TareaEditable;
  hoy: string;
  clientes: Opcion[];
  /** Solo para el administrador: puede asignarle la tarea a otra persona */
  equipo: Opcion[] | null;
  yoId: string;
}) {
  // Al agregar una tarea nueva, el formulario queda limpio para la siguiente
  const { estado, enviando, ref, alEnviar } = useFormularioAccion<EstadoAccion>(guardarTarea, {}, { limpiarAlTerminar: !tarea });

  return (
    <form
      ref={ref}
      onSubmit={alEnviar}
      noValidate
      className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${equipo ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}
    >
      {tarea && <input type="hidden" name="id" value={tarea.id} />}
      <div className="col-span-full">
        <Campo
          id="tarea-titulo"
          etiqueta="¿Qué hay que hacer? *"
          name="title"
          defaultValue={tarea?.title ?? ""}
          maxLength={200}
          autoComplete="off"
          required
          placeholder="Ej.: Llamar a Auparcol para confirmar el pedido"
        />
      </div>
      <Campo
        id="tarea-fecha"
        etiqueta="Fecha límite"
        name="due_date"
        type="date"
        defaultValue={tarea ? (tarea.due_date ?? "") : hoy}
        ayuda="Bórrala si no tiene fecha."
      />
      <CampoLista id="tarea-prioridad" etiqueta="Prioridad" name="priority" opciones={opcionesPrioridad} defaultValue={tarea?.priority ?? "media"} />
      <CampoLista
        id="tarea-cliente"
        etiqueta="Cliente"
        name="client_id"
        opciones={clientes.map((c) => ({ valor: c.id, nombre: c.nombre }))}
        vacio="Sin cliente"
        defaultValue={tarea?.client_id ?? ""}
      />
      {equipo && (
        <CampoLista
          id="tarea-responsable"
          etiqueta="Responsable"
          name="assigned_to"
          opciones={equipo.map((p) => ({ valor: p.id, nombre: p.id === yoId ? `${p.nombre} (tú)` : p.nombre }))}
          defaultValue={tarea?.assigned_to ?? yoId}
        />
      )}
      <div className="col-span-full">
        <CampoArea
          id="tarea-notas"
          etiqueta="Notas"
          name="notes"
          rows={2}
          defaultValue={tarea?.notes ?? ""}
          maxLength={2000}
          placeholder="Detalles que ayuden (opcional)."
        />
      </div>
      <div className="col-span-full flex flex-col gap-3">
        <Mensaje estado={estado} />
        <BotonEnviar enviando={enviando} textoEnviando="Guardando…" className="sm:self-start">
          {tarea ? "Guardar cambios" : "Agregar tarea"}
        </BotonEnviar>
      </div>
    </form>
  );
}

// Borrar desde la página de editar (después vuelve a la lista)
export function BorrarTarea({ id }: { id: string }) {
  const [pendiente, iniciar] = useTransition();
  const [mensaje, setMensaje] = useState<EstadoAccion>({});
  const borrar = () => {
    if (!window.confirm("¿Borrar esta tarea? Esto no se puede deshacer.")) return;
    iniciar(async () => {
      const r = await borrarTarea(id, true);
      if (r?.error) setMensaje(r);
    });
  };
  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={borrar}
        disabled={pendiente}
        className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl px-4 text-sm font-semibold text-brand hover:bg-brand-soft disabled:opacity-60"
      >
        <Trash2 className="size-4" aria-hidden />
        Borrar tarea
      </button>
      <Mensaje estado={mensaje} />
    </div>
  );
}
