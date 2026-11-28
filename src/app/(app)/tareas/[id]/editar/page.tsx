import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ListTodo } from "lucide-react";
import { BorrarTarea, FormularioTarea } from "@/components/tareas/formulario-tarea";
import { clientesParaCita, listarEquipo } from "@/lib/agenda/datos";
import { hoyColombia } from "@/lib/agenda/fechas";
import { obtenerUsuarioActual } from "@/lib/sesion";
import { aFilaTarea, obtenerTarea } from "@/lib/tareas/datos";
import { FilaTarea } from "@/components/tareas/fila-tarea";

export const metadata: Metadata = { title: "Editar tarea" };

type Props = { params: Promise<{ id: string }> };

export default async function EditarTarea({ params }: Props) {
  const { id } = await params;
  const [yo, tarea] = await Promise.all([obtenerUsuarioActual(), obtenerTarea(id)]);
  if (!tarea) notFound();
  const esAdmin = yo?.rol === "admin";
  const fila = aFilaTarea(tarea, yo, true);
  const hoy = hoyColombia();

  const [clientes, equipo] = fila.puedeCambiar
    ? await Promise.all([clientesParaCita(), esAdmin ? listarEquipo() : Promise.resolve(null)])
    : [[], null];
  // Si el cliente de la tarea está inactivo no sale en la lista: se agrega para no perderlo
  if (tarea.cliente && !clientes.some((c) => c.id === tarea.cliente!.id)) {
    clientes.unshift({ id: tarea.cliente.id, nombre: tarea.cliente.trade_name || tarea.cliente.name, sedes: [] });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <Link href="/tareas" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden />
        Volver a tareas
      </Link>
      <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
        <ListTodo className="size-8 shrink-0 text-brand" aria-hidden />
        Editar tarea
      </h1>

      {!fila.puedeCambiar ? (
        <div className="mt-8 flex flex-col gap-4">
          <p className="text-ink-soft">
            Esta tarea es de {tarea.responsable?.name || "otra persona"}. Solo esa persona, quien la creó o un administrador pueden cambiarla.
          </p>
          <ul className="rounded-xl border border-line px-3 sm:px-4">
            <FilaTarea tarea={fila} hoy={hoy} />
          </ul>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-6">
          {tarea.done_at && (
            <p className="rounded-xl bg-ok-soft px-4 py-3 text-sm">Esta tarea ya está hecha. Si hay que volver a hacerla, márcala otra vez como pendiente en la lista.</p>
          )}
          <section className="rounded-xl border border-line p-4 sm:p-6">
            <FormularioTarea
              tarea={{
                id: tarea.id,
                title: tarea.title,
                notes: tarea.notes,
                due_date: tarea.due_date,
                priority: tarea.priority,
                client_id: tarea.client_id,
                assigned_to: tarea.assigned_to,
              }}
              hoy={hoy}
              clientes={clientes}
              equipo={equipo}
              yoId={yo?.id ?? ""}
            />
          </section>
          {fila.puedeBorrar && (
            <section className="rounded-xl border border-line p-4 sm:p-6">
              <h2 className="mb-1 font-semibold">Borrar</h2>
              <p className="mb-3 text-sm text-ink-soft">Si la tarea ya se hizo, mejor márcala como hecha: así queda el registro.</p>
              <BorrarTarea id={tarea.id} />
            </section>
          )}
        </div>
      )}
    </div>
  );
}
