// Historial de compras de un cliente → "¿ya le toca comprar?" (la barra de cada visita).
// Se calcula con sus pedidos enviados o completados (vista client_purchase_stats).

export type ResumenCompras = {
  compras: number;
  ultima_compra: string | null;
  ultimo_total: number | null;
  ultimo_pedido: string | null;
  promedio: number | null;
  frecuencia_dias: number | null;
};

export type EstadoCompra =
  | { tipo: "sin-compras" }
  | { tipo: "una-compra"; dias: number }
  | { tipo: "con-frecuencia"; dias: number; porcentaje: number; nivel: "alto" | "medio" | "bajo"; toca: boolean };

const DIA_MS = 86_400_000;

// 100 % = ya pasaron tantos días como los que suele esperar entre compras: ya le toca
export function estadoCompra(resumen: ResumenCompras | null | undefined, ahora = Date.now()): EstadoCompra {
  if (!resumen || !resumen.compras || !resumen.ultima_compra) return { tipo: "sin-compras" };
  const dias = Math.max(0, Math.floor((ahora - new Date(resumen.ultima_compra).getTime()) / DIA_MS));
  if (!resumen.frecuencia_dias || resumen.frecuencia_dias <= 0) return { tipo: "una-compra", dias };
  const porcentaje = Math.min(100, Math.round((dias / resumen.frecuencia_dias) * 100));
  return {
    tipo: "con-frecuencia",
    dias,
    porcentaje,
    nivel: porcentaje >= 90 ? "alto" : porcentaje >= 60 ? "medio" : "bajo",
    toca: dias >= resumen.frecuencia_dias,
  };
}
