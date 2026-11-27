import { DOCUMENTOS, ESTADOS_CLIENTE, type EstadoCliente } from "@/lib/clientes/opciones";

const COLOR_ESTADO: Record<EstadoCliente, string> = {
  pendiente: "bg-warn-soft text-warn",
  validado: "bg-ok-soft text-ok",
  inactivo: "bg-mist text-ink-soft",
};

export function InsigniaEstado({ estado }: { estado: EstadoCliente }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${COLOR_ESTADO[estado]}`}
    >
      {ESTADOS_CLIENTE[estado]}
    </span>
  );
}

type ConDocumentos = {
  camara_comercio_url: string | null;
  rut_doc_url: string | null;
  tratamiento_datos_url: string | null;
};

// CC · RUT · TD: verde si está cargado, gris si falta
export function InsigniasDocumentos({ cliente }: { cliente: ConDocumentos }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      {DOCUMENTOS.map((doc) => {
        const cargado = Boolean(cliente[doc.columna]);
        return (
          <span
            key={doc.tipo}
            title={`${doc.nombre}: ${cargado ? "cargado" : "falta"}`}
            className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
              cargado ? "bg-ok-soft text-ok" : "bg-mist text-ink-soft/70 line-through"
            }`}
          >
            {doc.corto}
            <span className="sr-only">{cargado ? " cargado" : " falta"}</span>
          </span>
        );
      })}
    </span>
  );
}

export function documentosCompletos(cliente: ConDocumentos) {
  return DOCUMENTOS.every((d) => Boolean(cliente[d.columna]));
}
