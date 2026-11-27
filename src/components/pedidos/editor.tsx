"use client";

import { useEffect, useState, useTransition } from "react";
import { ImageIcon, LoaderCircle, Minus, Plus, Search, Trash2, TriangleAlert } from "lucide-react";
import { InsigniaStock } from "@/components/catalogo/insignias";
import { BotonEnviar, CampoArea, Mensaje, useFormularioAccion } from "@/components/formulario";
import {
  agregarProducto,
  borrarPedido,
  buscarProductos,
  cambiarCantidad,
  cambiarEstadoPedido,
  guardarNotasPedido,
  quitarProducto,
  type ProductoEncontrado,
} from "@/lib/acciones/pedidos";
import type { EstadoAccion } from "@/lib/acciones/tipos";
import type { ItemPedido, PedidoDetalle } from "@/lib/catalogo/datos";
import { urlFotoProducto, type Categoria } from "@/lib/catalogo/opciones";
import { pesos } from "@/lib/clientes/opciones";

function Miniatura({ ruta }: { ruta: string | null | undefined }) {
  const url = urlFotoProducto(ruta);
  return (
    <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-mist">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" loading="lazy" className="size-full object-contain" />
      ) : (
        <ImageIcon className="size-5 text-ink-soft/50" aria-hidden />
      )}
    </span>
  );
}

// Cantidad con botones − y +, o escribiéndola (se guarda al salir del campo)
function ControlCantidad({ pedidoId, item }: { pedidoId: string; item: ItemPedido }) {
  const [valor, setValor] = useState(String(item.quantity));
  const [guardando, iniciar] = useTransition();
  const [mensaje, setMensaje] = useState<EstadoAccion>({});

  useEffect(() => setValor(String(item.quantity)), [item.quantity]);

  const guardar = (nueva: number) => {
    if (!Number.isInteger(nueva) || nueva < 1 || nueva === item.quantity) {
      setValor(String(item.quantity));
      return;
    }
    setValor(String(nueva));
    iniciar(async () => {
      const r = await cambiarCantidad(pedidoId, item.id, nueva);
      setMensaje(r.error ? r : {});
      if (r.error) setValor(String(item.quantity));
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="inline-flex items-center rounded-lg border border-line">
        <button type="button" aria-label="Uno menos" disabled={guardando || item.quantity <= 1} onClick={() => guardar(item.quantity - 1)} className="grid size-10 place-items-center hover:bg-mist disabled:opacity-40">
          <Minus className="size-4" aria-hidden />
        </button>
        <label className="sr-only" htmlFor={`cant-${item.id}`}>Cantidad</label>
        <input
          id={`cant-${item.id}`}
          inputMode="numeric"
          value={valor}
          onChange={(e) => setValor(e.target.value.replace(/\D/g, ""))}
          onBlur={() => guardar(Number(valor))}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          className="h-10 w-14 border-x border-line text-center text-base tabular-nums outline-none focus:bg-mist"
        />
        <button type="button" aria-label="Uno más" disabled={guardando} onClick={() => guardar(item.quantity + 1)} className="grid size-10 place-items-center hover:bg-mist disabled:opacity-40">
          <Plus className="size-4" aria-hidden />
        </button>
      </div>
      <Mensaje estado={mensaje} />
    </div>
  );
}

function FilaItem({ pedidoId, item, editable }: { pedidoId: string; item: ItemPedido; editable: boolean }) {
  const [quitando, iniciar] = useTransition();
  const p = item.producto;
  const faltaStock = p !== null && item.quantity > p.stock;

  return (
    <li className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Miniatura ruta={p?.photo_url} />
        <div className="min-w-0">
          <p className="font-semibold break-words">{p?.name ?? "Producto borrado"}</p>
          <p className="text-xs text-ink-soft tabular-nums">
            {p?.sku} · {pesos(item.unit_price)} c/u
          </p>
          {faltaStock && (
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-warn">
              <TriangleAlert className="size-3.5" aria-hidden />
              Solo hay {p.stock} en stock
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 sm:justify-end">
        {editable ? (
          <ControlCantidad pedidoId={pedidoId} item={item} />
        ) : (
          <span className="text-sm tabular-nums">× {item.quantity}</span>
        )}
        <span className="w-28 text-right font-semibold tabular-nums">{pesos(item.subtotal)}</span>
        {editable && (
          <button
            type="button"
            aria-label={`Quitar ${p?.name ?? "producto"}`}
            disabled={quitando}
            onClick={() => iniciar(async () => void (await quitarProducto(pedidoId, item.id)))}
            className="grid size-10 place-items-center rounded-lg text-brand hover:bg-brand-soft disabled:opacity-50"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        )}
      </div>
    </li>
  );
}

function ResultadoBusqueda({ pedidoId, producto }: { pedidoId: string; producto: ProductoEncontrado }) {
  const [cantidad, setCantidad] = useState("1");
  const [agregando, iniciar] = useTransition();
  const [mensaje, setMensaje] = useState<EstadoAccion>({});
  const sinPrecio = producto.price <= 0;

  const agregar = () =>
    iniciar(async () => {
      const r = await agregarProducto(pedidoId, producto.id, Number(cantidad) || 1);
      setMensaje(r);
      if (!r.error) setCantidad("1");
    });

  return (
    <li className="flex flex-col gap-2 py-3">
      <div className="flex items-center gap-3">
        <Miniatura ruta={producto.photo_url} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold break-words">{producto.name}</p>
          <p className="text-xs text-ink-soft tabular-nums">
            {producto.sku} · {sinPrecio ? "Sin precio" : pesos(producto.price)}
          </p>
        </div>
        <InsigniaStock stock={producto.stock} />
      </div>
      {sinPrecio ? (
        <p className="rounded-lg bg-mist px-3 py-2 text-xs text-ink-soft">
          Todavía no tiene precio, así que no se puede agregar. El administrador se lo pone en el catálogo.
        </p>
      ) : (
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor={`agr-${producto.id}`}>Cantidad de {producto.name}</label>
          <input
            id={`agr-${producto.id}`}
            inputMode="numeric"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value.replace(/\D/g, ""))}
            className="h-10 w-20 rounded-lg border border-line text-center text-base tabular-nums outline-none focus:border-ink"
          />
          <button
            type="button"
            onClick={agregar}
            disabled={agregando}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-ink px-3 text-sm font-semibold text-paper hover:bg-ink/85 disabled:opacity-60"
          >
            {agregando ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <Plus className="size-4" aria-hidden />}
            Agregar al pedido
          </button>
        </div>
      )}
      <Mensaje estado={mensaje} />
    </li>
  );
}

function BuscadorProductos({ pedidoId, categorias }: { pedidoId: string; categorias: Categoria[] }) {
  const [texto, setTexto] = useState("");
  const [categoria, setCategoria] = useState("");
  const [resultados, setResultados] = useState<ProductoEncontrado[] | null>(null);
  const [buscando, setBuscando] = useState(true);

  // Busca 0,3 s después de dejar de escribir
  useEffect(() => {
    let vigente = true;
    setBuscando(true);
    const espera = setTimeout(async () => {
      const r = await buscarProductos(texto, categoria);
      if (vigente) {
        setResultados(r);
        setBuscando(false);
      }
    }, 300);
    return () => {
      vigente = false;
      clearTimeout(espera);
    };
  }, [texto, categoria]);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="relative">
          <label htmlFor="buscar-producto" className="sr-only">Buscar producto por nombre, código o medida</label>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-soft" aria-hidden />
          <input
            id="buscar-producto"
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Nombre, código o medida"
            className="h-11 w-full rounded-xl border border-line bg-paper pr-3 pl-9 text-base outline-none focus:border-ink focus:ring-2 focus:ring-brand/15"
          />
        </div>
        <label className="sr-only" htmlFor="buscar-categoria">Categoría</label>
        <select
          id="buscar-categoria"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="h-11 rounded-xl border border-line bg-paper px-3 text-base outline-none focus:border-ink sm:text-sm"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>
      <p className="text-xs text-ink-soft" aria-live="polite">
        {buscando
          ? "Buscando…"
          : !resultados || resultados.length === 0
            ? "No hay productos activos con esa búsqueda."
            : resultados.length >= 30
              ? "Se muestran los primeros 30. Escribe más para afinar la búsqueda."
              : `${resultados.length} ${resultados.length === 1 ? "resultado" : "resultados"}`}
      </p>
      {resultados && resultados.length > 0 && (
        <ul className="max-h-[28rem] divide-y divide-line overflow-y-auto rounded-xl border border-line px-3">
          {resultados.map((p) => (
            <ResultadoBusqueda key={p.id} pedidoId={pedidoId} producto={p} />
          ))}
        </ul>
      )}
    </div>
  );
}

function AccionesEstado({ pedido }: { pedido: PedidoDetalle }) {
  const [pendiente, iniciar] = useTransition();
  const [mensaje, setMensaje] = useState<EstadoAccion>({});

  const cambiar = (estado: string, pregunta?: string) => {
    if (pregunta && !window.confirm(pregunta)) return;
    iniciar(async () => setMensaje(await cambiarEstadoPedido(pedido.id, estado)));
  };

  const boton = "inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold disabled:opacity-60";

  return (
    <div className="flex flex-col gap-2">
      {pedido.status === "borrador" && (
        <>
          <button
            type="button"
            disabled={pendiente || pedido.items.length === 0}
            onClick={() => cambiar("enviado")}
            className={`${boton} bg-brand text-on-brand hover:bg-brand-dark`}
          >
            Enviar pedido
          </button>
          {pedido.items.length === 0 && <p className="text-xs text-ink-soft">Agrega al menos un producto para enviarlo.</p>}
          <button
            type="button"
            disabled={pendiente}
            onClick={() => {
              if (window.confirm(`¿Borrar el pedido #${pedido.number}? Esto no se puede deshacer.`)) {
                iniciar(async () => {
                  // Si sale bien, el servidor nos lleva a la lista de pedidos
                  const r = await borrarPedido(pedido.id);
                  if (r?.error) setMensaje(r);
                });
              }
            }}
            className={`${boton} text-brand hover:bg-brand-soft`}
          >
            Borrar borrador
          </button>
        </>
      )}
      {pedido.status === "enviado" && (
        <>
          <button
            type="button"
            disabled={pendiente}
            onClick={() => cambiar("completado", "Al completar el pedido se descuentan las cantidades del stock. ¿Continuar?")}
            className={`${boton} bg-brand text-on-brand hover:bg-brand-dark`}
          >
            Marcar como completado
          </button>
          <button type="button" disabled={pendiente} onClick={() => cambiar("borrador")} className={`${boton} border border-line hover:bg-mist`}>
            Volver a borrador para corregir
          </button>
        </>
      )}
      {pedido.status === "completado" && (
        <p className="rounded-xl bg-ok-soft px-3 py-2 text-sm">Pedido completado. El stock ya se descontó y el pedido no se puede cambiar.</p>
      )}
      <Mensaje estado={mensaje} />
    </div>
  );
}

function FormularioNotas({ pedido, editable }: { pedido: PedidoDetalle; editable: boolean }) {
  const { estado, enviando, ref, alEnviar } = useFormularioAccion<EstadoAccion>(guardarNotasPedido, {});
  return (
    <form ref={ref} onSubmit={alEnviar} noValidate className="flex flex-col gap-3">
      <input type="hidden" name="id" value={pedido.id} />
      <CampoArea id="pedido-notas" etiqueta="Notas del pedido" name="notes" defaultValue={pedido.notes ?? ""} maxLength={2000} readOnly={!editable} placeholder="Ej.: entregar el lunes en la sede principal." />
      {editable && (
        <>
          <Mensaje estado={estado} />
          <BotonEnviar enviando={enviando} textoEnviando="Guardando…" className="h-11 self-start bg-ink hover:bg-ink/85">
            Guardar notas
          </BotonEnviar>
        </>
      )}
    </form>
  );
}

export function EditorPedido({
  pedido,
  puedeEditar,
  categorias,
  enviar,
}: {
  pedido: PedidoDetalle;
  puedeEditar: boolean;
  categorias: Categoria[];
  /** Sección "Enviar al cliente" (WhatsApp y correo), armada en el servidor */
  enviar?: React.ReactNode;
}) {
  const editable = puedeEditar && pedido.status === "borrador";
  const unidades = pedido.items.reduce((suma, i) => suma + i.quantity, 0);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <div className="flex flex-col gap-6">
        <section className="rounded-xl border border-line p-4 sm:p-5">
          <h2 className="font-semibold">Productos ({pedido.items.length})</h2>
          {pedido.items.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">Todavía no hay productos. {editable ? "Búscalos abajo y agrégalos." : ""}</p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {pedido.items.map((item) => (
                <FilaItem key={item.id} pedidoId={pedido.id} item={item} editable={editable} />
              ))}
            </ul>
          )}
        </section>

        {editable && (
          <section className="rounded-xl border border-line p-4 sm:p-5">
            <h2 className="mb-3 font-semibold">Agregar productos</h2>
            <BuscadorProductos pedidoId={pedido.id} categorias={categorias} />
          </section>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <section className="rounded-xl border border-line p-4 sm:p-5">
          <p className="text-sm text-ink-soft">Total (IVA incluido)</p>
          <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">{pesos(pedido.total)}</p>
          <p className="mt-1 text-sm text-ink-soft tabular-nums">{unidades} {unidades === 1 ? "unidad" : "unidades"}</p>
          {puedeEditar && <div className="mt-4"><AccionesEstado pedido={pedido} /></div>}
          {!puedeEditar && <p className="mt-4 text-xs text-ink-soft">Solo quien creó el pedido o un administrador puede cambiarlo.</p>}
        </section>
        {enviar}
        <section className="rounded-xl border border-line p-4 sm:p-5">
          <FormularioNotas pedido={pedido} editable={puedeEditar && pedido.status !== "completado"} />
        </section>
      </div>
    </div>
  );
}
