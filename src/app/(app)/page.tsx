import { CalendarDays, ClipboardList, Users } from "lucide-react";
import { obtenerUsuarioActual } from "@/lib/sesion";

// Lo que mostrará el tablero cuando cada parte esté construida
const resumen = [
  {
    titulo: "Próximas citas",
    icono: CalendarDays,
    texto: "Tus citas de los próximos días, para abrir la ficha del cliente con un toque.",
    fase: 4,
  },
  {
    titulo: "Últimos clientes",
    icono: Users,
    texto: "Los 5 clientes creados más recientemente.",
    fase: 2,
  },
  {
    titulo: "Pedidos recientes",
    icono: ClipboardList,
    texto: "Los últimos pedidos y en qué estado van.",
    fase: 3,
  },
];

export default async function Inicio() {
  const usuario = await obtenerUsuarioActual();
  const primerNombre = usuario?.nombre.trim().split(/\s+/)[0];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <p className="inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-sm font-medium text-brand">
        <span className="size-2 rounded-full bg-brand" aria-hidden="true" />
        En construcción
      </p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        {primerNombre ? `Hola, ${primerNombre}` : "Inicio"}
      </h1>
      <p className="mt-3 max-w-xl text-base text-ink-soft sm:text-lg">
        Este será tu tablero: de un vistazo verás tus citas, tus clientes y tus
        pedidos. Las opciones del menú se irán activando fase por fase.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {resumen.map(({ titulo, icono: Icono, texto, fase }) => (
          <section
            key={titulo}
            className="flex flex-col rounded-xl border border-line p-5"
          >
            <div className="flex items-center gap-2">
              <Icono className="size-5 text-brand" aria-hidden />
              <h2 className="font-semibold">{titulo}</h2>
            </div>
            <p className="mt-2 text-sm text-ink-soft">{texto}</p>
            <p className="mt-auto pt-4 text-xs font-medium tracking-wider text-ink-soft uppercase">
              Llega en la Fase {fase}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
