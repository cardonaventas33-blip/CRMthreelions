"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus, Trash2, UserRound } from "lucide-react";
import { BotonEnviar, Campo, CampoLista, Mensaje, useFormularioAccion } from "@/components/formulario";
import { borrarContacto, guardarContacto } from "@/lib/acciones/clientes";
import type { EstadoAccion } from "@/lib/acciones/tipos";
import type { Contacto, Sede } from "@/lib/clientes/datos";
import { CARGOS } from "@/lib/clientes/opciones";

const opcionesCargo = CARGOS.map((c) => ({ valor: c, nombre: c }));

function Casilla({ id, nombre, texto, marcado }: { id: string; nombre: string; texto: string; marcado: boolean }) {
  return (
    <label htmlFor={id} className="inline-flex min-h-10 cursor-pointer items-center gap-2 text-sm">
      <input id={id} type="checkbox" name={nombre} defaultChecked={marcado} className="size-5 accent-brand" />
      {texto}
    </label>
  );
}

function FormularioContacto({
  clienteId,
  sedes,
  contacto,
  alTerminar,
}: {
  clienteId: string;
  sedes: Sede[];
  contacto?: Contacto;
  alTerminar?: () => void;
}) {
  const { estado, enviando, ref, alEnviar } = useFormularioAccion<EstadoAccion>(guardarContacto, {});
  const prefijo = contacto ? `contacto-${contacto.id}` : "contacto-nuevo";
  const opcionesSede = sedes.map((s) => ({ valor: s.id, nombre: s.name }));

  useEffect(() => {
    if (estado.ok && !contacto) alTerminar?.();
  }, [estado, contacto, alTerminar]);

  return (
    <form ref={ref} onSubmit={alEnviar} noValidate className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <input type="hidden" name="client_id" value={clienteId} />
      {contacto && <input type="hidden" name="id" value={contacto.id} />}
      <Campo id={`${prefijo}-nombre`} etiqueta="Nombre *" name="first_name" defaultValue={contacto?.first_name ?? ""} maxLength={80} autoComplete="off" required />
      <Campo id={`${prefijo}-apellidos`} etiqueta="Apellidos" name="last_name" defaultValue={contacto?.last_name ?? ""} maxLength={80} autoComplete="off" />
      <Campo id={`${prefijo}-telefono`} etiqueta="Teléfono / WhatsApp *" name="phone" type="tel" inputMode="tel" defaultValue={contacto?.phone ?? ""} maxLength={20} autoComplete="off" required />
      <Campo id={`${prefijo}-correo`} etiqueta="Correo" name="email" type="email" inputMode="email" defaultValue={contacto?.email ?? ""} maxLength={200} autoComplete="off" />
      <CampoLista id={`${prefijo}-cargo`} etiqueta="Cargo" name="role_title" opciones={opcionesCargo} vacio="Elige…" defaultValue={contacto?.role_title ?? ""} />
      <CampoLista id={`${prefijo}-sede`} etiqueta="Sede asociada" name="site_id" opciones={opcionesSede} vacio="Sin sede" defaultValue={contacto?.site_id ?? (sedes.length === 1 ? sedes[0].id : "")} />
      <fieldset className="flex flex-wrap gap-x-6 md:col-span-2">
        <legend className="sr-only">Comunicaciones que recibe</legend>
        <Casilla id={`${prefijo}-comercial`} nombre="receives_sales" texto="Comunicaciones comerciales" marcado={contacto?.receives_sales ?? true} />
        <Casilla id={`${prefijo}-cartera`} nombre="receives_collections" texto="Comunicaciones de cartera" marcado={contacto?.receives_collections ?? false} />
      </fieldset>
      <div className="flex flex-col gap-3 md:col-span-2">
        <Mensaje estado={estado} />
        <BotonEnviar enviando={enviando} textoEnviando="Guardando…" className="md:self-start">
          {contacto ? "Guardar contacto" : "Agregar contacto"}
        </BotonEnviar>
      </div>
    </form>
  );
}

export function ContactosCliente({
  clienteId,
  contactos,
  sedes,
}: {
  clienteId: string;
  contactos: Contacto[];
  sedes: Sede[];
}) {
  const [creando, setCreando] = useState(contactos.length === 0);
  const [borrando, iniciar] = useTransition();
  const [mensaje, setMensaje] = useState<EstadoAccion>({});

  const borrar = (c: Contacto) => {
    if (!window.confirm(`¿Borrar el contacto "${c.first_name} ${c.last_name}"?`)) return;
    iniciar(async () => setMensaje(await borrarContacto(c.id, clienteId)));
  };

  return (
    <div className="flex flex-col gap-3">
      {contactos.map((c) => (
        <details key={c.id} className="group rounded-xl border border-line">
          <summary className="flex min-h-12 cursor-pointer list-none flex-wrap items-center gap-2 rounded-xl px-4 py-2 hover:bg-mist [&::-webkit-details-marker]:hidden">
            <UserRound className="size-4 shrink-0 text-brand" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="font-semibold">{c.first_name} {c.last_name}</span>
              {c.role_title && <span className="ml-2 text-xs text-ink-soft">{c.role_title}</span>}
            </span>
            {c.receives_sales && <span className="rounded-md bg-ok-soft px-1.5 py-0.5 text-xs font-medium text-ok">✓ Comercial</span>}
            {c.receives_collections && <span className="rounded-md bg-ok-soft px-1.5 py-0.5 text-xs font-medium text-ok">✓ Cartera</span>}
          </summary>
          <div className="flex flex-col gap-4 border-t border-line p-4">
            <FormularioContacto clienteId={clienteId} sedes={sedes} contacto={c} />
            <button
              type="button"
              onClick={() => borrar(c)}
              disabled={borrando}
              className="inline-flex h-10 items-center gap-1.5 self-start rounded-lg px-3 text-sm font-medium text-brand hover:bg-brand-soft disabled:opacity-60"
            >
              <Trash2 className="size-4" aria-hidden />
              Borrar contacto
            </button>
          </div>
        </details>
      ))}

      <Mensaje estado={mensaje} />

      {creando ? (
        <div className="rounded-xl border border-dashed border-brand/40 p-4">
          <p className="mb-4 font-semibold">Nuevo contacto</p>
          <FormularioContacto clienteId={clienteId} sedes={sedes} alTerminar={() => setCreando(false)} />
          {contactos.length > 0 && (
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
          Nuevo contacto
        </button>
      )}
    </div>
  );
}
