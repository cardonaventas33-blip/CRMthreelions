"use client";

import { useState } from "react";
import { BotonEnviar, Campo, CampoArea, CampoLista, Mensaje, useFormularioAccion } from "@/components/formulario";
import { guardarCita } from "@/lib/acciones/citas";
import type { EstadoAccion } from "@/lib/acciones/tipos";
import { DURACIONES, TITULOS_SUGERIDOS } from "@/lib/agenda/fechas";
import { TIPOS_CITA, type TipoCita } from "@/lib/agenda/opciones";
import { HORAS, horaBonita } from "@/lib/clientes/opciones";

type Opcion = { id: string; nombre: string };
type ClienteOpcion = Opcion & { sedes: Opcion[] };

export type CitaEditable = {
  id: string;
  title: string;
  kind: TipoCita;
  fecha: string;
  hora: string;
  duracion: number;
  client_id: string | null;
  site_id: string | null;
  user_id: string;
  notes: string | null;
};

const opcionesTipo = Object.entries(TIPOS_CITA).map(([valor, t]) => ({ valor, nombre: t.nombre }));

export function FormularioCita({
  cita,
  diaInicial,
  clientes,
  equipo,
  clienteInicial = "",
  yoId,
}: {
  cita?: CitaEditable;
  diaInicial: string;
  clientes: ClienteOpcion[];
  /** Solo para el administrador: puede elegir quién va a la cita */
  equipo: Opcion[] | null;
  clienteInicial?: string;
  yoId: string;
}) {
  const { estado, enviando, ref, alEnviar } = useFormularioAccion<EstadoAccion>(guardarCita, {});
  const [clienteId, setClienteId] = useState(cita?.client_id ?? clienteInicial);
  const sedes = clientes.find((c) => c.id === clienteId)?.sedes ?? [];

  // Si la cita guardada tiene una hora o duración fuera de la lista, se agrega para no perderla
  const horas = HORAS.map((h) => ({ valor: h, nombre: horaBonita(h) }));
  if (cita && !HORAS.includes(cita.hora)) horas.unshift({ valor: cita.hora, nombre: horaBonita(cita.hora) });
  const duraciones: { valor: string; nombre: string }[] = DURACIONES.map((d) => ({ valor: String(d.minutos), nombre: d.nombre }));
  if (cita && !DURACIONES.some((d) => d.minutos === cita.duracion)) {
    duraciones.unshift({ valor: String(cita.duracion), nombre: `${cita.duracion} minutos` });
  }

  return (
    <form ref={ref} onSubmit={alEnviar} noValidate className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {cita && <input type="hidden" name="id" value={cita.id} />}
      <CampoLista id="cita-tipo" etiqueta="Tipo de visita *" name="kind" opciones={opcionesTipo} defaultValue={cita?.kind ?? "planificacion"} />
      <div>
        <Campo
          id="cita-titulo"
          etiqueta="¿De qué es la cita? *"
          name="title"
          defaultValue={cita?.title ?? "Visita"}
          maxLength={200}
          list="titulos-cita"
          autoComplete="off"
          required
        />
        <datalist id="titulos-cita">
          {TITULOS_SUGERIDOS.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </div>
      <CampoLista
        id="cita-cliente"
        etiqueta="Cliente"
        name="client_id"
        opciones={clientes.map((c) => ({ valor: c.id, nombre: c.nombre }))}
        vacio="Sin cliente (cita interna)"
        value={clienteId}
        onChange={(e) => setClienteId(e.target.value)}
      />
      {/* La lista de sedes cambia según el cliente elegido */}
      <CampoLista
        key={clienteId}
        id="cita-sede"
        etiqueta="Sede"
        name="site_id"
        opciones={sedes.map((s) => ({ valor: s.id, nombre: s.nombre }))}
        vacio={!clienteId ? "Primero elige el cliente" : sedes.length ? "Sin sede en particular" : "Este cliente no tiene sedes"}
        defaultValue={cita && cita.client_id === clienteId ? (cita.site_id ?? "") : (sedes.length === 1 ? sedes[0].id : "")}
        disabled={!clienteId || sedes.length === 0}
      />
      <Campo id="cita-fecha" etiqueta="Fecha *" name="fecha" type="date" defaultValue={cita?.fecha ?? diaInicial} required ayuda="De lunes a sábado." />
      <div className="grid grid-cols-2 gap-3">
        <CampoLista id="cita-hora" etiqueta="Hora *" name="hora" opciones={horas} defaultValue={cita?.hora ?? "09:00"} />
        <CampoLista id="cita-duracion" etiqueta="Duración *" name="duracion" opciones={duraciones} defaultValue={String(cita?.duracion ?? 60)} />
      </div>
      {equipo && (
        <CampoLista
          id="cita-responsable"
          etiqueta="Responsable *"
          name="user_id"
          opciones={equipo.map((p) => ({ valor: p.id, nombre: p.id === yoId ? `${p.nombre} (tú)` : p.nombre }))}
          defaultValue={cita?.user_id ?? yoId}
        />
      )}
      <div className="md:col-span-2">
        <CampoArea
          id="cita-notas"
          etiqueta="Notas"
          name="notes"
          defaultValue={cita?.notes ?? ""}
          maxLength={2000}
          placeholder="Ej.: llevar el catálogo de plumillas; preguntar por el encargado de compras."
        />
      </div>
      <div className="flex flex-col gap-3 md:col-span-2">
        <Mensaje estado={estado} />
        <BotonEnviar enviando={enviando} textoEnviando="Guardando…" className="md:self-start">
          {cita ? "Guardar cambios" : "Crear cita"}
        </BotonEnviar>
      </div>
    </form>
  );
}
