# Progreso del proyecto — CRM Three Lions SAS

> Si en otra sesión escribes "continúa", Claude lee este archivo y `docs/PLANO.md` y sigue desde aquí.

## Fase actual
**Fase 1: Autenticación y estructura de datos — casi terminada (26-nov-2026).**
Falta comprobar la página publicada en Vercel ya con las claves de Supabase.
Siguiente: **Fase 2: Clientes y documentos**. Espera el "sigue" del dueño.

## Hecho en la Fase 1
- [x] Conector de Supabase conectado a Claude: crea tablas, revisa la seguridad y lee los registros.
- [x] Migraciones en `supabase/migrations/` (ya aplicadas en Supabase):
  - `20261126170000_fase1_usuarios_tablas_permisos.sql`: perfiles con rol y 7 tablas
    (profiles, clients, interactions, products, orders, order_items, appointments), permisos RLS por rol,
    privilegios por columna, precio y total de pedidos calculados por la base de datos, función `cambiar_rol`.
  - `20261126173000_fase1_permisos_lectura.sql`: permisos de lectura explícitos (Supabase ya no los da solo).
- [x] 23 de 23 pruebas de permisos OK (se simulan admin, vendedores, pendiente y anónimo; la prueba se deshace sola).
- [x] Pantalla `/login` (correo y contraseña). El middleware protege todas las páginas; sin sesión manda a `/login`.
- [x] Cuentas "pendiente" ven "Tu cuenta aún no tiene acceso".
- [x] Menú con el usuario (iniciales, rol, enlace a Mi cuenta) y "Cerrar sesión". "Administración" solo la ve el admin.
- [x] `/usuarios` (solo admin): crear cuentas con contraseña temporal, cambiar el rol, dar una contraseña nueva.
- [x] `/cuenta`: cada persona cambia su nombre y su contraseña.
- [x] Usuario administrador del dueño creado (con `scripts/crear-admin.ps1`) y probado en el computador.
- [x] Registro abierto apagado en Supabase: solo el administrador crea cuentas.
- [x] Las 3 claves agregadas en Vercel (Settings → Environment Variables), para todos los entornos.

## Falta en la Fase 1
- [ ] Comprobar que la página publicada funciona con las claves de Vercel (entrar con el usuario administrador).

## Hecho en la Fase 0
- [x] Proyecto Next.js 15 (TypeScript + Tailwind + App Router) en `C:\Users\cardo\OneDrive\Documentos\Proyectos\crm-three-lions`.
- [x] Plano guardado en `docs/PLANO.md`.
- [x] Logo recortado en `public/brand/logo-three-lions.png`; íconos de pestaña y de celular con el león.
- [x] Código en GitHub (privado): https://github.com/cardonaventas33-blip/CRMthreelions
- [x] Publicado en Vercel: https://cr-mthreelions.vercel.app (cada envío a GitHub vuelve a publicar).
- [x] Claves de Supabase en `.env.local` (guardar: `scripts\guardar-claves.ps1`; comprobar: `npm run verificar:supabase`).
- [x] Menú lateral (Inicio · Comercial · Administración) y Agenda con calendario de lunes a sábado.
- [x] Carpeta `fotos-catalogo/` con 5 fotos de plumillas (no se sube a GitHub).

## Pendiente de tu parte
- Decir "sigue" para empezar la Fase 2 (cuando la página publicada funcione).
- Más adelante: fotos de llantas y baterías en sus carpetas de `fotos-catalogo/`.

## Decisiones tomadas
- **Cuentas (Fase 1, elegido por el dueño):** las crea el administrador desde "Usuarios"; no hay registro público.
  Si alguien olvida su contraseña, el administrador le pone una nueva. La recuperación por correo queda para la Fase 4 (Resend).
- **Roles:** `pendiente` (sin acceso), `vendedor`, `admin`, guardados en `profiles.role`. Un perfil nace "pendiente"
  y el servidor le pone el rol justo después (Supabase guarda `app_metadata` un instante después de crear el usuario).
- `cambiar_rol` es SECURITY DEFINER a propósito. El revisor de Supabase lo avisa; está revisado: comprueba que quien
  la usa es administrador y no deja que alguien se quite su propio rol de administrador.
- Carpeta del proyecto: `Documentos\Proyectos\crm-three-lions`. Repositorio: `CRMthreelions` (cuenta cardonaventas33-blip). Rama: `main`.
- Pantallas internas en `src/app/(app)/` (con menú); `/login` va fuera, sin menú.
- Nombres de las claves: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (pública por diseño) y
  `SUPABASE_SECRET_KEY` (solo servidor). Supabase usa las claves nuevas `sb_publishable_` y `sb_secret_`.
- **Colores:** fondo blanco, letras negras, rojo `#c8102e` de acento. El logo conserva azul marino y dorado.
  En el código: `bg-paper`, `text-ink`, `text-ink-soft`, `border-line`, `bg-mist`, `bg-brand`, `bg-brand-dark`, `bg-brand-soft`, `text-ok`.
- **Navegación:** menú lateral con íconos y grupos (como la referencia del dueño), sin carpetas.
- **Agenda:** lunes a sábado, sin domingos.
- **Fotos del catálogo:** en `fotos-catalogo/`, fuera de GitHub; en la Fase 3 se suben a Supabase Storage.
- **Hosting:** Vercel Hobby (gratis) mientras se construye; es solo para uso no comercial. Antes de la Fase 5,
  decidir entre Vercel Pro (unos 20 USD al mes) u otro servicio que permita uso comercial gratis.
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
- Supabase: proyecto `ucqieorrhxxysrckpsrn` (región us-west-2, Postgres 17). Las tablas nuevas NO reciben permisos
  automáticos: cada migración debe dar los GRANT necesarios.
- Probar permisos: bloque `do $$ ... $$` que crea usuarios de prueba, usa `set local role authenticated` con
  `request.jwt.claims`, y termina con `raise exception` para que todo se deshaga.
- Si faltan las claves en Vercel, el middleware responde 503 "Falta configurar las claves de Supabase".
- En Vercel, las claves se agregan con el botón "Agregar variable de entorno" (el buscador de arriba no guarda nada).
  Después de cambiarlas hay que volver a publicar.
- Subir a GitHub: la cuenta está guardada en este computador. Si vuelve a pedir inicio de sesión, usar
  `git credential-manager github login --device` en el panel Terminal.
- Pegar claves o contraseñas: lo que funciona con el dueño es una ventana de PowerShell aparte
  (`scripts\guardar-claves.ps1`, `scripts\crear-admin.ps1`). El portapapeles a veces queda bloqueado en Windows.
- Antes de `npm run build` hay que detener el servidor de desarrollo (ambos usan `.next`).
- En Windows, los scripts de Node que se conectan a internet terminan con `process.exitCode`, no con `process.exit()`.

## Limpieza pendiente (con tu permiso)
- Archivos de ejemplo de Next.js en `public/` (`next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg`).
- Variable vieja "Crmthreelions" en Vercel: no se usa.
