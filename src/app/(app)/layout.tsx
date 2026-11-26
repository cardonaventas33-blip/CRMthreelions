import { AppShell } from "@/components/app-shell";

// Todas las pantallas internas del CRM llevan el menú lateral.
// (La pantalla de inicio de sesión de la Fase 1 irá fuera de esta carpeta, sin menú.)
export default function LayoutApp({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}
