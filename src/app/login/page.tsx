import type { Metadata } from "next";
import Image from "next/image";
import { FormularioLogin } from "./formulario-login";

export const metadata: Metadata = { title: "Entrar" };

export default function PaginaLogin() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/brand/logo-three-lions.png"
            alt="Logo de Three Lions"
            width={88}
            height={88}
            priority
            className="rounded-full shadow-md"
          />
          <p className="mt-4 font-display text-xl font-semibold tracking-[0.14em]">THREE LIONS</p>
          <p className="text-sm text-ink-soft">CRM comercial</p>
        </div>

        <div className="mt-8 rounded-2xl border border-line p-6 sm:p-8">
          <h1 className="text-xl font-bold">Entrar al CRM</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Usa el correo y la contraseña que te dio el administrador.
          </p>
          <FormularioLogin />
        </div>

        <p className="mt-6 text-center text-sm text-ink-soft">
          ¿Olvidaste tu contraseña? Pídele al administrador una nueva.
        </p>
      </div>
    </main>
  );
}
