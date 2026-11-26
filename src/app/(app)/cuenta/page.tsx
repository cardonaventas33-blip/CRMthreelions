import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { KeyRound, UserRound } from "lucide-react";
import { NOMBRE_ROL } from "@/lib/roles";
import { obtenerUsuarioActual } from "@/lib/sesion";
import { FormularioContrasena, FormularioNombre } from "./formularios";

export const metadata: Metadata = { title: "Mi cuenta" };

export default async function MiCuenta() {
  const yo = await obtenerUsuarioActual();
  if (!yo) redirect("/login");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Mi cuenta</h1>
      <p className="mt-3 text-base break-all text-ink-soft sm:text-lg">
        {yo.correo} · {NOMBRE_ROL[yo.rol]}
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2 md:items-start">
        <section aria-labelledby="titulo-nombre" className="rounded-xl border border-line p-4 sm:p-5">
          <h2 id="titulo-nombre" className="flex items-center gap-2 font-semibold">
            <UserRound className="size-5 text-brand" aria-hidden />
            Tu nombre
          </h2>
          <p className="mt-1 text-sm text-ink-soft">Así te verá el resto del equipo.</p>
          <FormularioNombre nombre={yo.nombre} />
        </section>

        <section aria-labelledby="titulo-clave" className="rounded-xl border border-line p-4 sm:p-5">
          <h2 id="titulo-clave" className="flex items-center gap-2 font-semibold">
            <KeyRound className="size-5 text-brand" aria-hidden />
            Cambiar contraseña
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Si te dieron una contraseña temporal, cámbiala aquí por una que solo tú sepas.
          </p>
          <FormularioContrasena />
        </section>
      </div>
    </div>
  );
}
