import Image from "next/image";

// Las carpetas (secciones) que tendrá el CRM. Se irán activando fase por fase.
const carpetas = [
  { nombre: "Clientes", detalle: "Datos, fotos, RUT y Cámara de Comercio" },
  { nombre: "Agenda", detalle: "Citas y seguimiento de cada cliente" },
  { nombre: "Catálogo", detalle: "Plumillas, llantas y baterías" },
  { nombre: "Pedidos", detalle: "De borrador a enviado y completado" },
];

// Dibujo de una carpeta roja: pestaña en rojo oscuro atrás y el frente en rojo.
function CarpetaRoja() {
  return (
    <svg viewBox="0 0 48 40" className="h-10 w-12" aria-hidden="true">
      <path
        className="fill-brand-dark"
        d="M4 2h13.2a3 3 0 0 1 2.4 1.2L22 6.5h22a4 4 0 0 1 4 4V36a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z"
      />
      <path
        className="fill-brand"
        d="M0 15a4 4 0 0 1 4-4h40a4 4 0 0 1 4 4v21a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4z"
      />
    </svg>
  );
}

export default function Inicio() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <Image
            src="/brand/logo-three-lions.png"
            alt=""
            width={44}
            height={44}
            priority
            className="rounded-full"
          />
          <p className="font-display text-lg font-semibold tracking-[0.12em]">
            THREE LIONS <span className="text-sm text-ink-soft">SAS</span>
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 sm:py-16">
        <p className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-sm font-medium text-brand">
          <span className="size-2 rounded-full bg-brand" aria-hidden="true" />
          En construcción
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          CRM Three Lions
        </h1>
        <p className="mt-3 max-w-xl text-base text-ink-soft sm:text-lg">
          Aquí tu equipo de ventas va a manejar clientes, citas, catálogo y
          pedidos. Estas son las carpetas que vamos a construir:
        </p>

        <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {carpetas.map((carpeta) => (
            <li
              key={carpeta.nombre}
              className="flex flex-col gap-3 rounded-xl border border-line p-4 sm:p-5"
            >
              <CarpetaRoja />
              <div>
                <h2 className="text-base font-semibold sm:text-lg">
                  {carpeta.nombre}
                </h2>
                <p className="mt-1 text-sm text-ink-soft">{carpeta.detalle}</p>
              </div>
              <p className="mt-auto text-xs font-medium tracking-wider text-ink-soft uppercase">
                Próximamente
              </p>
            </li>
          ))}
        </ul>
      </main>

      <footer className="border-t border-line">
        <p className="mx-auto max-w-5xl px-4 py-4 text-sm text-ink-soft sm:px-6">
          Three Lions SAS · Shaping the future
        </p>
      </footer>
    </div>
  );
}
