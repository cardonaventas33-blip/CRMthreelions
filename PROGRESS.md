# Progreso del proyecto — CRM Three Lions SAS

> Si en otra sesión escribes "continúa", Claude lee este archivo y `docs/PLANO.md` y sigue desde aquí.

## Fase actual
**Fase 0: Preparación** — casi lista. Solo falta pegar y comprobar las claves de Supabase.
Además se adelantaron arreglos de diseño pedidos por el dueño (menú lateral y calendario de la Agenda).

## Hecho
- [x] Revisado lo instalado: Node.js v24, npm 11, Git 2.53.
- [x] Proyecto Next.js 15 (TypeScript + Tailwind + App Router) en `C:\Users\cardo\OneDrive\Documentos\Proyectos\crm-three-lions`.
- [x] Plano guardado en `docs/PLANO.md`.
- [x] Logo: original en `public/logo-three-lions.jpg`, recortado en círculo en `public/brand/logo-three-lions.png`. Íconos de pestaña y de celular con el león.
- [x] Colores de la marca en `src/app/globals.css` (ver Decisiones).
- [x] Código en GitHub (repositorio privado): https://github.com/cardonaventas33-blip/CRMthreelions
- [x] Publicado en Vercel: https://cr-mthreelions.vercel.app (cada vez que se sube algo a GitHub, Vercel actualiza la página solo).
- [x] Archivo `.env.local` con los nombres de las 3 claves (vacías por ahora; protegido por `.gitignore`).
- [x] Prueba de claves sin mostrarlas: `npm run verificar:supabase`.
- [x] **Menú lateral** (26-nov-2026): en el computador queda fijo a la izquierda; en el celular se abre con el botón ☰.
  Opciones: Inicio · Comercial (Clientes, Agenda, Pedidos, Catálogo) · Administración (Usuarios, Configuración).
  Las opciones que aún no existen muestran una página "Próximamente · Fase N" (`src/app/(app)/[seccion]/page.tsx`).
- [x] **Agenda con calendario de lunes a sábado, sin domingos** (26-nov-2026): mes visible, flechas, botón "Hoy",
  y al tocar un día se ve su espacio de citas (las citas llegan en la Fase 4). Código: `src/components/calendario.tsx`.
- [x] Carpeta `fotos-catalogo/` (plumillas, llantas, baterias) con instrucciones en `LEEME.txt`. No se sube a GitHub.

## Falta en la Fase 0
- [ ] Pegar las 3 claves de Supabase en `.env.local` (las pega el dueño) y comprobarlas con `npm run verificar:supabase`.

## Pendiente de tu parte
- Pegar las claves de Supabase en `.env.local` y guardar con Ctrl + S.
- Copiar las fotos originales de los productos a `fotos-catalogo/` (en el chat mostraste 5 de plumillas, pero hacen falta los archivos).

## Decisiones tomadas
- Carpeta del proyecto: `Documentos\Proyectos\crm-three-lions`. Repositorio en GitHub: `CRMthreelions` (cuenta cardonaventas33-blip). Rama principal: `main`.
- Next.js 15, código en `src/`. Las pantallas internas del CRM van en `src/app/(app)/` y llevan el menú; la pantalla de inicio de sesión (Fase 1) irá fuera de esa carpeta, sin menú.
- Secretos: `.env.local` y cualquier `.env*` quedan fuera de Git.
- Nombres de las claves (distintos al plano porque Next.js lo exige):
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (pública por diseño, protegida por los permisos RLS) y
  `SUPABASE_SECRET_KEY` (solo en el servidor, nunca en el navegador).
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

## Notas para la Fase 3 (catálogo)
Productos que el dueño mostró (marca IMCOV). Cada línea viene en varias medidas:

| Línea | Medidas |
|---|---|
| Plumilla Multiacople Trasera | 10" a 16" |
| Plumilla Multiacople Delantera | 14" a 26" |
| Plumilla Metálica | 14" a 26" |
| Plumilla Aerodinámica (De Lujo) | 14" a 26" |
| Plumilla Siliconada | 14" a 26" |

Decidir en la Fase 3 si cada medida es un producto (SKU) distinto o una opción del mismo producto.

## Notas técnicas
- Subir a GitHub: la cuenta ya está guardada en este computador (Git Credential Manager). Si vuelve a pedir inicio de sesión, lo que funcionó fue `git credential-manager github login --device` en el panel Terminal (muestra un código para escribir en github.com/login/device). El inicio de sesión por navegador se quedó trabado.
- Antes de compilar (`npm run build`) hay que detener el servidor de desarrollo, porque ambos usan la carpeta `.next`.

## Limpieza pendiente (con tu permiso)
- Los archivos de ejemplo de Next.js en `public/` (`next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg`) ya no se usan. Se pueden borrar cuando digas.
