import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, PartyPopper } from "lucide-react";
import { BorrarProducto } from "@/components/catalogo/borrar-producto";
import { FormularioProducto } from "@/components/catalogo/formulario-producto";
import { FotoProducto } from "@/components/catalogo/foto-producto";
import { obtenerProducto } from "@/lib/catalogo/datos";
import { urlFotoProducto } from "@/lib/catalogo/opciones";
import { obtenerUsuarioActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Editar producto" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ nuevo?: string }> };

export default async function EditarProducto({ params, searchParams }: Props) {
  const { id } = await params;
  const { nuevo } = await searchParams;
  const [yo, producto] = await Promise.all([obtenerUsuarioActual(), obtenerProducto(id)]);
  if (!producto) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <Link href="/catalogo" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden />
        Volver al catálogo
      </Link>
      <h1 className="mt-2 text-3xl font-bold tracking-tight break-words sm:text-4xl">{producto.name}</h1>
      <p className="mt-1 text-sm text-ink-soft tabular-nums">{producto.sku}</p>

      {nuevo && (
        <p className="mt-6 flex items-start gap-2 rounded-xl bg-ok-soft px-4 py-3 text-sm">
          <PartyPopper className="mt-0.5 size-5 shrink-0 text-ok" aria-hidden />
          Producto creado. Ahora súbele una foto.
        </p>
      )}

      {yo?.rol !== "admin" ? (
        <p className="mt-6 text-ink-soft">Solo un administrador puede cambiar el catálogo.</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <section className="rounded-xl border border-line p-4 sm:p-6">
            <h2 className="mb-5 text-lg font-semibold">Datos del producto</h2>
            <FormularioProducto producto={producto} />
          </section>
          <div className="flex flex-col gap-6">
            <section className="rounded-xl border border-line p-4 sm:p-6">
              <h2 className="mb-5 text-lg font-semibold">Foto</h2>
              <FotoProducto productoId={producto.id} urlFoto={urlFotoProducto(producto.photo_url)} linea={producto.line} />
            </section>
            <section className="rounded-xl border border-line p-4 sm:p-6">
              <h2 className="mb-3 text-lg font-semibold">Borrar</h2>
              <BorrarProducto productoId={producto.id} nombre={producto.name} />
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
