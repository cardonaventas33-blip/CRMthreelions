"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
import { MenuLateral } from "@/components/menu-lateral";

// Marco de la app: menú fijo a la izquierda en el computador,
// y en el celular una barra arriba con un botón que abre el menú.
export function AppShell({ children }: { children: React.ReactNode }) {
  const [abierto, setAbierto] = useState(false);
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
        <MenuLateral />
      </aside>

      {/* Celular: barra de arriba con el botón del menú */}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-line bg-paper/95 px-2 backdrop-blur lg:hidden">
        <button
          ref={botonMenu}
          type="button"
          onClick={() => setAbierto(true)}
          aria-label="Abrir menú"
          aria-expanded={abierto}
          aria-controls="menu-celular"
          className="grid size-11 place-items-center rounded-xl text-ink hover:bg-mist"
        >
          <Menu className="size-6" aria-hidden />
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
          className={`absolute inset-0 bg-ink/40 transition-opacity duration-200 motion-reduce:transition-none ${
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
          <MenuLateral onCerrar={cerrar} />
        </div>
      </div>

      <main className="lg:pl-72">{children}</main>
    </div>
  );
}
