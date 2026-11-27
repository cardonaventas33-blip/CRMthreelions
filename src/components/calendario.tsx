"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// De lunes a sábado: los domingos no se muestran (decisión del dueño)
const DIAS = [
  { corto: "Lun", largo: "lunes" },
  { corto: "Mar", largo: "martes" },
  { corto: "Mié", largo: "miércoles" },
  { corto: "Jue", largo: "jueves" },
  { corto: "Vie", largo: "viernes" },
  { corto: "Sáb", largo: "sábado" },
];

const formatoMes = new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" });
const formatoDia = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const formatoCompleto = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const conMayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);

function mismoDia(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Si la fecha cae en domingo, pasa al lunes siguiente
function sinDomingo(fecha: Date) {
  return fecha.getDay() === 0
    ? new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate() + 1)
    : fecha;
}

// Semanas del mes, de lunes a sábado. Se completan las filas con días
// del mes anterior o siguiente (se ven más claritos).
function semanasDelMes(anio: number, mes: number): Date[][] {
  const desfase = (new Date(anio, mes, 1).getDay() + 6) % 7; // lunes = 0 ... domingo = 6
  const semanas: Date[][] = [];
  for (let s = 0; s < 6; s++) {
    const semana = Array.from(
      { length: 6 },
      (_, d) => new Date(anio, mes, 1 - desfase + s * 7 + d),
    );
    if (semana.some((dia) => dia.getMonth() === mes)) semanas.push(semana);
  }
  return semanas;
}

type MesVisible = { anio: number; mes: number };

export function Calendario() {
  // "Hoy" se calcula en el celular o computador de quien mira, no en el servidor
  const [hoy, setHoy] = useState<Date | null>(null);
  const [mesVisible, setMesVisible] = useState<MesVisible | null>(null);
  const [seleccion, setSeleccion] = useState<Date | null>(null);

  useEffect(() => {
    const ahora = new Date();
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const inicial = sinDomingo(fecha);
    setHoy(fecha);
    setSeleccion(inicial);
    setMesVisible({ anio: inicial.getFullYear(), mes: inicial.getMonth() });
  }, []);

  const dias = useMemo(
    () => (mesVisible ? semanasDelMes(mesVisible.anio, mesVisible.mes).flat() : []),
    [mesVisible],
  );

  const cambiarMes = (paso: number) =>
    setMesVisible((actual) => {
      if (!actual) return actual;
      const f = new Date(actual.anio, actual.mes + paso, 1);
      return { anio: f.getFullYear(), mes: f.getMonth() };
    });

  const irAHoy = () => {
    if (!hoy) return;
    const dia = sinDomingo(hoy);
    setSeleccion(dia);
    setMesVisible({ anio: dia.getFullYear(), mes: dia.getMonth() });
  };

  const elegir = (dia: Date) => {
    setSeleccion(dia);
    if (mesVisible && dia.getMonth() !== mesVisible.mes) {
      setMesVisible({ anio: dia.getFullYear(), mes: dia.getMonth() });
    }
  };

  const titulo = mesVisible
    ? conMayuscula(formatoMes.format(new Date(mesVisible.anio, mesVisible.mes, 1)))
    : " ";

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
      <section aria-label="Calendario" className="overflow-hidden rounded-xl border border-line">
        {/* Mes visible y botones para moverse */}
        <div className="flex items-center gap-1 border-b border-line px-2 py-2 sm:px-4">
          <h2 aria-live="polite" className="min-w-0 flex-1 truncate px-1 text-lg font-semibold">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={irAHoy}
            disabled={!hoy}
            className="h-11 rounded-xl border border-line px-3 text-sm font-medium hover:bg-mist disabled:opacity-50"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => cambiarMes(-1)}
            disabled={!mesVisible}
            aria-label="Mes anterior"
            className="grid size-11 place-items-center rounded-xl hover:bg-mist disabled:opacity-50"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => cambiarMes(1)}
            disabled={!mesVisible}
            aria-label="Mes siguiente"
            className="grid size-11 place-items-center rounded-xl hover:bg-mist disabled:opacity-50"
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>

        {/* Nombres de los días (sin domingo) */}
        <div className="grid grid-cols-6 border-b border-line">
          {DIAS.map((dia) => (
            <div
              key={dia.corto}
              className="py-2 text-center text-xs font-semibold tracking-wider text-ink-soft uppercase"
            >
              <abbr title={dia.largo} className="no-underline">
                {dia.corto}
              </abbr>
            </div>
          ))}
        </div>

        {/* Días: las líneas entre casillas salen del espacio de 1 px entre ellas */}
        <div className="grid grid-cols-6 gap-px bg-line">
          {dias.length === 0
            ? Array.from({ length: 30 }, (_, i) => (
                <div key={i} className="h-14 bg-paper sm:h-20 lg:h-24" />
              ))
            : dias.map((dia) => {
                const delMes = dia.getMonth() === mesVisible?.mes;
                const esHoy = hoy ? mismoDia(dia, hoy) : false;
                const elegido = seleccion ? mismoDia(dia, seleccion) : false;
                return (
                  <button
                    key={`${dia.getFullYear()}-${dia.getMonth()}-${dia.getDate()}`}
                    type="button"
                    onClick={() => elegir(dia)}
                    aria-label={conMayuscula(formatoCompleto.format(dia))}
                    aria-pressed={elegido}
                    aria-current={esHoy ? "date" : undefined}
                    className={`flex h-14 justify-center p-1 transition-colors sm:h-20 lg:h-24 lg:justify-start lg:p-2 ${
                      elegido ? "bg-brand-soft" : "bg-paper hover:bg-mist"
                    }`}
                  >
                    <span
                      className={`grid size-8 place-items-center rounded-full text-sm tabular-nums ${
                        esHoy
                          ? "bg-brand font-semibold text-white"
                          : elegido
                            ? "font-semibold text-brand"
                            : delMes
                              ? "text-ink"
                              : "text-ink-soft/50"
                      }`}
                    >
                      {dia.getDate()}
                    </span>
                  </button>
                );
              })}
        </div>
      </section>

      {/* El día elegido y sus citas */}
      <section aria-live="polite" className="rounded-xl border border-line p-4 sm:p-5">
        <h2 className="font-semibold">
          {seleccion ? conMayuscula(formatoDia.format(seleccion)) : " "}
        </h2>
        <p className="mt-1 text-sm text-ink-soft">No hay citas para este día.</p>
        <p className="mt-4 rounded-lg bg-mist px-3 py-2 text-sm text-ink-soft">
          Crear, mover y cancelar citas llega en la Fase 4.
        </p>
      </section>
    </div>
  );
}
