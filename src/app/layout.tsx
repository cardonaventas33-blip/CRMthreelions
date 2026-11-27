import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import { SCRIPT_TEMA } from "@/lib/tema";
import "./globals.css";

// Letra principal del CRM: clara y fácil de leer en el celular
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Letra clásica parecida a la del logo, solo para el nombre de la marca
const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CRM Three Lions",
    template: "%s · CRM Three Lions",
  },
  description: "Clientes, agenda, catálogo y pedidos de Three Lions SAS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: el modo oscuro agrega la clase "dark" antes de que cargue React
    <html lang="es" className={`${inter.variable} ${cinzel.variable}`} suppressHydrationWarning>
      <head>
        {/* Aplica el modo claro u oscuro guardado antes de pintar (sin destello blanco) */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="bg-paper font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
