import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { FormularioEmpresa, SugerenciasCiudades } from "@/components/clientes/formulario-empresa";
import { CIUDADES_SUGERIDAS } from "@/lib/clientes/opciones";

export const metadata: Metadata = { title: "Nueva empresa" };

export default function NuevaEmpresa() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <Link href="/clientes" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden />
        Volver a clientes
      </Link>
      <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
        <Building2 className="size-8 shrink-0 text-brand" aria-hidden />
        Nueva empresa
      </h1>
      <p className="mt-2 max-w-xl text-base text-ink-soft">
        Primero los datos de la empresa. Al crearla podrás subir sus documentos y agregar sus sedes y contactos.
      </p>

      <section className="mt-8 rounded-xl border border-line p-4 sm:p-6">
        <SugerenciasCiudades ciudades={CIUDADES_SUGERIDAS} />
        <FormularioEmpresa />
      </section>
    </div>
  );
}
