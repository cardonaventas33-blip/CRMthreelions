import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";
import { FormularioProducto } from "@/components/catalogo/formulario-producto";
import { obtenerUsuarioActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Nuevo producto" };

export default async function NuevoProducto() {
  const yo = await obtenerUsuarioActual();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <Link href="/catalogo" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden />
        Volver al catálogo
      </Link>
      <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
        <Package className="size-8 shrink-0 text-brand" aria-hidden />
        Nuevo producto
      </h1>
      {yo?.rol !== "admin" ? (
        <p className="mt-4 text-ink-soft">Solo un administrador puede agregar productos al catálogo.</p>
      ) : (
        <>
          <p className="mt-2 max-w-xl text-base text-ink-soft">
            Cada medida es un producto con su propio código, precio y stock. Al crearlo podrás subir su foto.
          </p>
          <section className="mt-8 rounded-xl border border-line p-4 sm:p-6">
            <FormularioProducto />
          </section>
        </>
      )}
    </div>
  );
}
