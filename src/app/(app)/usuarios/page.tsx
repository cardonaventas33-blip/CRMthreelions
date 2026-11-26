import type { Metadata } from "next";
import { UserPlus, UsersRound } from "lucide-react";
import type { Rol } from "@/lib/roles";
import { obtenerUsuarioActual } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FilaUsuario, FormularioNuevoUsuario } from "./componentes";

export const metadata: Metadata = { title: "Usuarios" };

type Perfil = { id: string; email: string; name: string; role: Rol };

export default async function Usuarios() {
  const yo = await obtenerUsuarioActual();

  if (yo?.rol !== "admin") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
        <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
        <p className="mt-3 text-ink-soft">Esta sección es solo para administradores.</p>
      </div>
    );
  }

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, name, role")
    .order("created_at", { ascending: true });
  const perfiles = (data ?? []) as Perfil[];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
        <UsersRound className="size-8 shrink-0 text-brand" aria-hidden />
        Usuarios
      </h1>
      <p className="mt-3 max-w-xl text-base text-ink-soft sm:text-lg">
        Crea las cuentas de tu equipo y decide qué puede hacer cada persona.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <section aria-labelledby="titulo-equipo" className="rounded-xl border border-line">
          <h2 id="titulo-equipo" className="border-b border-line px-4 py-3 font-semibold sm:px-5">
            Equipo ({perfiles.length})
          </h2>
          {error ? (
            <p className="p-5 text-sm text-brand">No se pudo cargar la lista de usuarios.</p>
          ) : (
            <ul className="divide-y divide-line">
              {perfiles.map((p) => (
                <FilaUsuario
                  key={p.id}
                  id={p.id}
                  nombre={p.name}
                  correo={p.email}
                  rol={p.role}
                  esYo={p.id === yo.id}
                />
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="titulo-nuevo" className="rounded-xl border border-line p-4 sm:p-5">
          <h2 id="titulo-nuevo" className="flex items-center gap-2 font-semibold">
            <UserPlus className="size-5 text-brand" aria-hidden />
            Crear usuario
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            La persona entra con su correo y la contraseña temporal que le des. Después puede
            cambiarla en &quot;Mi cuenta&quot;.
          </p>
          <FormularioNuevoUsuario />
        </section>
      </div>
    </div>
  );
}
