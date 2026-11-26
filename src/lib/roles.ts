// Roles del CRM (deben coincidir con el tipo rol_usuario de la base de datos)
export type Rol = "pendiente" | "vendedor" | "admin";

export const NOMBRE_ROL: Record<Rol, string> = {
  admin: "Administrador",
  vendedor: "Vendedor",
  pendiente: "Sin acceso",
};

// Lo que el menú necesita saber de quien está usando el CRM
export type UsuarioVisible = { nombre: string; correo: string; rol: Rol };

// Iniciales para el círculo del usuario: "Ana Gómez" → "AG"
export function iniciales({ nombre, correo }: { nombre: string; correo: string }) {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length >= 2) return (partes[0][0] + partes[1][0]).toUpperCase();
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (correo[0] ?? "?").toUpperCase();
}
