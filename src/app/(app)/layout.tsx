import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SinAcceso } from "@/components/sin-acceso";
import { obtenerUsuarioActual } from "@/lib/sesion";

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

  return (
    <AppShell usuario={{ nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol }}>
      {children}
    </AppShell>
  );
}
