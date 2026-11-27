// Modo claro / oscuro del CRM. Se guarda en cada aparato (navegador), no en la cuenta.

export type Tema = "claro" | "oscuro" | "sistema";

// Color de la barra del navegador en el celular para cada modo
export const COLOR_BARRA = { claro: "#ffffff", oscuro: "#121110" } as const;

export function leerTema(): Tema {
  try {
    const guardado = localStorage.getItem("tema");
    return guardado === "oscuro" || guardado === "sistema" ? guardado : "claro";
  } catch {
    return "claro";
  }
}

export function aplicarTema(tema: Tema) {
  const oscuro = tema === "oscuro" || (tema === "sistema" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", oscuro);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", oscuro ? COLOR_BARRA.oscuro : COLOR_BARRA.claro);
}

// Se ejecuta antes de pintar la página para que no se vea un destello blanco en modo oscuro.
// Es la misma lógica de aplicarTema, escrita como texto porque va dentro de una etiqueta <script>.
// También crea la etiqueta del color de la barra del navegador (la maneja solo este código, no Next.js).
export const SCRIPT_TEMA = `(function(){var o=false;try{var t=localStorage.getItem("tema");o=t==="oscuro"||(t==="sistema"&&window.matchMedia("(prefers-color-scheme: dark)").matches);}catch(e){}if(o){document.documentElement.classList.add("dark");}var m=document.createElement("meta");m.name="theme-color";m.content=o?"${COLOR_BARRA.oscuro}":"${COLOR_BARRA.claro}";document.head.appendChild(m);})();`;
