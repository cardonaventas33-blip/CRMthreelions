"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { aplicarTema, leerTema, type Tema } from "@/lib/tema";

const OPCIONES: { valor: Tema; nombre: string; icono: typeof Sun }[] = [
  { valor: "claro", nombre: "Claro", icono: Sun },
  { valor: "oscuro", nombre: "Oscuro", icono: Moon },
  { valor: "sistema", nombre: "Automático", icono: Monitor },
];

// Si no se puede guardar en el navegador (modo privado), se recuerda mientras la página esté abierta
let temaEnMemoria: Tema | null = null;

// Todos los selectores (menú del computador y del celular) se enteran cuando cambia el modo
const oyentes = new Set<() => void>();

function suscribir(avisar: () => void) {
  oyentes.add(avisar);
  window.addEventListener("storage", avisar); // cambios hechos en otra pestaña
  return () => {
    oyentes.delete(avisar);
    window.removeEventListener("storage", avisar);
  };
}

const temaActual = () => temaEnMemoria ?? leerTema();

function elegirTema(tema: Tema) {
  temaEnMemoria = tema;
  try {
    localStorage.setItem("tema", tema);
  } catch {
    // sin almacenamiento: igual se aplica
  }
  aplicarTema(tema);
  oyentes.forEach((avisar) => avisar());
}

// Claro / Oscuro / Automático (sigue lo que tenga el celular o el computador)
export function SelectorTema() {
  const tema = useSyncExternalStore(suscribir, temaActual, () => null);

  // Aplica el modo elegido y, en "Automático", sigue los cambios del celular o del computador
  useEffect(() => {
    if (!tema) return;
    aplicarTema(tema);
    if (tema !== "sistema") return;
    const medio = window.matchMedia("(prefers-color-scheme: dark)");
    const alCambiar = () => aplicarTema("sistema");
    medio.addEventListener("change", alCambiar);
    return () => medio.removeEventListener("change", alCambiar);
  }, [tema]);

  return (
    <div role="group" aria-label="Apariencia" className="grid grid-cols-3 gap-1 rounded-xl bg-mist p-1">
      {OPCIONES.map(({ valor, nombre, icono: Icono }) => {
        const activo = tema === valor;
        return (
          <button
            key={valor}
            type="button"
            aria-pressed={activo}
            onClick={() => elegirTema(valor)}
            className={`flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg text-xs font-medium transition-colors ${
              activo ? "bg-paper text-ink shadow-sm dark:bg-line" : "text-ink-soft hover:text-ink"
            }`}
          >
            <Icono className="size-4" aria-hidden />
            {nombre}
          </button>
        );
      })}
    </div>
  );
}
