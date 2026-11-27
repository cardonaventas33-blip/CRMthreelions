# Progreso del proyecto — CRM Three Lions SAS

> Si en otra sesión escribes "continúa", Claude lee este archivo y `docs/PLANO.md` y sigue desde aquí.

## Fase actual
**Fase 3: Catálogo y pedidos — HECHA en el computador (26-nov-2026), falta publicarla.**
Probada de punta a punta con productos y un pedido de prueba (creados y borrados con los botones de la app; la base
quedó vacía y la numeración de pedidos empieza en #1). Falta: (1) permiso del dueño para publicar y (2) decidir cómo
cargar el catálogo real (ver "Catálogo de IMCOVALLE" abajo). Después: "sigue" para la Fase 4.

## Hecho en la Fase 3
- [x] Migración `20261127030000_fase3_catalogo_pedidos.sql` (aplicada): productos con línea, medida y marca;
  reglas de estados en la base (borrador → enviado → completado; enviado puede volver a borrador; no se envía vacío;
  un pedido completado ya no cambia); al completar se descuenta el stock (si no alcanza, avisa "Stock insuficiente…"
  y no completa); almacén público `productos` (JPG/PNG/WEBP hasta 5 MB; solo el admin sube). 9 de 9 pruebas OK.
- [x] `/catalogo`: cuadrícula con foto, precio (IVA incluido) y stock; buscador por nombre, código o línea y filtro
  por categoría; páginas de 60 productos (aguanta miles). En celular, 2 columnas.
- [x] `/catalogo/nuevo` y `/catalogo/[id]/editar` (solo admin): cada medida es un producto con su SKU, precio y stock;
  si no se escribe nombre se arma con línea + medida; foto con "Usar en toda la línea"; "Borrar producto"
  (solo si nunca se usó en un pedido; si ya se usó, se desmarca "Activo" para ocultarlo).
- [x] `/pedidos`: lista con filtros (estado y "Solo los míos"); tabla en computador, tarjetas en celular.
- [x] `/pedidos/nuevo`: buscar el cliente y crear el pedido (también con "Crear pedido" en la ficha del cliente).
- [x] `/pedidos/[id]`: buscador de productos (en el servidor, máx. 30), cantidades con − / + o escribiéndolas,
  aviso si se pide más que el stock, quitar producto, total con IVA, notas, Enviar / Volver a borrador /
  Marcar como completado (pide confirmación) y Borrar borrador. Solo quien lo creó o un admin lo cambia.
- [x] Ficha del cliente: pestaña "Pedidos (N)" con sus pedidos, total completado y botón "Crear pedido".
- [x] Tablero: "Pedidos recientes"; las ventas del mes ya se llenan con pedidos enviados y completados.
- [x] Probado en computador y celular: crear producto, crear pedido, agregar (y sumar si se repite), cambiar
  cantidad, aviso de stock, notas, enviar, intento de completar sin stock (bloqueado), volver a borrador, borrar
  pedido, borrar producto (bloqueado mientras estaba en un pedido). El tablero mostró la venta mientras estuvo enviado.
- [x] Arreglo: en la ficha del cliente ya no sale una barrita de desplazamiento junto a las pestañas.

## Pendiente de la Fase 3
- [ ] Publicar en Vercel (con permiso del dueño).
- [ ] Cargar el catálogo real (ver abajo).
- [ ] Subir las 5 fotos de `fotos-catalogo/` cuando existan las plumillas en el catálogo.

## Catálogo de IMCOVALLE (investigado el 26-nov-2026; no se ha cargado nada)
- El dueño dijo que el catálogo es de IMCOVALLE (https://imcovalle.com), "Importadora y Comercializadora del Valle", Cali.
- El sitio muestra unos 19.500 productos (llantas de moto y carro, baterías de moto, kits de arrastre, aceites,
  frenos, repuestos…). Precios con IVA incluido. No muestra códigos (SKU). No se vio una categoría de plumillas.
- Las fotos tienen direcciones tipo `https://imcovalle.com/catalog-img/{id}/0-480.webp`.
- Falta que el dueño decida: qué categorías cargar, si tiene permiso de IMCOVALLE para usar sus datos y fotos, y si
  IMCOVALLE le puede dar un Excel (es lo más confiable) en vez de copiar del sitio.

## Fase 2: Clientes y documentos — TERMINADA (26-nov-2026)
El dueño creó su primer cliente real en la página publicada y le subió RUT, Cámara de Comercio (PDF) y foto (JPG);
también registró un contacto y una interacción. Todo quedó en la base y en el almacén privado.

## Hecho en la Fase 2 (el dueño pidió que fuera como su referencia: otro CRM comercial)
- [x] Migración `20261127010000_fase2_clientes_sedes_contactos.sql` (aplicada): datos nuevos de la empresa
  (nombre comercial, ciudad, tipo de negocio, empleados, plazo de pago, estado pendiente/validado/inactivo,
  Tratamiento de datos), NIT/cédula único, tablas `client_sites` (sedes) y `client_contacts` (contactos),
  y almacén privado `clientes` (máx. 10 MB, PDF o fotos; carpeta por cliente). 12 de 12 pruebas de permisos OK.
- [x] `/clientes`: lista con buscador (razón social, nombre comercial o NIT) y filtros (ciudad, plazo, estado).
  En computador es tabla como la referencia (estado, sedes, contactos, docs CC/RUT/TD, plazo,
  "Actualizar información"); en celular son tarjetas.
- [x] `/clientes/nuevo`: formulario de la empresa; al crear lleva a "Actualizar información".
- [x] `/clientes/[id]/editar` ("Actualizar información"): datos de la empresa, documentos (Cámara de Comercio,
  RUT, Tratamiento de datos y foto: subir, ver, cambiar, quitar), sedes (dirección, ciudad, tráfico, horario,
  empleados, m², días de atención, productos que vende, foto), contactos (cargo, sede, comercial/cartera) y
  validación (lista de lo que falta + marcar validado / pendiente / inactivo).
- [x] `/clientes/[id]` (ficha): pestañas Datos / Interacciones / Pedidos. Contactos con botón de llamar y WhatsApp.
  Interacciones: registrar llamada, reunión o correo con fecha y nota; historial con autor.
- [x] Tablero (`/`) como la referencia: ventas, unidades, baterías, llantas y plumillas del mes en curso
  comparadas con los mismos días del mes anterior, resumen de clientes y últimos clientes.
- [x] Probado en el computador con una empresa de prueba (creada y borrada).
- [x] Publicada en Vercel (26-nov-2026), con permiso del dueño.
- [x] El dueño creó su primer cliente real y le subió documentos en la página publicada (comprobado en la base:
  1 cliente, RUT + Cámara de Comercio + foto en el almacén, 1 contacto, 1 interacción).

## Fase 1: Autenticación y estructura de datos — TERMINADA (26-nov-2026)
El dueño entró con su usuario administrador en la página publicada (https://cr-mthreelions.vercel.app).

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
- [x] Página publicada funcionando con las claves de Vercel: el dueño entró con su usuario administrador.
- [x] Crear usuarios desde la página publicada funciona: primer vendedor creado (26-nov-2026) con su rol correcto.

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
- Dar permiso para publicar la Fase 3.
- Decidir cómo cargar el catálogo (IMCOVALLE: qué categorías, si hay permiso, si te pueden dar un Excel).
- Cuando quieras: crear las cuentas de tu equipo de ventas desde "Usuarios".
- Más adelante: fotos de llantas y baterías en sus carpetas de `fotos-catalogo/`.

## Decisiones tomadas
- **Cuentas (Fase 1, elegido por el dueño):** las crea el administrador desde "Usuarios"; no hay registro público.
  Si alguien olvida su contraseña, el administrador le pone una nueva. La recuperación por correo queda para la Fase 4 (Resend).
- **Roles:** `pendiente` (sin acceso), `vendedor`, `admin`, guardados en `profiles.role`. Un perfil nace "pendiente"
  y el servidor le pone el rol justo después (Supabase guarda `app_metadata` un instante después de crear el usuario).
- `cambiar_rol` es SECURITY DEFINER a propósito. El revisor de Supabase lo avisa; está revisado: comprueba que quien
  la usa es administrador y no deja que alguien se quite su propio rol de administrador.
- **Catálogo (Fase 3, elegido por el dueño):** cada medida es un producto con su propio SKU, precio y stock
  (agrupados por línea). Los precios del catálogo ya incluyen IVA. Al completar un pedido, el stock se descuenta solo.
- **Pedidos:** número consecutivo automático (#1, #2…). Las ventas del tablero cuentan pedidos enviados y completados.
  Un vendedor ve todos los pedidos, pero solo cambia los suyos; el admin cambia todos.
- Carpeta del proyecto: `Documentos\Proyectos\crm-three-lions`. Repositorio: `CRMthreelions` (cuenta cardonaventas33-blip). Rama: `main`.
- Pantallas internas en `src/app/(app)/` (con menú); `/login` va fuera, sin menú.
- Nombres de las claves: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (pública por diseño) y
  `SUPABASE_SECRET_KEY` (solo servidor). Supabase usa las claves nuevas `sb_publishable_` y `sb_secret_`.
- **Colores:** fondo blanco, letras negras, rojo `#c8102e` de acento. El logo conserva azul marino y dorado.
  En el código: `bg-paper`, `text-ink`, `text-ink-soft`, `border-line`, `bg-mist`, `bg-brand`, `bg-brand-dark`, `bg-brand-soft`, `text-ok`.
- **Navegación:** menú lateral con íconos y grupos (como la referencia del dueño), sin carpetas.
- **Agenda:** lunes a sábado, sin domingos.
- **Fotos del catálogo:** en `fotos-catalogo/`, fuera de GitHub; se suben al almacén `productos` de Supabase.
- **Hosting:** Vercel Hobby (gratis) mientras se construye; es solo para uso no comercial. Antes de la Fase 5,
  decidir entre Vercel Pro (unos 20 USD al mes) u otro servicio que permita uso comercial gratis.
- **Publicar:** antes de subir cambios a GitHub (y por lo tanto a la página pública), Claude pregunta al dueño.

## Líneas de plumillas que mostró el dueño (marca IMCOV)
Cada línea viene en varias medidas (decidido: cada medida es un producto distinto):

| Línea | Medidas | Foto |
|---|---|---|
| Plumilla Multiacople Trasera | 10" a 16" | `plumilla-multiacople-trasera.jpg` |
| Plumilla Multiacople Delantera | 14" a 26" | `plumilla-multiacople-delantera.jpg` |
| Plumilla Metálica | 14" a 26" | `plumilla-metalica.jpg` |
| Plumilla Aerodinámica (De Lujo) | 14" a 26" | `plumilla-aerodinamica-de-lujo.jpg` |
| Plumilla Siliconada | 14" a 26" | `plumilla-siliconada.jpg` |

## Notas técnicas
- Supabase: proyecto `ucqieorrhxxysrckpsrn` (región us-west-2, Postgres 17). Las tablas nuevas NO reciben permisos
  automáticos: cada migración debe dar los GRANT necesarios.
- Probar permisos: bloque `do $$ ... $$` que crea usuarios de prueba, usa `set local role authenticated` con
  `request.jwt.claims`, y termina con `raise exception` para que todo se deshaga.
- La numeración de pedidos usa una secuencia: las pruebas que se deshacen igual gastan números. Si la tabla `orders`
  está vacía, se reinicia con `select setval(pg_get_serial_sequence('public.orders', 'number'), 1, false);`.
- La computadora y la página publicada usan la MISMA base de datos: los datos de prueba se borran al terminar.
- Acciones del servidor que terminan con `redirect()` llamadas desde un botón (no un formulario): el botón solo
  muestra el mensaje si hay `error`; si sale bien, la página cambia sola.
- Revisor de seguridad de Supabase: avisa que está apagada la "protección de contraseñas filtradas". Revisarlo en la
  Fase 5 (puede requerir plan de pago).
- Si faltan las claves en Vercel, el middleware responde 503 "Falta configurar las claves de Supabase".
- En Vercel, las claves van en el PROYECTO: proyecto → Settings → Environment Variables → pestaña **"Proyecto"**,
  botón "Agregar variable de entorno". NO en la página del equipo ni en la pestaña "Compartido" (esas no llegan al
  proyecto si no se conectan). El buscador de arriba no guarda nada. Revisar que los nombres no pierdan la primera letra.
  Después de cambiarlas hay que volver a publicar.
- Claves secretas de Supabase: `default` la usa el computador (`.env.local`) y `vercel` la usa la página publicada
  (se creó aparte porque copiar la `default` a mano falló dos veces). Si Supabase rechaza la clave del servidor,
  el aviso de "Usuarios" dice la forma de la clave (largo, prefijo, puntos ocultos) sin mostrar su valor.
- Diagnóstico útil: en los registros de Supabase (`edge_logs`) se ve cada intento contra `/auth/v1/admin/users`
  con su código (401 = clave rechazada) y una pista (`unauthorized_hint`).
- Subir a GitHub: la cuenta está guardada en este computador. Si vuelve a pedir inicio de sesión, usar
  `git credential-manager github login --device` en el panel Terminal.
- Pegar claves o contraseñas: lo que funciona con el dueño es una ventana de PowerShell aparte
  (`scripts\guardar-claves.ps1`, `scripts\crear-admin.ps1`). El portapapeles a veces queda bloqueado en Windows.
- Antes de `npm run build` hay que detener el servidor de desarrollo (ambos usan `.next`).
- En Windows, los scripts de Node que se conectan a internet terminan con `process.exitCode`, no con `process.exit()`.

## Limpieza pendiente (con tu permiso)
- Archivos de ejemplo de Next.js en `public/` (`next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg`).
- Variable vieja "Crmthreelions" en Vercel: no se usa.
