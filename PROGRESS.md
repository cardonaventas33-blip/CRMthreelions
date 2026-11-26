# Progreso del proyecto — CRM Three Lions SAS

> Si en otra sesión escribes "continúa", Claude lee este archivo y `docs/PLANO.md` y sigue desde aquí.

## Fase actual
**Fase 0: Preparación — TERMINADA (26-nov-2026).**
Siguiente: **Fase 1: Autenticación y estructura de datos**. Espera el "sigue" del dueño.

## Hecho en la Fase 0
- [x] Revisado lo instalado: Node.js v24, npm 11, Git 2.53.
- [x] Proyecto Next.js 15 (TypeScript + Tailwind + App Router) en `C:\Users\cardo\OneDrive\Documentos\Proyectos\crm-three-lions`.
- [x] Plano guardado en `docs/PLANO.md`.
- [x] Logo: original en `public/logo-three-lions.jpg`, recortado en círculo en `public/brand/logo-three-lions.png`. Íconos de pestaña y de celular con el león.
- [x] Colores de la marca en `src/app/globals.css` (ver Decisiones).
- [x] Código en GitHub (repositorio privado): https://github.com/cardonaventas33-blip/CRMthreelions
- [x] Publicado en Vercel: https://cr-mthreelions.vercel.app (cada vez que se sube algo a GitHub, Vercel actualiza la página solo).
- [x] Proyecto de Supabase conectado: las 3 claves están en `.env.local` y funcionan (comprobado el 26-nov-2026).
  - Guardar o cambiar claves: `powershell -NoProfile -ExecutionPolicy Bypass -File scripts\guardar-claves.ps1` (solo pide las que faltan; la secreta no se ve al pegarla).
  - Comprobarlas sin mostrarlas: `npm run verificar:supabase`.
- [x] **Menú lateral** (adelantado a pedido del dueño): en el computador queda fijo a la izquierda; en el celular se abre con el botón ☰.
  Opciones: Inicio · Comercial (Clientes, Agenda, Pedidos, Catálogo) · Administración (Usuarios, Configuración).
  Las opciones que aún no existen muestran una página "Próximamente · Fase N" (`src/app/(app)/[seccion]/page.tsx`).
- [x] **Agenda con calendario de lunes a sábado, sin domingos** (adelantado a pedido del dueño): mes visible, flechas, botón "Hoy",
  y al tocar un día se ve su espacio de citas (las citas llegan en la Fase 4). Código: `src/components/calendario.tsx`.
- [x] Carpeta `fotos-catalogo/` (plumillas, llantas, baterias) con instrucciones en `LEEME.txt`. No se sube a GitHub.
- [x] Las 5 fotos de plumillas copiadas a `fotos-catalogo/plumillas/` con su nombre.

## Lo que viene en la Fase 1 (según el plano)
- Tablas en Supabase: perfiles de usuario (con rol admin o vendedor), clientes, productos, pedidos, detalle de pedidos, interacciones y citas.
- Permisos RLS: solo usuarios con sesión pueden ver datos; el administrador puede más cosas que el vendedor.
- Pantalla de inicio de sesión (correo y contraseña) fuera del menú, y el tablero vacío protegido.
- Poner las 3 claves también en Vercel (Settings → Environment Variables) para que la página publicada pueda usar Supabase. Las pega el dueño, con guía paso a paso.

## Pendiente de tu parte
- Decir "sigue" para empezar la Fase 1.
- Más adelante: fotos de llantas y baterías en sus carpetas de `fotos-catalogo/`.

## Decisiones tomadas
- Carpeta del proyecto: `Documentos\Proyectos\crm-three-lions`. Repositorio en GitHub: `CRMthreelions` (cuenta cardonaventas33-blip). Rama principal: `main`.
- Next.js 15, código en `src/`. Las pantallas internas del CRM van en `src/app/(app)/` y llevan el menú; la pantalla de inicio de sesión (Fase 1) irá fuera de esa carpeta, sin menú.
- Secretos: `.env.local` y cualquier `.env*` quedan fuera de Git.
- Nombres de las claves (distintos al plano porque Next.js lo exige):
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (pública por diseño, protegida por los permisos RLS) y
  `SUPABASE_SECRET_KEY` (solo en el servidor, nunca en el navegador).
- Supabase usa las claves nuevas (`sb_publishable_...` y `sb_secret_...`), no las antiguas `anon` / `service_role`.
- **Colores (24-nov-2026, elegido por el dueño):** fondo blanco, letras negras y rojo como color de acento. Reemplaza la paleta de la sección 7 del plano. El logo conserva sus colores (azul marino y dorado).
  - Fondo `#ffffff` · Letras `#111111` · Texto secundario `#57534e` · Bordes `#e7e5e4` · Gris al pasar el mouse `#f5f5f4`
  - Rojo `#c8102e` · Rojo oscuro `#9b0c22` · Rojo muy claro `#fdeef0`
  - En el código: `bg-paper`, `text-ink`, `text-ink-soft`, `border-line`, `bg-mist`, `bg-brand`, `bg-brand-dark`, `bg-brand-soft`.
- **Navegación (26-nov-2026, elegido por el dueño):** menú lateral con íconos y grupos, como la captura de otro CRM comercial que mandó de referencia, **sin las carpetas rojas** de antes. La opción activa va en rojo suave. Íconos: librería `lucide-react`.
- **Agenda (26-nov-2026, elegido por el dueño):** la semana va de lunes a sábado; los domingos no se muestran. Si hoy es domingo, el calendario elige el lunes siguiente.
- El CRM siempre se ve con fondo blanco, aunque el celular esté en modo oscuro.
- Letras: Inter para todo; Cinzel (parecida a la del logo) solo para "THREE LIONS".
- **Fotos del catálogo (26-nov-2026):** se guardan en `fotos-catalogo/` y NO se suben a GitHub (pesan mucho; quedan en OneDrive). En la Fase 3 se cargan a Supabase Storage. Se sigue el orden del plano (catálogo en la Fase 3, después de clientes).
- **Hosting:** Vercel Hobby (gratis) mientras se construye. Su plan gratis es solo para uso no comercial: antes de la Fase 5 hay que decidir entre Vercel Pro (unos 20 USD al mes) u otro servicio que permita uso comercial gratis.
- **Publicar:** antes de subir cambios a GitHub (y por lo tanto a la página pública), Claude pregunta al dueño.

## Notas para la Fase 3 (catálogo)
Productos que el dueño mostró (marca IMCOV). Cada línea viene en varias medidas:

| Línea | Medidas | Foto |
|---|---|---|
| Plumilla Multiacople Trasera | 10" a 16" | `plumilla-multiacople-trasera.jpg` |
| Plumilla Multiacople Delantera | 14" a 26" | `plumilla-multiacople-delantera.jpg` |
| Plumilla Metálica | 14" a 26" | `plumilla-metalica.jpg` |
| Plumilla Aerodinámica (De Lujo) | 14" a 26" | `plumilla-aerodinamica-de-lujo.jpg` |
| Plumilla Siliconada | 14" a 26" | `plumilla-siliconada.jpg` |

Decidir en la Fase 3 si cada medida es un producto (SKU) distinto o una opción del mismo producto.

## Notas técnicas
- Subir a GitHub: la cuenta ya está guardada en este computador (Git Credential Manager). Si vuelve a pedir inicio de sesión, lo que funcionó fue `git credential-manager github login --device` en el panel Terminal (muestra un código para escribir en github.com/login/device). El inicio de sesión por navegador se quedó trabado.
- Pegar claves: al dueño se le dificultó el Bloc de notas y el panel Terminal; lo que funcionó fue abrir `scripts\guardar-claves.ps1` en una ventana de PowerShell aparte.
- Antes de compilar (`npm run build`) hay que detener el servidor de desarrollo, porque ambos usan la carpeta `.next`.
- En Windows, los scripts de Node que se conectan a internet deben terminar con `process.exitCode`, no con `process.exit()` (evita un error "Assertion failed" de Node).

## Limpieza pendiente (con tu permiso)
- Los archivos de ejemplo de Next.js en `public/` (`next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg`) ya no se usan. Se pueden borrar cuando digas.
