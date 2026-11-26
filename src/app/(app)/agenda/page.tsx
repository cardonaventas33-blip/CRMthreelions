import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { Calendario } from "@/components/calendario";

export const metadata: Metadata = { title: "Agenda" };

export default function Agenda() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <p className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-sm font-medium text-brand">
        <span className="size-2 rounded-full bg-brand" aria-hidden="true" />
        Las citas llegan en la Fase 4
      </p>
      <h1 className="mt-4 flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
        <CalendarDays className="size-8 shrink-0 text-brand" aria-hidden />
        Agenda
      </h1>
      <p className="mt-3 max-w-xl text-base text-ink-soft sm:text-lg">
        De lunes a sábado. Toca un día para ver sus citas.
      </p>
      <div className="mt-8">
        <Calendario />
      </div>
    </div>
  );
}
