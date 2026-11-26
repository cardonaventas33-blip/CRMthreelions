"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { useFormStatus } from "react-dom";
import { Check, Eye, EyeOff, LoaderCircle } from "lucide-react";

type Estado = { ok?: string; error?: string };

// Conecta un formulario con una acción del servidor.
// A diferencia del envío normal, NO borra lo escrito si hay un error.
export function useFormularioAccion<E extends Estado>(
  accion: (antes: E, datos: FormData) => Promise<E>,
  inicial: E,
  { limpiarAlTerminar = false } = {},
) {
  // (TypeScript no simplifica "Awaited<E>" en un tipo genérico; por eso los "as")
  const [estado, despachar, enviando] = useActionState<E, FormData>(
    accion as (antes: Awaited<E>, datos: FormData) => Promise<E>,
    inicial as Awaited<E>,
  );
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (limpiarAlTerminar && estado.ok) ref.current?.reset();
  }, [estado, limpiarAlTerminar]);

  const alEnviar = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    startTransition(() => despachar(datos));
  };

  return { estado, enviando, ref, alEnviar };
}

const claseEntrada =
  "h-12 w-full rounded-xl border border-line bg-paper px-3 text-base text-ink outline-none transition-colors focus:border-ink focus:ring-2 focus:ring-brand/15";

type PropsCampo = InputHTMLAttributes<HTMLInputElement> & { etiqueta: string; ayuda?: string };

export function Campo({ etiqueta, ayuda, id, ...resto }: PropsCampo) {
  const idAuto = useId();
  const idCampo = id ?? idAuto;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={idCampo} className="text-sm font-medium">
        {etiqueta}
      </label>
      <input id={idCampo} className={claseEntrada} {...resto} />
      {ayuda && <p className="text-xs text-ink-soft">{ayuda}</p>}
    </div>
  );
}

// Campo de contraseña con botón para mostrar u ocultar lo escrito
export function CampoContrasena({ etiqueta, ayuda, id, ...resto }: Omit<PropsCampo, "type">) {
  const idAuto = useId();
  const idCampo = id ?? idAuto;
  const [ver, setVer] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={idCampo} className="text-sm font-medium">
        {etiqueta}
      </label>
      <div className="relative">
        <input
          id={idCampo}
          type={ver ? "text" : "password"}
          className={`${claseEntrada} pr-12`}
          {...resto}
        />
        <button
          type="button"
          onClick={() => setVer((antes) => !antes)}
          aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={ver}
          className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-ink-soft hover:text-ink"
        >
          {ver ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
        </button>
      </div>
      {ayuda && <p className="text-xs text-ink-soft">{ayuda}</p>}
    </div>
  );
}

export function BotonEnviar({
  children,
  textoEnviando,
  enviando,
  className = "",
}: {
  children: ReactNode;
  textoEnviando: string;
  enviando?: boolean;
  className?: string;
}) {
  const { pending } = useFormStatus();
  const ocupado = enviando ?? pending;
  return (
    <button
      type="submit"
      disabled={ocupado}
      className={`flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-5 font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-70 ${className}`}
    >
      {ocupado && (
        <LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" aria-hidden />
      )}
      {ocupado ? textoEnviando : children}
    </button>
  );
}

// Aviso de resultado: rojo si hubo error, con chulito si salió bien
export function Mensaje({ estado }: { estado: Estado }) {
  if (estado.error) {
    return (
      <p role="alert" className="rounded-xl bg-brand-soft px-3 py-2 text-sm text-brand">
        {estado.error}
      </p>
    );
  }
  if (estado.ok) {
    return (
      <p role="status" className="flex items-start gap-2 rounded-xl bg-mist px-3 py-2 text-sm text-ink">
        <Check className="mt-0.5 size-4 shrink-0 text-ok" aria-hidden />
        {estado.ok}
      </p>
    );
  }
  return null;
}
