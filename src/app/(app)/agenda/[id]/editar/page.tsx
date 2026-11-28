import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock } from "lucide-react";
import { AccionesCita } from "@/components/agenda/acciones-cita";
import { FormularioCita } from "@/components/agenda/formulario-cita";
import { TarjetaCita } from "@/components/agenda/tarjeta-cita";
import { clientesParaCita, listarEquipo, obtenerCita } from "@/lib/agenda/datos";
import { partesColombia } from "@/lib/agenda/fechas";
import { obtenerUsuarioActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Editar cita" };

type Props = { params: Promise<{ id: string }> };

export default async function EditarCita({ params }: Props) {
  const { id } = await params;
  const [yo, cita] = await Promise.all([obtenerUsuarioActual(), obtenerCita(id)]);
  if (!cita) notFound();
  const esAdmin = yo?.rol === "admin";
  const puedeEditar = esAdmin || cita.user_id === yo?.id;
  const { fecha, hora } = partesColombia(cita.start_at);

  const [clientes, equipo] = puedeEditar
    ? await Promise.all([clientesParaCita(), esAdmin ? listarEquipo() : Promise.resolve(null)])
    : [[], null];
  // Si el cliente de la cita está inactivo no sale en la lista: se agrega para no perderlo
  if (cita.cliente && !clientes.some((c) => c.id === cita.cliente!.id)) {
    clientes.unshift({
      id: cita.cliente.id,
      nombre: cita.cliente.trade_name || cita.cliente.name,
      sedes: cita.sede ? [{ id: cita.sede.id, nombre: `${cita.sede.name} · ${cita.sede.city}` }] : [],
    });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <Link href={`/agenda?dia=${fecha}`} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden />
        Volver a la agenda
      </Link>
      <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
        <CalendarClock className="size-8 shrink-0 text-brand" aria-hidden />
        Editar cita
      </h1>

      {!puedeEditar ? (
        <div className="mt-8 flex flex-col gap-4">
          <p className="text-ink-soft">
            Esta cita es de {cita.responsable?.name || "otra persona"}. Solo esa persona o un administrador pueden cambiarla.
          </p>
          <TarjetaCita cita={cita} puedeEditar={false} conFecha />
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-6">
          {cita.cancelled && (
            <p className="rounded-xl bg-mist px-4 py-3 text-sm">Esta cita está cancelada. Si al final sí se hace, tócale &quot;Volver a la agenda&quot;.</p>
          )}
          <section className="rounded-xl border border-line p-4 sm:p-6">
            <FormularioCita
              cita={{
                id: cita.id,
                title: cita.title,
                kind: cita.kind,
                fecha,
                hora,
                duracion: Math.round((new Date(cita.end_at).getTime() - new Date(cita.start_at).getTime()) / 60_000),
                client_id: cita.client_id,
                site_id: cita.site_id,
                user_id: cita.user_id,
                notes: cita.notes,
              }}
              diaInicial={fecha}
              clientes={clientes}
              equipo={equipo}
              yoId={yo?.id ?? ""}
            />
          </section>
          <section className="rounded-xl border border-line p-4 sm:p-6">
            <h2 className="mb-3 font-semibold">Cancelar o borrar</h2>
            <AccionesCita id={cita.id} cancelada={cita.cancelled} />
          </section>
        </div>
      )}
    </div>
  );
}
