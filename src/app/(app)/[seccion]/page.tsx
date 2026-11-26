import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buscarSeccion, todasLasSecciones } from "@/lib/navegacion";

// Página temporal de cada opción del menú ("Próximamente").
// Cuando construyamos una sección de verdad (por ejemplo
// src/app/(app)/clientes/page.tsx), esa reemplaza a esta automáticamente.
export const dynamicParams = false;

export function generateStaticParams() {
  return todasLasSecciones
    .filter((seccion) => !seccion.paginaPropia)
    .map((seccion) => ({ seccion: seccion.slug }));
}

type Props = { params: Promise<{ seccion: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seccion } = await params;
  return { title: buscarSeccion(seccion)?.nombre };
}

export default async function SeccionProximamente({ params }: Props) {
  const { seccion } = await params;
  const datos = buscarSeccion(seccion);
  if (!datos) notFound();
  const Icono = datos.icono;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <p className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-sm font-medium text-brand">
        <span className="size-2 rounded-full bg-brand" aria-hidden="true" />
        Próximamente · Fase {datos.fase}
      </p>
      <h1 className="mt-4 flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
        <Icono className="size-8 shrink-0 text-brand" aria-hidden />
        {datos.nombre}
      </h1>
      <p className="mt-3 max-w-xl text-base text-ink-soft sm:text-lg">
        {datos.descripcion}
      </p>
      {datos.soloAdmin && (
        <p className="mt-6 text-sm text-ink-soft">
          Esta opción la verán solo los administradores.
        </p>
      )}
    </div>
  );
}
