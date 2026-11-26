import Image from "next/image";
import { LogOut, ShieldAlert } from "lucide-react";
import { cerrarSesion } from "@/lib/acciones/sesion";

// Lo que ve alguien con sesión pero todavía sin rol (pendiente)
export function SinAcceso({ correo }: { correo: string }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-paper px-4 py-10">
      <div className="w-full max-w-sm text-center">
        <Image
          src="/brand/logo-three-lions.png"
          alt=""
          width={72}
          height={72}
          className="mx-auto rounded-full"
        />
        <div className="mt-6 rounded-2xl border border-line p-6">
          <ShieldAlert className="mx-auto size-8 text-brand" aria-hidden />
          <h1 className="mt-3 text-xl font-bold text-balance">Tu cuenta aún no tiene acceso</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Entraste como <strong className="break-all text-ink">{correo}</strong>. Pídele al
            administrador del CRM que te active.
          </p>
          <form action={cerrarSesion} className="mt-6">
            <button
              type="submit"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-line px-4 text-sm font-medium hover:bg-mist"
            >
              <LogOut className="size-4" aria-hidden />
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
