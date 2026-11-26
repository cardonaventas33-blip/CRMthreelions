"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, UserRound, X } from "lucide-react";
import { grupos, inicio } from "@/lib/navegacion";

type Props = {
  /** Cierra el menú en el celular (al tocar un enlace o la X). */
  onCerrar?: () => void;
};

// Estilo de cada opción del menú: la activa va en rojo suave, como en la referencia
function claseEnlace(activo: boolean) {
  return `flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] transition-colors ${
    activo ? "bg-brand-soft font-semibold text-brand" : "text-ink hover:bg-mist"
  }`;
}

export function MenuLateral({ onCerrar }: Props) {
  const ruta = usePathname();
  const [cerrados, setCerrados] = useState<Record<string, boolean>>({});

  const estaActiva = (href: string) =>
    href === "/" ? ruta === "/" : ruta === href || ruta.startsWith(`${href}/`);

  return (
    <div className="flex h-full flex-col">
      {/* Marca */}
      <div className="flex items-center gap-3 border-b border-line px-4 py-4">
        <Image
          src="/brand/logo-three-lions.png"
          alt=""
          width={44}
          height={44}
          className="rounded-full"
        />
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-semibold tracking-[0.1em]">
            THREE LIONS
          </p>
          <p className="text-sm text-ink-soft">CRM comercial</p>
        </div>
        {onCerrar && (
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar menú"
            className="grid size-11 place-items-center rounded-xl text-ink hover:bg-mist lg:hidden"
          >
            <X className="size-6" aria-hidden />
          </button>
        )}
      </div>

      {/* Quién usa el CRM: se llena cuando exista el inicio de sesión (Fase 1) */}
      <div className="flex items-center gap-3 border-b border-line px-4 py-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-mist text-ink-soft">
          <UserRound className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Sin iniciar sesión</p>
          <p className="text-xs text-ink-soft">
            El acceso con usuario llega en la Fase 1
          </p>
        </div>
      </div>

      {/* Opciones del menú */}
      <nav aria-label="Menú principal" className="flex-1 overflow-y-auto px-3 py-4">
        <Link
          href={inicio.href}
          onClick={onCerrar}
          aria-current={estaActiva(inicio.href) ? "page" : undefined}
          className={claseEnlace(estaActiva(inicio.href))}
        >
          <inicio.icono className="size-5 shrink-0" aria-hidden />
          {inicio.nombre}
        </Link>

        {grupos.map((grupo, i) => {
          const cerrado = cerrados[grupo.titulo] ?? false;
          const idLista = `grupo-menu-${i}`;
          return (
            <div key={grupo.titulo} className="mt-5">
              <button
                type="button"
                onClick={() =>
                  setCerrados((antes) => ({ ...antes, [grupo.titulo]: !cerrado }))
                }
                aria-expanded={!cerrado}
                aria-controls={idLista}
                className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-xs font-semibold tracking-wider text-ink-soft uppercase hover:bg-mist"
              >
                <grupo.icono className="size-5 shrink-0" aria-hidden />
                <span className="flex-1 text-left">{grupo.titulo}</span>
                <ChevronDown
                  className={`size-4 transition-transform duration-200 motion-reduce:transition-none ${
                    cerrado ? "-rotate-90" : ""
                  }`}
                  aria-hidden
                />
              </button>
              <ul
                id={idLista}
                hidden={cerrado}
                className="mt-1 ml-5 space-y-1 border-l border-line pl-3"
              >
                {grupo.secciones.map((seccion) => {
                  const href = `/${seccion.slug}`;
                  const activa = estaActiva(href);
                  return (
                    <li key={seccion.slug}>
                      <Link
                        href={href}
                        onClick={onCerrar}
                        aria-current={activa ? "page" : undefined}
                        className={claseEnlace(activa)}
                      >
                        <seccion.icono className="size-5 shrink-0" aria-hidden />
                        {seccion.nombre}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <p className="border-t border-line px-4 py-3 text-xs text-ink-soft">
        Three Lions SAS · Shaping the future
      </p>
    </div>
  );
}
