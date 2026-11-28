"use client";

import { useState, useTransition, type ReactNode } from "react";
import { PackageCheck, Truck, Undo2 } from "lucide-react";
import { BotonEnviar, Campo, CampoArea, CampoLista, Mensaje, useFormularioAccion } from "@/components/formulario";
import { deshacerDespacho, despacharPedido, entregarPedido } from "@/lib/acciones/despachos";
import type { EstadoAccion } from "@/lib/acciones/tipos";
import { ENTREGA_PROPIA, OTRA_TRANSPORTADORA, TRANSPORTADORAS, type EstadoDespacho } from "@/lib/despachos/opciones";

const opcionesTransportadora = [...TRANSPORTADORAS, ENTREGA_PROPIA, OTRA_TRANSPORTADORA].map((t) => ({
  valor: t,
  nombre: t === OTRA_TRANSPORTADORA ? "Otra transportadora" : t === ENTREGA_PROPIA ? "Entrega propia (lo llevamos nosotros)" : t,
}));

const boton = "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold disabled:opacity-60";

type Props = {
  id: string;
  estado: EstadoDespacho;
  hoy: string;
  /** Después de guardar: volver a Despachos o a la página del pedido */
  volver: "despachos" | "pedido";
  /** Botones que van en la misma fila (por ejemplo, avisar por WhatsApp) */
  extra?: ReactNode;
};

// Botones para pasar el pedido al siguiente paso: Despachar → Marcar entregado
export function AccionesDespacho({ id, estado, hoy, volver, extra }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [pendiente, iniciar] = useTransition();
  const [mensaje, setMensaje] = useState<EstadoAccion>({});

  if (estado === "entregado") return extra ? <div className="flex flex-wrap gap-2">{extra}</div> : null;

  if (abierto) {
    return estado === "por-despachar" ? (
      <FormularioDespacho id={id} hoy={hoy} volver={volver} alCancelar={() => setAbierto(false)} />
    ) : (
      <FormularioEntrega id={id} hoy={hoy} volver={volver} alCancelar={() => setAbierto(false)} />
    );
  }

  const deshacer = () => {
    if (!window.confirm("¿Deshacer el despacho? El pedido vuelve a «Por despachar» y se borran la transportadora y la guía.")) return;
    iniciar(async () => {
      // Si sale bien, el servidor nos lleva a donde quedó el pedido
      const r = await deshacerDespacho(id, volver);
      if (r?.error) setMensaje(r);
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setAbierto(true)}
          disabled={pendiente}
          className={`${boton} bg-brand text-on-brand hover:bg-brand-dark`}
        >
          {estado === "por-despachar" ? <Truck className="size-4" aria-hidden /> : <PackageCheck className="size-4" aria-hidden />}
          {estado === "por-despachar" ? "Despachar" : "Marcar entregado"}
        </button>
        {extra}
        {estado === "despachado" && (
          <button type="button" onClick={deshacer} disabled={pendiente} className={`${boton} text-ink-soft hover:bg-mist hover:text-ink`}>
            <Undo2 className="size-4" aria-hidden />
            Deshacer despacho
          </button>
        )}
      </div>
      <Mensaje estado={mensaje} />
    </div>
  );
}

type PropsFormulario = { id: string; hoy: string; volver: string; alCancelar: () => void };

function FormularioDespacho({ id, hoy, volver, alCancelar }: PropsFormulario) {
  const { estado, enviando, ref, alEnviar } = useFormularioAccion<EstadoAccion>(despacharPedido, {});
  const [transportadora, setTransportadora] = useState("");

  return (
    <form ref={ref} onSubmit={alEnviar} noValidate className="@container rounded-xl bg-mist/60 p-4">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="volver" value={volver} />
      <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2">
        <CampoLista
          id={`transportadora-${id}`}
          etiqueta="Transportadora *"
          name="carrier"
          opciones={opcionesTransportadora}
          vacio="Elige la transportadora…"
          value={transportadora}
          onChange={(e) => setTransportadora(e.target.value)}
        />
        {transportadora === OTRA_TRANSPORTADORA && (
          <Campo id={`otra-${id}`} etiqueta="¿Cuál transportadora? *" name="carrier_otra" maxLength={80} autoComplete="off" />
        )}
        {transportadora !== ENTREGA_PROPIA && (
          <Campo
            id={`guia-${id}`}
            etiqueta="Número de guía"
            name="tracking_number"
            maxLength={80}
            autoComplete="off"
            ayuda="Si todavía no lo tienes, déjalo vacío."
          />
        )}
        <Campo id={`fecha-despacho-${id}`} etiqueta="Fecha del despacho *" name="fecha" type="date" defaultValue={hoy} max={hoy} />
        <div className="@lg:col-span-2">
          <CampoArea
            id={`notas-despacho-${id}`}
            etiqueta="Notas del despacho"
            name="dispatch_notes"
            rows={2}
            maxLength={1000}
            placeholder="Ej.: 2 cajas; se entrega en la bodega de la calle 30."
          />
        </div>
        <div className="flex flex-col gap-3 @lg:col-span-2">
          <Mensaje estado={estado} />
          <div className="flex flex-wrap gap-2">
            <BotonEnviar enviando={enviando} textoEnviando="Guardando…">
              Confirmar despacho
            </BotonEnviar>
            <button type="button" onClick={alCancelar} className={`${boton} h-12 border border-line bg-paper hover:bg-mist`}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function FormularioEntrega({ id, hoy, volver, alCancelar }: PropsFormulario) {
  const { estado, enviando, ref, alEnviar } = useFormularioAccion<EstadoAccion>(entregarPedido, {});

  return (
    <form ref={ref} onSubmit={alEnviar} noValidate className="@container rounded-xl bg-mist/60 p-4">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="volver" value={volver} />
      <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2">
        <Campo
          id={`recibe-${id}`}
          etiqueta="¿Quién lo recibió?"
          name="received_by"
          maxLength={120}
          autoComplete="off"
          placeholder="Nombre de quien recibió"
        />
        <Campo id={`fecha-entrega-${id}`} etiqueta="Fecha de entrega *" name="fecha" type="date" defaultValue={hoy} max={hoy} />
        <p className="text-sm text-ink-soft @lg:col-span-2">
          Al confirmar, el pedido queda <strong className="font-semibold text-ink">completado</strong> y sus productos se descuentan del stock.
          Después ya no se puede cambiar.
        </p>
        <div className="flex flex-col gap-3 @lg:col-span-2">
          <Mensaje estado={estado} />
          <div className="flex flex-wrap gap-2">
            <BotonEnviar enviando={enviando} textoEnviando="Guardando…">
              Confirmar entrega
            </BotonEnviar>
            <button type="button" onClick={alCancelar} className={`${boton} h-12 border border-line bg-paper hover:bg-mist`}>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
