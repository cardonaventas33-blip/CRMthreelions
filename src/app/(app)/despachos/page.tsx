import type { Metadata } from "next";
import Link from "next/link";
import { CircleCheck, Truck } from "lucide-react";
import { TarjetaDespacho } from "@/components/despachos/tarjeta-despacho";
import { hoyColombia } from "@/lib/agenda/fechas";
import { MAX_ENTREGADOS, listarDespachos, type Despacho } from "@/lib/despachos/datos";
import { obtenerUsuarioActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Despachos" };

const PESTANAS = {
  "por-despachar": {
    nombre: "Por despachar",
    vacio: "No hay pedidos por despachar. Cuando un pedido se marque como «Enviado», aparecerá aquí.",
  },
  despachados: { nombre: "Despachados", vacio: "No hay pedidos en camino." },
  entregados: { nombre: "Entregados", vacio: "Todavía no hay pedidos entregados." },
} as const;

type Pestana = keyof typeof PESTANAS;

type Props = { searchParams: Promise<{ ver?: string; pedido?: string }> };

export default async function Despachos({ searchParams }: Props) {
  const p = await searchParams;
  const ver: Pestana = p.ver && p.ver in PESTANAS ? (p.ver as Pestana) : "por-despachar";
  const [yo, datos] = await Promise.all([obtenerUsuarioActual(), listarDespachos()]);
  const esAdmin = yo?.rol === "admin";
  const hoy = hoyColombia();
  const firma = [yo?.nombre, "Three Lions SAS"].filter(Boolean).join("\n");

  const listas: Record<Pestana, Despacho[]> = {
    "por-despachar": datos.porDespachar,
    despachados: datos.despachados,
    entregados: datos.entregados,
  };
  const lista = listas[ver];
  // El pedido que se acaba de mover queda de primero y resaltado
  const resaltado = lista.find((x) => x.id === p.pedido) ?? null;
  const ordenada = resaltado ? [resaltado, ...lista.filter((x) => x !== resaltado)] : lista;
  const deOtros = !esAdmin && lista.some((x) => x.user_id !== yo?.id);

  const aviso = resaltado
    ? {
        "por-despachar": `Se deshizo el despacho del pedido #${resaltado.number}: está otra vez por despachar.`,
        despachados: `Listo: el pedido #${resaltado.number} quedó despachado. Si quieres, avísale al cliente por WhatsApp.`,
        entregados: `Listo: el pedido #${resaltado.number} quedó entregado y su stock ya se descontó.`,
      }[ver]
    : null;

  const contar = (clave: Pestana) => (clave === "entregados" ? null : listas[clave].length);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
        <Truck className="size-8 shrink-0 text-brand" aria-hidden />
        Despachos
      </h1>
      <p className="mt-2 max-w-2xl text-base text-ink-soft">
        Los pedidos enviados llegan aquí. Despáchalos con la transportadora y el número de guía; cuando lleguen, márcalos como
        entregados.
      </p>

      <nav aria-label="Estado del despacho" className="mt-6 grid grid-cols-3 gap-1 rounded-xl bg-mist p-1 sm:inline-grid sm:grid-flow-col sm:grid-cols-none">
        {(Object.keys(PESTANAS) as Pestana[]).map((clave) => {
          const activo = clave === ver;
          const n = contar(clave);
          return (
            <Link
              key={clave}
              href={`/despachos?ver=${clave}`}
              scroll={false}
              aria-current={activo ? "page" : undefined}
              className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-2 text-center text-sm leading-tight font-medium sm:px-4 ${
                activo ? "bg-paper text-ink shadow-sm dark:bg-line" : "text-ink-soft hover:text-ink"
              }`}
            >
              {PESTANAS[clave].nombre}
              {n !== null && n > 0 && (
                <span
                  className={`rounded-full px-1.5 text-xs font-semibold tabular-nums ${
                    clave === "por-despachar" ? "bg-warn-soft text-warn" : "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                  }`}
                >
                  {n}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {aviso && (
        <p role="status" className="mt-4 flex items-start gap-2 rounded-xl bg-ok-soft px-4 py-3 text-sm">
          <CircleCheck className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden />
          {aviso}
        </p>
      )}
      {deOtros && (
        <p className="mt-4 text-sm text-ink-soft">
          Solo puedes despachar y entregar tus propios pedidos; los demás los maneja su vendedor o un administrador.
        </p>
      )}
      {datos.error && <p className="mt-4 text-sm text-brand">{datos.error}</p>}

      {ordenada.length === 0 ? (
        <p className="mt-4 rounded-xl bg-mist px-4 py-6 text-center text-ink-soft">{PESTANAS[ver].vacio}</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {ordenada.map((x) => (
            <TarjetaDespacho
              key={x.id}
              pedido={x}
              hoy={hoy}
              firma={firma}
              puedeEditar={esAdmin || x.user_id === yo?.id}
              resaltado={x === resaltado}
            />
          ))}
        </ul>
      )}
      {ver === "entregados" && lista.length >= MAX_ENTREGADOS && (
        <p className="mt-4 text-sm text-ink-soft">
          Se muestran los últimos {MAX_ENTREGADOS}. Los anteriores están en{" "}
          <Link href="/pedidos?estado=completado" className="font-semibold text-brand hover:underline">
            Pedidos completados
          </Link>
          .
        </p>
      )}
    </div>
  );
}
