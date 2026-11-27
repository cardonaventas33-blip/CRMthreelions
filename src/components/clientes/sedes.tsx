"use client";

import { useEffect, useState, useTransition } from "react";
import { MapPin, Plus, Trash2 } from "lucide-react";
import {
  BotonEnviar,
  Campo,
  CampoArea,
  CampoLista,
  Mensaje,
  useFormularioAccion,
} from "@/components/formulario";
import { SubirArchivo } from "@/components/clientes/subir-archivo";
import { borrarSede, guardarSede, quitarArchivo } from "@/lib/acciones/clientes";
import type { EstadoAccion } from "@/lib/acciones/tipos";
import type { Sede } from "@/lib/clientes/datos";
import {
  DIAS_SEMANA,
  HORAS,
  PRODUCTOS_QUE_VENDE,
  TRAFICO,
  horaBonita,
} from "@/lib/clientes/opciones";

const opcionesTrafico = TRAFICO.map((t) => ({ valor: t, nombre: t }));
const opcionesHora = HORAS.map((h) => ({ valor: h, nombre: horaBonita(h) }));

// Casilla con forma de botoncito (días, productos)
function Ficha({ nombre, valor, marcado, texto }: { nombre: string; valor: string; marcado: boolean; texto: string }) {
  return (
    <label className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-line px-2.5 text-sm select-none has-[:checked]:border-brand/40 has-[:checked]:bg-brand-soft has-[:checked]:text-brand has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/30">
      <input type="checkbox" name={nombre} value={valor} defaultChecked={marcado} className="size-4 accent-brand" />
      {texto}
    </label>
  );
}

function FormularioSede({
  clienteId,
  sede,
  alTerminar,
}: {
  clienteId: string;
  sede?: Sede;
  alTerminar?: () => void;
}) {
  const { estado, enviando, ref, alEnviar } = useFormularioAccion<EstadoAccion>(guardarSede, {});
  const prefijo = sede ? `sede-${sede.id}` : "sede-nueva";

  useEffect(() => {
    if (estado.ok && !sede) alTerminar?.();
  }, [estado, sede, alTerminar]);

  return (
    <form ref={ref} onSubmit={alEnviar} noValidate className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <input type="hidden" name="client_id" value={clienteId} />
      {sede && <input type="hidden" name="id" value={sede.id} />}
      <Campo id={`${prefijo}-nombre`} etiqueta="Nombre de la sede *" name="name" defaultValue={sede?.name ?? "Sede principal"} maxLength={120} required />
      <Campo id={`${prefijo}-ciudad`} etiqueta="Ciudad *" name="city" list="ciudades-sugeridas" defaultValue={sede?.city ?? ""} maxLength={80} autoComplete="off" required />
      <div className="md:col-span-2">
        <Campo id={`${prefijo}-direccion`} etiqueta="Dirección *" name="address" defaultValue={sede?.address ?? ""} maxLength={300} required />
      </div>
      <CampoLista id={`${prefijo}-trafico`} etiqueta="Tráfico" name="traffic" opciones={opcionesTrafico} vacio="Elige…" defaultValue={sede?.traffic ?? ""} />
      <div className="grid grid-cols-2 gap-3">
        <CampoLista id={`${prefijo}-abre`} etiqueta="Abre" name="opens_at" opciones={opcionesHora} vacio="—" defaultValue={sede?.opens_at?.slice(0, 5) ?? ""} />
        <CampoLista id={`${prefijo}-cierra`} etiqueta="Cierra" name="closes_at" opciones={opcionesHora} vacio="—" defaultValue={sede?.closes_at?.slice(0, 5) ?? ""} />
      </div>
      <Campo id={`${prefijo}-empleados`} etiqueta="Empleados de la sede" name="employees" inputMode="numeric" defaultValue={sede?.employees?.toString() ?? ""} maxLength={6} />
      <Campo id={`${prefijo}-metros`} etiqueta="Metros cuadrados" name="square_meters" inputMode="numeric" defaultValue={sede?.square_meters?.toString() ?? ""} maxLength={8} />

      <fieldset className="md:col-span-2">
        <legend className="text-sm font-medium">Días de atención</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {DIAS_SEMANA.map((d) => (
            <Ficha key={d.clave} nombre="service_days" valor={d.clave} texto={d.nombre} marcado={sede ? sede.service_days.includes(d.clave) : d.clave !== "dom"} />
          ))}
        </div>
      </fieldset>

      <fieldset className="md:col-span-2">
        <legend className="text-sm font-medium">Productos que vende</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRODUCTOS_QUE_VENDE.map((p) => (
            <Ficha key={p} nombre="products" valor={p} texto={p} marcado={sede?.products.includes(p) ?? false} />
          ))}
        </div>
      </fieldset>

      <div className="md:col-span-2">
        <CampoArea id={`${prefijo}-notas`} etiqueta="Observaciones" name="notes" defaultValue={sede?.notes ?? ""} maxLength={2000} />
      </div>
      <div className="flex flex-col gap-3 md:col-span-2">
        <Mensaje estado={estado} />
        <BotonEnviar enviando={enviando} textoEnviando="Guardando…" className="md:self-start">
          {sede ? "Guardar sede" : "Agregar sede"}
        </BotonEnviar>
      </div>
    </form>
  );
}

function FotoSede({ clienteId, sede, enlace }: { clienteId: string; sede: Sede; enlace?: string }) {
  const [quitando, iniciar] = useTransition();
  return (
    <div className="flex flex-col gap-3 border-t border-line pt-4">
      <p className="text-sm font-medium">Foto de la sede</p>
      {enlace && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={enlace} alt={`Foto de ${sede.name}`} className="aspect-video w-full max-w-sm rounded-lg border border-line object-cover" />
      )}
      <div className="flex flex-wrap items-start gap-2">
        <SubirArchivo clienteId={clienteId} tipo="foto_sede" sedeId={sede.id} etiqueta={sede.photo_url ? "Cambiar foto" : "Subir foto"} soloFotos />
        {sede.photo_url && (
          <button
            type="button"
            disabled={quitando}
            onClick={() => {
              if (window.confirm("¿Quitar la foto de esta sede?")) {
                iniciar(async () => {
                  await quitarArchivo(clienteId, "foto_sede", sede.id);
                });
              }
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-brand hover:bg-brand-soft disabled:opacity-60"
          >
            <Trash2 className="size-4" aria-hidden />
            Quitar foto
          </button>
        )}
      </div>
    </div>
  );
}

export function SedesCliente({
  clienteId,
  sedes,
  enlaces,
}: {
  clienteId: string;
  sedes: Sede[];
  enlaces: Record<string, string>;
}) {
  const [creando, setCreando] = useState(sedes.length === 0);
  const [borrando, iniciar] = useTransition();
  const [mensaje, setMensaje] = useState<EstadoAccion>({});

  const borrar = (sede: Sede) => {
    if (!window.confirm(`¿Borrar la sede "${sede.name}"? Sus contactos quedan sin sede.`)) return;
    iniciar(async () => setMensaje(await borrarSede(sede.id, clienteId)));
  };

  return (
    <div className="flex flex-col gap-3">
      {sedes.map((sede, i) => (
        <details key={sede.id} open={i === 0 && sedes.length === 1} className="group rounded-xl border border-line">
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 rounded-xl px-4 py-2 hover:bg-mist [&::-webkit-details-marker]:hidden">
            <MapPin className="size-4 shrink-0 text-brand" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="font-semibold">{sede.name}</span>
              <span className="block truncate text-xs text-ink-soft">{sede.city} · {sede.address}</span>
            </span>
            <span className="text-xs text-ink-soft group-open:hidden">Editar</span>
          </summary>
          <div className="flex flex-col gap-4 border-t border-line p-4">
            <FormularioSede clienteId={clienteId} sede={sede} />
            <FotoSede clienteId={clienteId} sede={sede} enlace={sede.photo_url ? enlaces[sede.photo_url] : undefined} />
            <button
              type="button"
              onClick={() => borrar(sede)}
              disabled={borrando}
              className="inline-flex h-10 items-center gap-1.5 self-start rounded-lg px-3 text-sm font-medium text-brand hover:bg-brand-soft disabled:opacity-60"
            >
              <Trash2 className="size-4" aria-hidden />
              Borrar sede
            </button>
          </div>
        </details>
      ))}

      <Mensaje estado={mensaje} />

      {creando ? (
        <div className="rounded-xl border border-dashed border-brand/40 p-4">
          <p className="mb-4 font-semibold">Nueva sede</p>
          <FormularioSede clienteId={clienteId} alTerminar={() => setCreando(false)} />
          {sedes.length > 0 && (
            <button type="button" onClick={() => setCreando(false)} className="mt-3 h-10 rounded-lg px-3 text-sm font-medium text-ink-soft hover:bg-mist">
              Cancelar
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCreando(true)}
          className="inline-flex h-11 items-center gap-2 self-start rounded-xl border border-line px-4 text-sm font-semibold hover:bg-mist"
        >
          <Plus className="size-4" aria-hidden />
          Nueva sede
        </button>
      )}
    </div>
  );
}
