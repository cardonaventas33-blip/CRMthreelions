# Progreso del proyecto — CRM Three Lions SAS

> Si en otra sesión escribes "continúa", Claude lee este archivo y `docs/PLANO.md` y sigue desde aquí.

## Fase actual
**Fase 0: Preparación** — en curso. Falta la parte que necesita las cuentas.

## Hecho
- [x] Revisado lo instalado: Node.js v24, npm 11, Git 2.53 (todo listo).
- [x] Proyecto Next.js 15 creado (TypeScript + Tailwind + App Router) en `C:\Users\cardo\OneDrive\Documentos\Proyectos\crm-three-lions`.
- [x] Plano guardado en `docs/PLANO.md`.
- [x] Logo original guardado en `public/logo-three-lions.jpg` y recortado en círculo en `public/brand/logo-three-lions.png`.
- [x] Ícono de la pestaña (`src/app/favicon.ico`) y del celular (`src/app/apple-icon.png`) con el león.
- [x] Colores de la marca aplicados (ver Decisiones) en `src/app/globals.css`.
- [x] Página inicial temporal con el logo y las 4 carpetas rojas (Clientes, Agenda, Catálogo, Pedidos), marcadas "Próximamente".
- [x] Probado: funciona en computador y en celular, compila sin errores (`npm run build`) y el revisor de código no marca problemas (`npm run lint`).
- [x] Avance guardado con Git.

## Falta en la Fase 0
- [ ] Crear el repositorio privado en GitHub y subir el código (necesita tu cuenta de GitHub).
- [ ] Conectar Vercel y hacer el primer despliegue (necesita tu cuenta de Vercel).
- [ ] Crear el proyecto en Supabase y poner las claves en `.env.local` (necesita tu cuenta de Supabase).

## Pendiente de tu parte
- Crear cuentas en GitHub, Vercel y Supabase (pasos exactos en el chat).

## Decisiones tomadas
- Carpeta del proyecto: `Documentos\Proyectos\crm-three-lions` (tu carpeta habitual de proyectos).
- Next.js versión 15, código dentro de `src/`.
- `.env.local` y cualquier `.env*` quedan fuera de Git (ya está en `.gitignore`).
- **Colores (24-nov-2026, elegido por el dueño):** fondo blanco, letras negras y carpetas rojas. Esto **reemplaza la paleta de la sección 7 del plano** (azul y verde). El logo conserva sus colores originales (azul marino y dorado).
  - Fondo `#ffffff` · Letras `#111111` · Texto secundario `#57534e` · Bordes `#e7e5e4`
  - Rojo `#c8102e` · Rojo oscuro `#9b0c22` · Rojo muy claro `#fdeef0`
  - En el código se usan así: `bg-paper`, `text-ink`, `text-ink-soft`, `border-line`, `bg-brand`, `bg-brand-dark`, `bg-brand-soft`.
- El CRM siempre se ve con fondo blanco, aunque el celular esté en modo oscuro.
- Las "carpetas rojas" son el ícono de carpeta roja de cada sección del CRM (Clientes, Agenda, Catálogo, Pedidos). Confirmado por el dueño el 24-nov-2026.
- Letras: Inter para todo el CRM; Cinzel (parecida a la del logo) solo para el nombre "THREE LIONS".

## Limpieza pendiente (con tu permiso)
- Los archivos de ejemplo de Next.js en `public/` (`next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg`) ya no se usan. Se pueden borrar cuando digas.
