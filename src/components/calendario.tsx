import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Cita } from "@/lib/agenda/datos";
import {
  conMayuscula,
  primerDiaDelMes,
  semanasDelMes,
  sinDomingo,
  textoFecha,
  textoHora,
} from "@/lib/agenda/fechas";

// De lunes a sábado: los domingos no se muestran (decisión del dueño)
const DIAS = [
  { corto: "Lun", largo: "lunes" },
  { corto: "Mar", largo: "martes" },
  { corto: "Mié", largo: "miércoles" },
  { corto: "Jue", largo: "jueves" },
  { corto: "Vie", largo: "viernes" },
  { corto: "Sáb", largo: "sábado" },
];

// Calendario del mes. Cada día es un enlace: al tocarlo se ven sus citas al lado (o debajo en el celular).
export function CalendarioMes({
  dia,
  hoy,
  porDia,
  enlace,
}: {
  dia: string;
  hoy: string;
  porDia: Map<string, Cita[]>;
  enlace: (dia: string) => string;
}) {
  const mes = dia.slice(0, 7);
  const titulo = conMayuscula(textoFecha(primerDiaDelMes(dia), { month: "long", year: "numeric" }));
  const boton = "grid size-11 place-items-center rounded-xl hover:bg-mist";

  return (
    <section aria-label="Calendario" className="overflow-hidden rounded-xl border border-line">
      {/* Mes visible y botones para moverse */}
      <div className="flex items-center gap-1 border-b border-line px-2 py-2 sm:px-4">
        <h2 className="min-w-0 flex-1 truncate px-1 text-lg font-semibold">{titulo}</h2>
        <Link href={enlace(hoy)} scroll={false} className="inline-flex h-11 items-center rounded-xl border border-line px-3 text-sm font-medium hover:bg-mist">
          Hoy
        </Link>
        <Link href={enlace(sinDomingo(primerDiaDelMes(dia, -1)))} scroll={false} aria-label="Mes anterior" className={boton}>
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
        <Link href={enlace(sinDomingo(primerDiaDelMes(dia, 1)))} scroll={false} aria-label="Mes siguiente" className={boton}>
          <ChevronRight className="size-5" aria-hidden />
        </Link>
      </div>

      {/* Nombres de los días (sin domingo) */}
      <div className="grid grid-cols-6 border-b border-line">
        {DIAS.map((d) => (
          <div key={d.corto} className="py-2 text-center text-xs font-semibold tracking-wider text-ink-soft uppercase">
            <abbr title={d.largo} className="no-underline">
              {d.corto}
            </abbr>
          </div>
        ))}
      </div>

      {/* Días: las líneas entre casillas salen del espacio de 1 px entre ellas */}
      <div className="grid grid-cols-6 gap-px bg-line">
        {semanasDelMes(dia)
          .flat()
          .map((d) => {
            const citas = (porDia.get(d) ?? []).filter((c) => !c.cancelled);
            const delMes = d.startsWith(mes);
            const esHoy = d === hoy;
            const elegido = d === dia;
            const etiqueta = `${conMayuscula(textoFecha(d, { weekday: "long", day: "numeric", month: "long" }))}${
              citas.length ? `, ${citas.length} ${citas.length === 1 ? "cita" : "citas"}` : ""
            }`;
            return (
              <Link
                key={d}
                href={enlace(d)}
                scroll={false}
                aria-label={etiqueta}
                aria-current={elegido ? "date" : undefined}
                className={`flex h-16 min-w-0 flex-col items-center gap-1 p-1 transition-colors sm:h-20 lg:h-28 lg:items-stretch lg:p-1.5 ${
                  elegido ? "bg-brand-soft" : "bg-paper hover:bg-mist"
                }`}
              >
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-full text-sm tabular-nums lg:self-start ${
                    esHoy
                      ? "bg-brand font-semibold text-on-brand"
                      : elegido
                        ? "font-semibold text-brand"
                        : delMes
                          ? "text-ink"
                          : "text-ink-soft/50"
                  }`}
                >
                  {Number(d.slice(8))}
                </span>

                {/* Celular: puntitos por cada cita (máximo 3) */}
                {citas.length > 0 && (
                  <span className="flex gap-0.5 lg:hidden" aria-hidden>
                    {citas.slice(0, 3).map((c) => (
                      <span key={c.id} className="size-1.5 rounded-full bg-brand" />
                    ))}
                  </span>
                )}

                {/* Computador: las primeras citas con su hora */}
                {citas.length > 0 && (
                  <span className="hidden min-w-0 flex-col gap-0.5 lg:flex" aria-hidden>
                    {citas.slice(0, 2).map((c) => (
                      <span key={c.id} className="truncate rounded bg-brand-soft px-1 text-[11px] leading-4 text-brand">
                        {textoHora(c.start_at)} {c.title}
                      </span>
                    ))}
                    {citas.length > 2 && <span className="px-1 text-[11px] leading-4 text-ink-soft">+{citas.length - 2} más</span>}
                  </span>
                )}
              </Link>
            );
          })}
      </div>
    </section>
  );
}
