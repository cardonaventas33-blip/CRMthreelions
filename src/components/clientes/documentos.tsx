"use client";

import { useState, useTransition } from "react";
import { CircleCheck, CircleX, ExternalLink, Trash2 } from "lucide-react";
import { Mensaje } from "@/components/formulario";
import { SubirArchivo } from "@/components/clientes/subir-archivo";
import { quitarArchivo } from "@/lib/acciones/clientes";
import type { EstadoAccion } from "@/lib/acciones/tipos";
import { DOCUMENTOS } from "@/lib/clientes/opciones";

type Archivo = { tipo: string; nombre: string; ruta: string | null; enlace?: string; esFoto?: boolean };

// Cámara de Comercio · RUT · Tratamiento de datos · Foto del cliente
export function DocumentosCliente({
  clienteId,
  rutas,
  enlaces,
}: {
  clienteId: string;
  rutas: Record<string, string | null>;
  enlaces: Record<string, string>;
}) {
  const archivos: Archivo[] = [
    ...DOCUMENTOS.map((d) => ({
      tipo: d.tipo,
      nombre: d.nombre,
      ruta: rutas[d.columna],
      enlace: rutas[d.columna] ? enlaces[rutas[d.columna]!] : undefined,
    })),
    {
      tipo: "foto",
      nombre: "Foto del cliente (fachada o logo)",
      ruta: rutas.photo_url,
      enlace: rutas.photo_url ? enlaces[rutas.photo_url] : undefined,
      esFoto: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {archivos.map((a) => (
        <TarjetaArchivo key={a.tipo} clienteId={clienteId} archivo={a} />
      ))}
    </div>
  );
}

function TarjetaArchivo({ clienteId, archivo }: { clienteId: string; archivo: Archivo }) {
  const cargado = Boolean(archivo.ruta);
  const [quitando, iniciar] = useTransition();
  const [estado, setEstado] = useState<EstadoAccion>({});

  const quitar = () => {
    if (!window.confirm(`¿Quitar "${archivo.nombre}"? El archivo se borra.`)) return;
    iniciar(async () => {
      const r = await quitarArchivo(clienteId, archivo.tipo);
      setEstado(r.error ? r : {});
    });
  };

  return (
    <div
      className={`flex flex-col gap-3 rounded-xl border p-4 ${
        cargado ? "border-ok/30 bg-ok-soft/40" : "border-brand/25 bg-brand-soft/40"
      }`}
    >
      <div className="flex items-start gap-2">
        {cargado ? (
          <CircleCheck className="mt-0.5 size-5 shrink-0 text-ok" aria-hidden />
        ) : (
          <CircleX className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
        )}
        <div className="min-w-0">
          <p className="font-semibold">{archivo.nombre}</p>
          <p className="text-xs text-ink-soft">{cargado ? "Cargado" : "Falta"}</p>
        </div>
      </div>

      {archivo.esFoto && archivo.enlace && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={archivo.enlace}
          alt="Foto del cliente"
          className="aspect-video w-full max-w-full rounded-lg border border-line object-cover"
        />
      )}

      <div className="flex flex-wrap items-start gap-2">
        <SubirArchivo
          clienteId={clienteId}
          tipo={archivo.tipo}
          etiqueta={cargado ? "Cambiar" : "Subir"}
          soloFotos={archivo.esFoto}
        />
        {archivo.enlace && (
          <a
            href={archivo.enlace}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-line bg-paper px-3 text-sm font-medium hover:bg-mist"
          >
            <ExternalLink className="size-4" aria-hidden />
            Ver
          </a>
        )}
        {cargado && (
          <button
            type="button"
            onClick={quitar}
            disabled={quitando}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-brand hover:bg-brand-soft disabled:opacity-60"
          >
            <Trash2 className="size-4" aria-hidden />
            Quitar
          </button>
        )}
      </div>
      <Mensaje estado={estado} />
    </div>
  );
}
