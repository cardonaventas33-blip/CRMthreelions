"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
import { Contador, MenuLateral } from "@/components/menu-lateral";
import type { AvisosMenu } from "@/lib/navegacion";
import type { UsuarioVisible } from "@/lib/roles";

// Marco de la app: menú fijo a la izquierda en el computador,
// y en el celular una barra arriba con un botón que abre el menú.
export function AppShell({
  usuario,
  avisos = {},
  children,
}: {
  usuario: UsuarioVisible;
  /** Numeritos rojos del menú (por ejemplo, tareas para hoy) */
  avisos?: AvisosMenu;
  children: React.ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  const totalAvisos = Object.values(avisos).reduce<number>((suma, n) => suma + (n ?? 0), 0);
  const botonMenu = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  // Con el menú abierto: la página de atrás no se mueve, Escape lo cierra
  // y el teclado empieza dentro del menú.
  useEffect(() => {
    if (!abierto) return;
    const alPresionar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("keydown", alPresionar);
    const overflowAntes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector("button")?.focus();
    return () => {
      document.removeEventListener("keydown", alPresionar);
      document.body.style.overflow = overflowAntes;
    };
  }, [abierto]);

  const cerrar = () => {
    setAbierto(false);
    botonMenu.current?.focus();
  };

  return (
    <div className="min-h-dvh">
      {/* Computador: menú fijo a la izquierda */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-line bg-paper lg:block">
        <MenuLateral usuario={usuario} avisos={avisos} />
      </aside>

      {/* Celular: barra de arriba con el botón del menú */}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-line bg-paper/95 px-2 backdrop-blur lg:hidden">
        <button
          ref={botonMenu}
          type="button"
          onClick={() => setAbierto(true)}
          aria-label={totalAvisos > 0 ? `Abrir menú (${totalAvisos} ${totalAvisos === 1 ? "pendiente" : "pendientes"})` : "Abrir menú"}
          aria-expanded={abierto}
          aria-controls="menu-celular"
          className="relative grid size-11 place-items-center rounded-xl text-ink hover:bg-mist"
        >
          <Menu className="size-6" aria-hidden />
          {totalAvisos > 0 && (
            <span className="absolute top-0.5 right-0.5" aria-hidden>
              <Contador numero={totalAvisos} pequeno />
            </span>
          )}
        </button>
        <Image
          src="/brand/logo-three-lions.png"
          alt=""
          width={32}
          height={32}
          className="rounded-full"
        />
        <p className="font-display text-base font-semibold tracking-[0.1em]">
          THREE LIONS
        </p>
      </header>

      {/* Celular: menú que se desliza desde la izquierda */}
      <div
        className={`fixed inset-0 z-40 lg:hidden ${abierto ? "" : "pointer-events-none"}`}
        aria-hidden={!abierto}
      >
        <div
          onClick={cerrar}
          className={`absolute inset-0 bg-black/50 transition-opacity duration-200 motion-reduce:transition-none ${
            abierto ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          ref={panel}
          id="menu-celular"
          role="dialog"
          aria-modal="true"
          aria-label="Menú"
          inert={!abierto}
          className={`absolute inset-y-0 left-0 w-[85%] max-w-80 bg-paper transition-transform duration-200 ease-out motion-reduce:transition-none ${
            abierto ? "translate-x-0 shadow-xl" : "-translate-x-full"
          }`}
        >
          <MenuLateral usuario={usuario} avisos={avisos} onCerrar={cerrar} />
        </div>
      </div>

      <main className="lg:pl-72">{children}</main>
    </div>
  );
}
