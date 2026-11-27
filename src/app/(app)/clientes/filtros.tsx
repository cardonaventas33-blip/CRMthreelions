"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { Search, X } from "lucide-react";
import { ESTADOS_CLIENTE, PLAZOS } from "@/lib/clientes/opciones";
import type { Filtros } from "@/lib/clientes/datos";

const claseControl =
  "h-11 w-full rounded-xl border border-line bg-paper px-3 text-base text-ink outline-none focus:border-ink focus:ring-2 focus:ring-brand/15 sm:text-sm";

// Buscador y filtros: cambian la dirección (?q=…&ciudad=…) y la lista se actualiza
export function FiltrosClientes({ filtros, ciudades }: { filtros: Filtros; ciudades: string[] }) {
  const router = useRouter();
  const formulario = useRef<HTMLFormElement>(null);

  const aplicar = () => {
    const datos = new FormData(formulario.current!);
    const params = new URLSearchParams();
    for (const clave of ["q", "ciudad", "plazo", "estado"]) {
      const valor = String(datos.get(clave) ?? "").trim();
      if (valor) params.set(clave, valor);
    }
    router.push(params.size ? `/clientes?${params}` : "/clientes");
  };

  const hayFiltros = Boolean(filtros.q || filtros.ciudad || filtros.plazo || filtros.estado);

  return (
    <form
      ref={formulario}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        aplicar();
      }}
      className="grid grid-cols-1 gap-3 rounded-xl border border-line p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto]"
    >
      <div className="relative sm:col-span-2 lg:col-span-1">
        <label htmlFor="filtro-q" className="sr-only">
          Buscar por razón social, nombre comercial o NIT
        </label>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" aria-hidden />
        <input
          id="filtro-q"
          name="q"
          type="search"
          defaultValue={filtros.q}
          placeholder="Razón social, nombre comercial o NIT"
          className={`${claseControl} pl-9`}
        />
      </div>

      <div>
        <label htmlFor="filtro-ciudad" className="sr-only">Ciudad</label>
        <select id="filtro-ciudad" name="ciudad" defaultValue={filtros.ciudad ?? ""} onChange={aplicar} className={claseControl}>
          <option value="">Todas las ciudades</option>
          {ciudades.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="filtro-plazo" className="sr-only">Plazo de pago</label>
        <select id="filtro-plazo" name="plazo" defaultValue={filtros.plazo ?? ""} onChange={aplicar} className={claseControl}>
          <option value="">Todos los plazos</option>
          {PLAZOS.map((p) => (
            <option key={p.dias} value={p.dias}>{p.nombre}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="filtro-estado" className="sr-only">Estado</label>
        <select id="filtro-estado" name="estado" defaultValue={filtros.estado ?? ""} onChange={aplicar} className={claseControl}>
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS_CLIENTE).map(([valor, nombre]) => (
            <option key={valor} value={valor}>{nombre}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
        <button
          type="submit"
          className="h-11 flex-1 rounded-xl bg-ink px-4 text-sm font-semibold text-paper hover:bg-ink/85 lg:flex-none"
        >
          Buscar
        </button>
        {hayFiltros && (
          <button
            type="button"
            onClick={() => {
              formulario.current?.reset();
              router.push("/clientes");
            }}
            className="inline-flex h-11 items-center gap-1 rounded-xl border border-line px-3 text-sm font-medium hover:bg-mist"
          >
            <X className="size-4" aria-hidden />
            Limpiar
          </button>
        )}
      </div>
    </form>
  );
}
