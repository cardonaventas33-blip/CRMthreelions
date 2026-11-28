import type { EstadoCompra } from "@/lib/agenda/compras";
import type { HistorialVisita } from "@/lib/agenda/ruta";
import { pesos } from "@/lib/clientes/opciones";

// Barra "¿ya le toca comprar?": 100 % verde = ya le toca; poco % rojo = compró hace poco
export function BarraCompra({ compra }: { compra: EstadoCompra }) {
  if (compra.tipo !== "con-frecuencia") return null;
  const color = compra.nivel === "alto" ? "bg-ok" : compra.nivel === "medio" ? "bg-warn" : "bg-brand";
  return (
    <span
      className="mt-1 flex h-3.5 w-full overflow-hidden rounded-full bg-line"
      role="img"
      aria-label={`${compra.porcentaje} % del tiempo que suele esperar entre compras`}
    >
      <span
        className={`flex h-full items-center justify-end rounded-full pr-1.5 text-[9px] leading-none font-bold text-on-brand ${color}`}
        style={{ width: `${Math.max(compra.porcentaje, 22)}%` }}
      >
        {compra.porcentaje}%
      </span>
    </span>
  );
}

function Caja({ titulo, children, resaltada = false }: { titulo: string; children: React.ReactNode; resaltada?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${resaltada ? "border-warn/40 bg-warn-soft" : "border-line"}`}>
      <p className="text-[11px] font-semibold tracking-wider text-ink-soft uppercase">{titulo}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

// "Historial del cliente" y "Se llevó", como en la referencia del dueño
export function HistorialCliente({ historial }: { historial: HistorialVisita }) {
  const { ultimaCompra, potencial, frecuenciaDias, compra, seLlevo, referenciasMas } = historial;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold tracking-wider text-ink-soft uppercase">Historial del cliente</p>
      {compra.tipo === "sin-compras" ? (
        <p className="rounded-xl bg-mist px-3 py-2 text-sm text-ink-soft">
          Todavía no tiene compras registradas (pedidos enviados o completados).
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Caja titulo="Última compra">
            <p className="text-lg font-bold tabular-nums">{ultimaCompra ? pesos(ultimaCompra.total) : "—"}</p>
            {ultimaCompra && <p className="text-xs text-ink-soft">{ultimaCompra.fecha}</p>}
          </Caja>
          <Caja titulo="Compra en promedio">
            <p className="text-lg font-bold tabular-nums">{potencial !== null ? pesos(potencial) : "—"}</p>
          </Caja>
          <Caja titulo="Frecuencia" resaltada={compra.tipo === "con-frecuencia" && compra.toca}>
            {compra.tipo === "con-frecuencia" ? (
              <>
                <p className="text-lg font-bold text-warn">cada {frecuenciaDias}d</p>
                <p className="text-xs text-ink-soft">
                  {compra.dias}d sin comprar{compra.toca ? " · ya le toca" : ""}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold">Una sola compra</p>
                <p className="text-xs text-ink-soft">hace {compra.dias}d</p>
              </>
            )}
          </Caja>
        </div>
      )}

      {seLlevo.length > 0 && (
        <div>
          <p className="text-xs font-semibold tracking-wider text-ink-soft uppercase">Se llevó la última vez</p>
          <ul className="mt-2 flex flex-col gap-1 text-sm">
            {seLlevo.map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-8 shrink-0 text-right font-bold tabular-nums">{item.cantidad}</span>
                <span className="min-w-0 break-words">{item.nombre}</span>
              </li>
            ))}
          </ul>
          {referenciasMas > 0 && <p className="mt-1 text-xs text-ink-soft">y {referenciasMas} referencias más</p>}
        </div>
      )}
    </div>
  );
}
