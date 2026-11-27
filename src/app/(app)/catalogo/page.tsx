import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ImageIcon, Package, Plus, Search } from "lucide-react";
import { InsigniaStock } from "@/components/catalogo/insignias";
import { pesos } from "@/lib/clientes/opciones";
import { listarProductos } from "@/lib/catalogo/datos";
import { CATEGORIAS, urlFotoProducto } from "@/lib/catalogo/opciones";
import { obtenerUsuarioActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Catálogo" };

type Props = { searchParams: Promise<{ q?: string; categoria?: string; pagina?: string }> };

const claseControl =
  "h-11 w-full rounded-xl border border-line bg-paper px-3 text-base text-ink outline-none focus:border-ink focus:ring-2 focus:ring-brand/15 sm:text-sm";

export default async function Catalogo({ searchParams }: Props) {
  const filtros = await searchParams;
  const yo = await obtenerUsuarioActual();
  const esAdmin = yo?.rol === "admin";
  const { productos, total, pagina, paginas, error } = await listarProductos({
    q: filtros.q,
    categoria: filtros.categoria,
    incluirInactivos: esAdmin,
    pagina: Number(filtros.pagina) || 1,
  });

  const enlacePagina = (n: number) => {
    const p = new URLSearchParams();
    if (filtros.q) p.set("q", filtros.q);
    if (filtros.categoria) p.set("categoria", filtros.categoria);
    if (n > 1) p.set("pagina", String(n));
    return p.size ? `/catalogo?${p}` : "/catalogo";
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
            <Package className="size-8 shrink-0 text-brand" aria-hidden />
            Catálogo
          </h1>
          <p className="mt-2 text-base text-ink-soft">Precios con IVA incluido.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/pedidos/nuevo" className="inline-flex h-11 items-center gap-2 rounded-xl border border-line px-4 font-semibold hover:bg-mist">
            Nuevo pedido
          </Link>
          {esAdmin && (
            <Link href="/catalogo/nuevo" className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-4 font-semibold text-white hover:bg-brand-dark">
              <Plus className="size-5" aria-hidden />
              Nuevo producto
            </Link>
          )}
        </div>
      </div>

      {/* Buscador: formulario normal, funciona sin JavaScript */}
      <form role="search" action="/catalogo" className="mt-6 grid grid-cols-1 gap-3 rounded-xl border border-line p-3 sm:grid-cols-[minmax(0,1fr)_14rem_auto] sm:p-4">
        <div className="relative">
          <label htmlFor="cat-q" className="sr-only">Buscar por nombre, código o línea</label>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" aria-hidden />
          <input id="cat-q" name="q" type="search" defaultValue={filtros.q} placeholder="Nombre, código o línea" className={`${claseControl} pl-9`} />
        </div>
        <div>
          <label htmlFor="cat-categoria" className="sr-only">Categoría</label>
          <select id="cat-categoria" name="categoria" defaultValue={filtros.categoria ?? ""} className={claseControl}>
            <option value="">Todas las categorías</option>
            {Object.entries(CATEGORIAS).map(([valor, nombre]) => (
              <option key={valor} value={valor}>{nombre}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="h-11 rounded-xl bg-ink px-4 text-sm font-semibold text-paper hover:bg-ink/85">Buscar</button>
      </form>

      <p className="mt-4 text-sm text-ink-soft" aria-live="polite">
        {error ?? `${total} ${total === 1 ? "producto" : "productos"}${paginas > 1 ? ` · página ${pagina} de ${paginas}` : ""}`}
      </p>

      {productos.length === 0 && !error ? (
        <div className="mt-4 rounded-xl border border-dashed border-line px-6 py-12 text-center">
          <Package className="mx-auto size-10 text-ink-soft" aria-hidden />
          <p className="mt-3 font-semibold">{filtros.q || filtros.categoria ? "Ningún producto coincide" : "El catálogo está vacío"}</p>
          <p className="mt-1 text-sm text-ink-soft">
            {esAdmin ? "Agrega el primero con \"Nuevo producto\"." : "El administrador todavía no ha cargado productos."}
          </p>
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
          {productos.map((p) => {
            const foto = urlFotoProducto(p.photo_url);
            const contenido = (
              <>
                <div className="grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-lg bg-mist">
                  {foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={foto} alt="" loading="lazy" className="size-full object-contain" />
                  ) : (
                    <ImageIcon className="size-10 text-ink-soft/40" aria-hidden />
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  <p className="text-xs font-semibold tracking-wider text-ink-soft uppercase">
                    {CATEGORIAS[p.category]}{p.brand ? ` · ${p.brand}` : ""}
                  </p>
                  <p className="font-semibold break-words">{p.name}</p>
                  <p className="text-xs break-all text-ink-soft tabular-nums">{p.sku}</p>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
                    <span className="text-base font-bold tabular-nums sm:text-lg">{pesos(p.price)}</span>
                    <InsigniaStock stock={p.stock} />
                  </div>
                  {!p.active && <span className="text-xs font-semibold text-brand">Inactivo (no se vende)</span>}
                </div>
              </>
            );
            return (
              <li key={p.id}>
                {esAdmin ? (
                  <Link href={`/catalogo/${p.id}/editar`} className="flex h-full flex-col gap-3 rounded-xl border border-line p-3 transition-colors hover:border-ink/30 hover:bg-mist/40">
                    {contenido}
                  </Link>
                ) : (
                  <div className="flex h-full flex-col gap-3 rounded-xl border border-line p-3">{contenido}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {paginas > 1 && (
        <nav aria-label="Páginas del catálogo" className="mt-6 flex items-center justify-center gap-2">
          {pagina > 1 && (
            <Link href={enlacePagina(pagina - 1)} className="inline-flex h-11 items-center gap-1 rounded-xl border border-line px-3 text-sm font-medium hover:bg-mist">
              <ChevronLeft className="size-4" aria-hidden /> Anterior
            </Link>
          )}
          <span className="px-2 text-sm text-ink-soft tabular-nums">{pagina} / {paginas}</span>
          {pagina < paginas && (
            <Link href={enlacePagina(pagina + 1)} className="inline-flex h-11 items-center gap-1 rounded-xl border border-line px-3 text-sm font-medium hover:bg-mist">
              Siguiente <ChevronRight className="size-4" aria-hidden />
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
