"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, LogOut, X } from "lucide-react";
import { SelectorTema } from "@/components/selector-tema";
import { cerrarSesion } from "@/lib/acciones/sesion";
import { grupos, inicio, type AvisosMenu } from "@/lib/navegacion";
import { iniciales, NOMBRE_ROL, type UsuarioVisible } from "@/lib/roles";

type Props = {
  usuario: UsuarioVisible;
  /** Numeritos rojos por sección (por ejemplo { tareas: 2 }) */
  avisos?: AvisosMenu;
  /** Cierra el menú en el celular (al tocar un enlace o la X). */
  onCerrar?: () => void;
};

// Numerito rojo (por ejemplo, tareas para hoy o vencidas)
export function Contador({ numero, pequeno = false }: { numero: number; pequeno?: boolean }) {
  return (
    <span
      className={`grid place-items-center rounded-full bg-brand font-bold text-on-brand tabular-nums ${
        pequeno ? "h-5 min-w-5 px-1 text-[11px]" : "h-6 min-w-6 px-1.5 text-xs"
      }`}
    >
      {numero > 99 ? "99+" : numero}
    </span>
  );
}

// Estilo de cada opción del menú: la activa va en rojo suave, como en la referencia
function claseEnlace(activo: boolean) {
  return `flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] transition-colors ${
    activo ? "bg-brand-soft font-semibold text-brand" : "text-ink hover:bg-mist"
  }`;
}

export function MenuLateral({ usuario, avisos = {}, onCerrar }: Props) {
  const ruta = usePathname();
  const [cerrados, setCerrados] = useState<Record<string, boolean>>({});

  const estaActiva = (href: string) =>
    href === "/" ? ruta === "/" : ruta === href || ruta.startsWith(`${href}/`);

  // Las opciones de administración solo las ve el administrador
  const gruposVisibles = grupos
    .map((grupo) => ({
      ...grupo,
      secciones: grupo.secciones.filter((s) => !s.soloAdmin || usuario.rol === "admin"),
    }))
    .filter((grupo) => grupo.secciones.length > 0);

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
          <p className="font-display text-base font-semibold tracking-[0.1em]">THREE LIONS</p>
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

      {/* Quién está usando el CRM (abre "Mi cuenta") */}
      <Link
        href="/cuenta"
        onClick={onCerrar}
        aria-current={estaActiva("/cuenta") ? "page" : undefined}
        className={`flex items-center gap-3 border-b border-line px-4 py-4 transition-colors hover:bg-mist ${
          estaActiva("/cuenta") ? "bg-mist" : ""
        }`}
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand">
          {iniciales(usuario)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">
            {usuario.nombre || usuario.correo}
          </span>
          <span className="block text-xs text-ink-soft">{NOMBRE_ROL[usuario.rol]} · Mi cuenta</span>
        </span>
      </Link>

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

        {gruposVisibles.map((grupo, i) => {
          const cerrado = cerrados[grupo.titulo] ?? false;
          const idLista = `grupo-menu-${i}`;
          const avisosGrupo = grupo.secciones.reduce((suma, s) => suma + (avisos[s.slug] ?? 0), 0);
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
                {/* Con el grupo cerrado, el numerito queda a la vista en el título */}
                {cerrado && avisosGrupo > 0 && <Contador numero={avisosGrupo} pequeno />}
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
                  const aviso = avisos[seccion.slug] ?? 0;
                  return (
                    <li key={seccion.slug}>
                      <Link
                        href={href}
                        onClick={onCerrar}
                        aria-current={activa ? "page" : undefined}
                        className={claseEnlace(activa)}
                      >
                        <seccion.icono className="size-5 shrink-0" aria-hidden />
                        <span className="flex-1">{seccion.nombre}</span>
                        {aviso > 0 && (
                          <span title={`${aviso} ${aviso === 1 ? "tarea" : "tareas"} para hoy o vencidas`}>
                            <Contador numero={aviso} />
                            <span className="sr-only">{aviso === 1 ? " pendiente" : " pendientes"}</span>
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-line px-3 py-3">
        <p className="px-1 pb-1.5 text-xs font-semibold tracking-wider text-ink-soft uppercase">Apariencia</p>
        <SelectorTema />
        <form action={cerrarSesion} className="mt-2">
          <button
            type="submit"
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-[15px] text-ink transition-colors hover:bg-mist"
          >
            <LogOut className="size-5 shrink-0" aria-hidden />
            Cerrar sesión
          </button>
        </form>
        <p className="px-3 pt-2 text-xs text-ink-soft">Three Lions SAS · Shaping the future</p>
      </div>
    </div>
  );
}
