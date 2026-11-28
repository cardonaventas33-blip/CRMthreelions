import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SinAcceso } from "@/components/sin-acceso";
import { hoyColombia } from "@/lib/agenda/fechas";
import { obtenerUsuarioActual } from "@/lib/sesion";
import { contarTareasParaHoy } from "@/lib/tareas/datos";

// Todas las pantallas internas del CRM llevan el menú lateral y exigen sesión.
// (La pantalla de entrada, /login, está fuera de esta carpeta y no tiene menú.)
export default async function LayoutApp({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/login");
  if (usuario.rol === "pendiente") return <SinAcceso correo={usuario.correo} />;

  // Numerito rojo junto a "Tareas": las tareas de esta persona para hoy o vencidas
  const tareas = await contarTareasParaHoy(usuario.id, hoyColombia());

  return (
    <AppShell usuario={{ nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol }} avisos={{ tareas }}>
      {children}
    </AppShell>
  );
}
