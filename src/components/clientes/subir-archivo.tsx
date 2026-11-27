"use client";

import { useRef, useState } from "react";
import { LoaderCircle, Upload } from "lucide-react";
import { Mensaje } from "@/components/formulario";
import { registrarArchivo } from "@/lib/acciones/clientes";
import type { EstadoAccion } from "@/lib/acciones/tipos";
import { TAMANO_MAXIMO, TIPOS_ARCHIVO } from "@/lib/clientes/opciones";
import { crearClienteNavegador } from "@/lib/supabase/navegador";

const TIPO_POR_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};

// Sube un archivo directo al almacén privado y luego guarda su ruta en el cliente
export function SubirArchivo({
  clienteId,
  tipo,
  sedeId = null,
  etiqueta,
  soloFotos = false,
}: {
  clienteId: string;
  tipo: string;
  sedeId?: string | null;
  etiqueta: string;
  soloFotos?: boolean;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [estado, setEstado] = useState<EstadoAccion>({});

  async function alElegir(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;

    const extension = (archivo.name.split(".").pop() ?? "").toLowerCase();
    const tipoArchivo = archivo.type || TIPO_POR_EXTENSION[extension] || "";
    if (!TIPOS_ARCHIVO.includes(tipoArchivo) || (soloFotos && !tipoArchivo.startsWith("image/"))) {
      setEstado({ error: soloFotos ? "Elige una foto (JPG, PNG, WEBP o HEIC)." : "Elige un PDF o una foto." });
      return;
    }
    if (archivo.size > TAMANO_MAXIMO) {
      setEstado({ error: "El archivo pesa más de 10 MB. Prueba con uno más liviano." });
      return;
    }

    setSubiendo(true);
    setEstado({});
    const extensionLimpia = Object.keys(TIPO_POR_EXTENSION).includes(extension) ? extension : "pdf";
    const nombre = tipo === "foto_sede" ? `sedes/${sedeId}` : tipo;
    const ruta = `${clienteId}/${nombre}-${Date.now()}.${extensionLimpia}`;

    const { error } = await crearClienteNavegador()
      .storage.from("clientes")
      .upload(ruta, archivo, { contentType: tipoArchivo, upsert: false });
    if (error) {
      setSubiendo(false);
      setEstado({ error: "No se pudo subir el archivo. Revisa tu conexión e intenta de nuevo." });
      return;
    }

    const resultado = await registrarArchivo(clienteId, tipo, ruta, sedeId);
    setSubiendo(false);
    setEstado(resultado.error ? resultado : {});
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={entrada}
        type="file"
        accept={soloFotos ? "image/*" : "application/pdf,image/*"}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={alElegir}
      />
      <button
        type="button"
        onClick={() => entrada.current?.click()}
        disabled={subiendo}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-line bg-paper px-3 text-sm font-medium hover:bg-mist disabled:opacity-60"
      >
        {subiendo ? (
          <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
        ) : (
          <Upload className="size-4" aria-hidden />
        )}
        {subiendo ? "Subiendo…" : etiqueta}
      </button>
      <Mensaje estado={estado} />
    </div>
  );
}
