"use client";

import { useRef, useState, useTransition } from "react";
import { Copy, ImageIcon, LoaderCircle, Trash2, Upload } from "lucide-react";
import { Mensaje } from "@/components/formulario";
import { quitarFotoProducto, registrarFotoProducto, usarFotoEnLinea } from "@/lib/acciones/productos";
import type { EstadoAccion } from "@/lib/acciones/tipos";
import { TAMANO_MAXIMO_FOTO, TIPOS_FOTO } from "@/lib/catalogo/opciones";
import { crearClienteNavegador } from "@/lib/supabase/navegador";

const EXTENSION: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export function FotoProducto({
  productoId,
  urlFoto,
  linea,
}: {
  productoId: string;
  urlFoto: string | null;
  linea: string | null;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [estado, setEstado] = useState<EstadoAccion>({});
  const [ocupado, iniciar] = useTransition();

  async function alElegir(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    if (!TIPOS_FOTO.includes(archivo.type)) {
      setEstado({ error: "Elige una foto JPG, PNG o WEBP." });
      return;
    }
    if (archivo.size > TAMANO_MAXIMO_FOTO) {
      setEstado({ error: "La foto pesa más de 5 MB. Prueba con una más liviana." });
      return;
    }
    setSubiendo(true);
    setEstado({});
    const ruta = `${productoId}/${Date.now()}.${EXTENSION[archivo.type]}`;
    const { error } = await crearClienteNavegador()
      .storage.from("productos")
      .upload(ruta, archivo, { contentType: archivo.type, upsert: false });
    if (error) {
      setSubiendo(false);
      setEstado({ error: "No se pudo subir la foto. Revisa tu conexión e intenta de nuevo." });
      return;
    }
    const r = await registrarFotoProducto(productoId, ruta);
    setSubiendo(false);
    setEstado(r);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid aspect-square w-full max-w-xs place-items-center overflow-hidden rounded-xl border border-line bg-mist">
        {urlFoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={urlFoto} alt="Foto del producto" className="size-full object-contain" />
        ) : (
          <ImageIcon className="size-12 text-ink-soft/50" aria-hidden />
        )}
      </div>
      <input ref={entrada} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-hidden onChange={alElegir} />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => entrada.current?.click()}
          disabled={subiendo}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-line px-3 text-sm font-medium hover:bg-mist disabled:opacity-60"
        >
          {subiendo ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <Upload className="size-4" aria-hidden />}
          {subiendo ? "Subiendo…" : urlFoto ? "Cambiar foto" : "Subir foto"}
        </button>
        {urlFoto && linea && (
          <button
            type="button"
            disabled={ocupado}
            onClick={() => iniciar(async () => setEstado(await usarFotoEnLinea(productoId)))}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-line px-3 text-sm font-medium hover:bg-mist disabled:opacity-60"
          >
            <Copy className="size-4" aria-hidden />
            Usar en toda la línea
          </button>
        )}
        {urlFoto && (
          <button
            type="button"
            disabled={ocupado}
            onClick={() => {
              if (window.confirm("¿Quitar la foto de este producto?")) {
                iniciar(async () => setEstado(await quitarFotoProducto(productoId)));
              }
            }}
            className="inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-brand hover:bg-brand-soft disabled:opacity-60"
          >
            <Trash2 className="size-4" aria-hidden />
            Quitar
          </button>
        )}
      </div>
      <p className="text-xs text-ink-soft">JPG, PNG o WEBP de hasta 5 MB. Estas fotos se pueden compartir con clientes.</p>
      <Mensaje estado={estado} />
    </div>
  );
}
