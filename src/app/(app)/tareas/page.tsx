import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, ListTodo } from "lucide-react";
import { FilaTarea } from "@/components/tareas/fila-tarea";
import { FormularioTarea } from "@/components/tareas/formulario-tarea";
import { clientesParaCita, listarEquipo } from "@/lib/agenda/datos";
import { hoyColombia } from "@/lib/agenda/fechas";
import { obtenerUsuarioActual } from "@/lib/sesion";
import { aFilaTarea, listarTareas } from "@/lib/tareas/datos";
import { GRUPOS_TAREA, grupoDe, type GrupoTarea, type TareaFila } from "@/lib/tareas/opciones";

export const metadata: Metadata = { title: "Tareas" };

type Props = { searchParams: Promise<{ ver?: string }> };

export default async function Tareas({ searchParams }: Props) {
  const p = await searchParams;
  const yo = await obtenerUsuarioActual();
  const esAdmin = yo?.rol === "admin";
  // El administrador ve al equipo; cada vendedor, las suyas (los dos pueden cambiarlo)
  const verEquipo = p.ver === "equipo" || (p.ver !== "mias" && esAdmin);
  const hoy = hoyColombia();

  const [{ pendientes, hechas, error }, clientes, equipo] = await Promise.all([
    listarTareas({ usuarioId: verEquipo ? undefined : yo?.id, hechas: 20 }),
    clientesParaCita(),
    esAdmin ? listarEquipo() : Promise.resolve(null),
  ]);

  const porGrupo = new Map<GrupoTarea, TareaFila[]>();
  for (const t of pendientes) {
    const grupo = grupoDe(t.due_date, hoy);
    porGrupo.set(grupo, [...(porGrupo.get(grupo) ?? []), aFilaTarea(t, yo, verEquipo)]);
  }
  const grupos = (Object.keys(GRUPOS_TAREA) as GrupoTarea[]).filter((g) => porGrupo.has(g));
  const cuenta = (g: GrupoTarea) => porGrupo.get(g)?.length ?? 0;
  const resumen = [
    cuenta("vencidas") && `${cuenta("vencidas")} ${cuenta("vencidas") === 1 ? "vencida" : "vencidas"}`,
    cuenta("hoy") && `${cuenta("hoy")} para hoy`,
    cuenta("proximas") && `${cuenta("proximas")} ${cuenta("proximas") === 1 ? "próxima" : "próximas"}`,
    cuenta("sin-fecha") && `${cuenta("sin-fecha")} sin fecha`,
  ].filter(Boolean);

  const chip = (activo: boolean) =>
    `inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-medium ${activo ? "bg-paper text-ink shadow-sm dark:bg-line" : "text-ink-soft hover:text-ink"}`;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
        <ListTodo className="size-8 shrink-0 text-brand" aria-hidden />
        Tareas
      </h1>
      <p className="mt-2 text-base text-ink-soft">
        {verEquipo ? "Pendientes de todo el equipo" : "Tus pendientes"}
        {resumen.length > 0 ? `: ${resumen.join(" · ")}.` : ": todo al día."}
      </p>

      <section className="mt-6 rounded-xl border border-line p-4 sm:p-6">
        <h2 className="mb-4 font-semibold">Nueva tarea</h2>
        <FormularioTarea hoy={hoy} clientes={clientes} equipo={equipo} yoId={yo?.id ?? ""} />
      </section>

      <nav aria-label="De quién son las tareas" className="mt-8 inline-flex gap-1 rounded-xl bg-mist p-1">
        <Link href="/tareas?ver=mias" scroll={false} className={chip(!verEquipo)} aria-current={!verEquipo ? "page" : undefined}>
          Mis tareas
        </Link>
        <Link href="/tareas?ver=equipo" scroll={false} className={chip(verEquipo)} aria-current={verEquipo ? "page" : undefined}>
          Todo el equipo
        </Link>
      </nav>

      {error && <p className="mt-4 text-sm text-brand">{error}</p>}

      {grupos.length === 0 ? (
        <p className="mt-4 rounded-xl bg-mist px-4 py-6 text-center text-ink-soft">
          {verEquipo ? "El equipo no tiene tareas pendientes." : "No tienes tareas pendientes."} Cuando necesites una, agrégala arriba.
        </p>
      ) : (
        grupos.map((g) => (
          <section key={g} aria-labelledby={`grupo-${g}`} className="mt-6">
            <h2 id={`grupo-${g}`} className={`flex items-center gap-2 font-semibold ${g === "vencidas" ? "text-brand" : ""}`}>
              {GRUPOS_TAREA[g]}
              <span
                className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${g === "vencidas" ? "bg-brand text-on-brand" : "bg-mist text-ink-soft"}`}
              >
                {cuenta(g)}
              </span>
            </h2>
            <ul className={`mt-2 divide-y divide-line rounded-xl border px-3 sm:px-4 ${g === "vencidas" ? "border-brand/40" : "border-line"}`}>
              {porGrupo.get(g)!.map((t) => (
                <FilaTarea key={t.id} tarea={t} hoy={hoy} />
              ))}
            </ul>
          </section>
        ))
      )}

      {hechas.length > 0 && (
        <details className="group mt-8">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 font-semibold text-ink-soft hover:text-ink [&::-webkit-details-marker]:hidden">
            <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden />
            Hechas hace poco ({hechas.length})
          </summary>
          <ul className="mt-2 divide-y divide-line rounded-xl border border-line px-3 sm:px-4">
            {hechas.map((t) => (
              <FilaTarea key={t.id} tarea={aFilaTarea(t, yo, verEquipo)} hoy={hoy} />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
