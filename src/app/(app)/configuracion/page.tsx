import type { Metadata } from "next";
import Link from "next/link";
import { CalendarPlus, Mail, MessageCircle, Package, Settings, UserCog, type LucideIcon } from "lucide-react";
import { obtenerUsuarioActual } from "@/lib/sesion";

export const metadata: Metadata = { title: "Configuración" };

function Estado({ activo, texto }: { activo: boolean; texto: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${activo ? "bg-ok-soft text-ok" : "bg-mist text-ink-soft"}`}
    >
      {texto}
    </span>
  );
}

function Conexion({
  icono: Icono,
  titulo,
  children,
  despues,
}: {
  icono: LucideIcon;
  titulo: string;
  children: React.ReactNode;
  despues: string;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-line p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
          <Icono className="size-6" aria-hidden />
        </span>
        <h2 className="min-w-0 flex-1 font-semibold">{titulo}</h2>
        <Estado activo texto="Activo" />
      </div>
      <p className="text-sm">{children}</p>
      <p className="flex flex-wrap items-center gap-2 border-t border-line pt-3 text-xs text-ink-soft">
        <Estado activo={false} texto="Para después" />
        {despues}
      </p>
    </section>
  );
}

export default async function Configuracion() {
  const yo = await obtenerUsuarioActual();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
        <Settings className="size-8 shrink-0 text-brand" aria-hidden />
        Configuración
      </h1>
      {yo?.rol !== "admin" ? (
        <p className="mt-4 text-ink-soft">Solo un administrador puede ver esta página.</p>
      ) : (
        <>
          <p className="mt-2 max-w-2xl text-base text-ink-soft">
            Cómo se comunica el CRM con tus clientes y tus herramientas. Todo funciona sin costo y sin cuentas nuevas.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Conexion
              icono={MessageCircle}
              titulo="WhatsApp"
              despues="Envío automático desde el CRM (WhatsApp Business API de Meta): necesita verificar la empresa y Meta cobra por conversación."
            >
              Los botones &quot;WhatsApp&quot; abren WhatsApp (en el celular o en WhatsApp Web) con el mensaje ya escrito: el
              pedido completo o la confirmación de una cita. A los celulares de 10 dígitos se les pone el +57 de Colombia.
            </Conexion>
            <Conexion
              icono={Mail}
              titulo="Correo"
              despues="Envío automático con Resend desde un correo de la empresa: necesita un dominio propio (ej.: threelions.com.co)."
            >
              El botón &quot;Correo&quot; de cada pedido abre el correo de quien lo toca (Gmail, Outlook…) con el pedido escrito. El
              correo sale desde su propia cuenta.
            </Conexion>
            <Conexion
              icono={CalendarPlus}
              titulo="Google Calendar"
              despues="Sincronización automática: necesita un proyecto en Google Cloud y la aprobación de Google."
            >
              Cada cita de la agenda tiene el botón &quot;Google Calendar&quot;: abre el calendario con la cita ya llena (hora,
              cliente, dirección y notas) y solo se toca Guardar.
            </Conexion>

            <section className="flex flex-col gap-3 rounded-xl border border-line p-5">
              <h2 className="font-semibold">Equipo y catálogo</h2>
              <Link href="/usuarios" className="flex min-h-12 items-center gap-3 rounded-xl border border-line px-3 hover:bg-mist">
                <UserCog className="size-5 shrink-0 text-brand" aria-hidden />
                <span>
                  <span className="block text-sm font-semibold">Usuarios</span>
                  <span className="block text-xs text-ink-soft">Crear cuentas, cambiar roles y contraseñas</span>
                </span>
              </Link>
              <Link href="/catalogo" className="flex min-h-12 items-center gap-3 rounded-xl border border-line px-3 hover:bg-mist">
                <Package className="size-5 shrink-0 text-brand" aria-hidden />
                <span>
                  <span className="block text-sm font-semibold">Catálogo</span>
                  <span className="block text-xs text-ink-soft">Productos, precios, stock y fotos</span>
                </span>
              </Link>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
