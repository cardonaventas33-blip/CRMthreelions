import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Package,
  Settings,
  ShieldCheck,
  Store,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

// Una sección del menú (por ejemplo "Clientes" en /clientes)
export type Seccion = {
  slug: string; // la parte de la dirección: /clientes, /agenda...
  nombre: string;
  icono: LucideIcon;
  fase: number; // fase del plano en la que se construye
  descripcion: string;
  soloAdmin?: boolean;
  paginaPropia?: boolean; // ya tiene su propia página (no usa la de "Próximamente")
};

export type GrupoMenu = {
  titulo: string;
  icono: LucideIcon;
  secciones: Seccion[];
};

export const inicio = { nombre: "Inicio", href: "/", icono: LayoutDashboard };

// El menú lateral completo, agrupado como en la referencia del dueño
export const grupos: GrupoMenu[] = [
  {
    titulo: "Comercial",
    icono: Store,
    secciones: [
      {
        slug: "clientes",
        nombre: "Clientes",
        icono: Users,
        fase: 2,
        descripcion:
          "Crea y busca clientes por nombre o NIT, con su foto, RUT y Cámara de Comercio. En la ficha de cada cliente verás sus llamadas, reuniones y pedidos.",
        paginaPropia: true,
      },
      {
        slug: "agenda",
        nombre: "Agenda",
        icono: CalendarDays,
        fase: 4,
        descripcion:
          "Tus citas de la semana: crea, mueve o cancela citas con cada cliente. Si quieres, también aparecen en Google Calendar.",
        paginaPropia: true,
      },
      {
        slug: "pedidos",
        nombre: "Pedidos",
        icono: ClipboardList,
        fase: 3,
        descripcion:
          "Arma pedidos con productos del catálogo; el total se calcula solo. Cada pedido pasa de borrador a enviado y completado, y lo puedes mandar por WhatsApp o correo.",
        paginaPropia: true,
      },
      {
        slug: "catalogo",
        nombre: "Catálogo",
        icono: Package,
        fase: 3,
        descripcion:
          "Tus plumillas, llantas y baterías con foto, código (SKU), precio y stock.",
        paginaPropia: true,
      },
    ],
  },
  {
    titulo: "Administración",
    icono: ShieldCheck,
    secciones: [
      {
        slug: "usuarios",
        nombre: "Usuarios",
        icono: UserCog,
        fase: 1,
        descripcion:
          "Quién entra al CRM y con qué permisos: vendedor o administrador.",
        soloAdmin: true,
        paginaPropia: true,
      },
      {
        slug: "configuracion",
        nombre: "Configuración",
        icono: Settings,
        fase: 4,
        descripcion:
          "Conexiones con WhatsApp, el correo (Resend) y Google Calendar.",
        soloAdmin: true,
      },
    ],
  },
];

export const todasLasSecciones = grupos.flatMap((grupo) => grupo.secciones);

export function buscarSeccion(slug: string) {
  return todasLasSecciones.find((seccion) => seccion.slug === slug);
}
