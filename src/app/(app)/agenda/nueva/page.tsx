import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarPlus } from "lucide-react";
import { FormularioCita } from "@/components/agenda/formulario-cita";
import { clientesParaCita, listarEquipo } from "@/lib/agenda/datos";
import { esFecha, hoyColombia, sinDomingo } from "@/lib/agenda/fechas";
import { obtenerUsuarioActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Nueva cita" };

type Props = { searchParams: Promise<{ dia?: string; cliente?: string }> };

export default async function NuevaCita({ searchParams }: Props) {
  const p = await searchParams;
  const yo = await obtenerUsuarioActual();
  const esAdmin = yo?.rol === "admin";
  const [clientes, equipo] = await Promise.all([clientesParaCita(), esAdmin ? listarEquipo() : Promise.resolve(null)]);
  const dia = sinDomingo(esFecha(p.dia) ? p.dia : hoyColombia());
  const clienteInicial = clientes.some((c) => c.id === p.cliente) ? (p.cliente as string) : "";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <Link href={`/agenda?dia=${dia}`} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden />
        Volver a la agenda
      </Link>
      <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
        <CalendarPlus className="size-8 shrink-0 text-brand" aria-hidden />
        Nueva cita
      </h1>
      <p className="mt-2 max-w-xl text-base text-ink-soft">
        Al guardarla podrás pasarla a tu Google Calendar y confirmarla con el cliente por WhatsApp.
      </p>
      <section className="mt-8 rounded-xl border border-line p-4 sm:p-6">
        <FormularioCita diaInicial={dia} clientes={clientes} equipo={equipo} clienteInicial={clienteInicial} yoId={yo?.id ?? ""} />
      </section>
    </div>
  );
}
