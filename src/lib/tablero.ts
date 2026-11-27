import "server-only";
import type { Familia } from "@/lib/catalogo/opciones";
import type { EstadoCliente } from "@/lib/clientes/opciones";
import { crearClienteServidor } from "@/lib/supabase/server";

// Colombia está en UTC-5 todo el año (no tiene horario de verano)
const DESFASE = 5 * 60 * 60 * 1000;
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export type Indicador = { actual: number; anterior: number };

export type ResumenTablero = {
  periodo: string;
  periodoAnterior: string;
  ventas: Indicador;
  unidades: Indicador;
  // Ventas por familia: llantas, baterías, plumillas y otros productos
  categorias: Record<Familia, Indicador>;
  clientes: Record<EstadoCliente, number> & { total: number };
  ultimosClientes: { id: string; name: string; trade_name: string | null; city: string | null }[];
};

type PedidoCrudo = {
  total: number | string;
  created_at: string;
  order_items: {
    quantity: number;
    subtotal: number | string;
    products: { categoria: { family: Familia } | null } | null;
  }[];
};

export async function obtenerResumen(): Promise<ResumenTablero> {
  const local = new Date(Date.now() - DESFASE);
  const anio = local.getUTCFullYear();
  const mes = local.getUTCMonth();
  const dia = local.getUTCDate();

  // Mismo tramo de días en el mes anterior (del 1 al mismo día)
  const diasMesAnterior = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const diaAnterior = Math.min(dia, diasMesAnterior);
  const inicioMes = Date.UTC(anio, mes, 1) + DESFASE;
  const inicioAnterior = Date.UTC(anio, mes - 1, 1) + DESFASE;
  const finAnterior = Date.UTC(anio, mes - 1, diaAnterior + 1) + DESFASE;
  const mesAnterior = (mes + 11) % 12;

  const supabase = await crearClienteServidor();
  const [pedidos, clientes, ultimos] = await Promise.all([
    supabase
      .from("orders")
      .select("total, created_at, order_items(quantity, subtotal, products(categoria:product_categories(family)))")
      .in("status", ["enviado", "completado"])
      .gte("created_at", new Date(inicioAnterior).toISOString()),
    supabase.from("clients").select("status"),
    supabase
      .from("clients")
      .select("id, name, trade_name, city")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const vacio = (): Indicador => ({ actual: 0, anterior: 0 });
  const resumen: ResumenTablero = {
    periodo: `del 1 al ${dia} de ${MESES[mes]}`,
    periodoAnterior: `del 1 al ${diaAnterior} de ${MESES[mesAnterior]}`,
    ventas: vacio(),
    unidades: vacio(),
    categorias: { llantas: vacio(), baterias: vacio(), plumillas: vacio(), otros: vacio() },
    clientes: { total: 0, pendiente: 0, validado: 0, inactivo: 0 },
    ultimosClientes: (ultimos.data ?? []) as ResumenTablero["ultimosClientes"],
  };

  for (const pedido of (pedidos.data ?? []) as unknown as PedidoCrudo[]) {
    const fecha = new Date(pedido.created_at).getTime();
    const tramo = fecha >= inicioMes ? "actual" : fecha < finAnterior ? "anterior" : null;
    if (!tramo) continue;
    resumen.ventas[tramo] += Number(pedido.total);
    for (const item of pedido.order_items ?? []) {
      resumen.unidades[tramo] += item.quantity;
      const familia = item.products?.categoria?.family ?? "otros";
      if (familia in resumen.categorias) resumen.categorias[familia][tramo] += Number(item.subtotal);
    }
  }

  for (const c of (clientes.data ?? []) as { status: EstadoCliente }[]) {
    resumen.clientes.total += 1;
    resumen.clientes[c.status] += 1;
  }

  return resumen;
}
