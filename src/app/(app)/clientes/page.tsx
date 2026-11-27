import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Plus, UsersRound } from "lucide-react";
import { InsigniaEstado, InsigniasDocumentos } from "@/components/clientes/insignias";
import { listarClientes, type Filtros } from "@/lib/clientes/datos";
import { nombrePlazo } from "@/lib/clientes/opciones";
import { FiltrosClientes } from "./filtros";

export const metadata: Metadata = { title: "Clientes" };

type Props = { searchParams: Promise<Filtros> };

export default async function Clientes({ searchParams }: Props) {
  const filtros = await searchParams;
  const { filas, encontrados, total, ciudades, error } = await listarClientes(filtros);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
            <UsersRound className="size-8 shrink-0 text-brand" aria-hidden />
            Clientes
          </h1>
          <p className="mt-2 text-base text-ink-soft">Gestiona tu base de clientes.</p>
        </div>
        <Link
          href="/clientes/nuevo"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-4 font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          <Plus className="size-5" aria-hidden />
          Nueva empresa
        </Link>
      </div>

      <div className="mt-6">
        <FiltrosClientes filtros={filtros} ciudades={ciudades} />
      </div>

      <p className="mt-4 text-sm text-ink-soft" aria-live="polite">
        {error ?? `Mostrando ${encontrados} de ${total} ${total === 1 ? "empresa" : "empresas"}`}
      </p>

      {filas.length === 0 && !error ? (
        <div className="mt-4 rounded-xl border border-dashed border-line px-6 py-12 text-center">
          <Building2 className="mx-auto size-10 text-ink-soft" aria-hidden />
          <p className="mt-3 font-semibold">
            {total === 0 ? "Todavía no hay clientes" : "Ningún cliente coincide con la búsqueda"}
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {total === 0
              ? "Crea el primero con el botón \"Nueva empresa\"."
              : "Prueba con otras palabras o quita los filtros."}
          </p>
        </div>
      ) : (
        <>
          {/* Computador: tabla como en la referencia */}
          <div className="mt-4 hidden overflow-x-auto rounded-xl border border-line md:block">
            <table className="w-full min-w-[56rem] text-sm">
              <thead>
                <tr className="border-b border-line bg-mist text-left text-xs font-semibold tracking-wider text-ink-soft uppercase">
                  <th scope="col" className="px-4 py-3">Razón social</th>
                  <th scope="col" className="px-4 py-3">Nombre comercial</th>
                  <th scope="col" className="px-4 py-3">Estado</th>
                  <th scope="col" className="px-4 py-3 text-center">Sedes</th>
                  <th scope="col" className="px-4 py-3 text-center">Contactos</th>
                  <th scope="col" className="px-4 py-3">Docs</th>
                  <th scope="col" className="px-4 py-3">Plazo</th>
                  <th scope="col" className="px-4 py-3"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filas.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-mist/60">
                    <td className="px-4 py-3">
                      <Link href={`/clientes/${c.id}`} className="font-semibold text-ink hover:text-brand">
                        {c.name}
                      </Link>
                      <div className="text-xs text-ink-soft tabular-nums">{c.nit_rut ?? "Sin NIT"}</div>
                    </td>
                    <td className="px-4 py-3">
                      {c.trade_name ?? <span className="text-ink-soft">—</span>}
                      {c.city && <div className="text-xs text-ink-soft">{c.city}</div>}
                    </td>
                    <td className="px-4 py-3"><InsigniaEstado estado={c.status} /></td>
                    <td className="px-4 py-3 text-center tabular-nums">{c.sedes}</td>
                    <td className="px-4 py-3 text-center tabular-nums">{c.contactos}</td>
                    <td className="px-4 py-3"><InsigniasDocumentos cliente={c} /></td>
                    <td className="px-4 py-3 whitespace-nowrap">{nombrePlazo(c.payment_term_days)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/clientes/${c.id}/editar`}
                        className="inline-flex h-9 items-center rounded-lg bg-brand px-3 text-xs font-semibold whitespace-nowrap text-white hover:bg-brand-dark"
                      >
                        Actualizar información
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Celular: tarjetas */}
          <ul className="mt-4 flex flex-col gap-3 md:hidden">
            {filas.map((c) => (
              <li key={c.id} className="rounded-xl border border-line p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/clientes/${c.id}`} className="font-semibold break-words text-ink">
                      {c.name}
                    </Link>
                    <p className="text-xs text-ink-soft tabular-nums">{c.nit_rut ?? "Sin NIT"}</p>
                    {(c.trade_name || c.city) && (
                      <p className="mt-1 text-sm text-ink-soft">
                        {[c.trade_name, c.city].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  <InsigniaEstado estado={c.status} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-soft">
                  <InsigniasDocumentos cliente={c} />
                  <span>{c.sedes} {c.sedes === 1 ? "sede" : "sedes"}</span>
                  <span>{c.contactos} {c.contactos === 1 ? "contacto" : "contactos"}</span>
                  <span>{nombrePlazo(c.payment_term_days)}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/clientes/${c.id}`}
                    className="flex h-10 flex-1 items-center justify-center rounded-lg border border-line text-sm font-medium hover:bg-mist"
                  >
                    Ver ficha
                  </Link>
                  <Link
                    href={`/clientes/${c.id}/editar`}
                    className="flex h-10 flex-1 items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white hover:bg-brand-dark"
                  >
                    Actualizar
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
