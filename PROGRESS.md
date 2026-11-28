# Progreso del proyecto — CRM Three Lions SAS

> Si en otra sesión escribes "continúa", Claude lee este archivo y `docs/PLANO.md` y sigue desde aquí.

## Fase actual
**Fase 4: Agenda y comunicación — PUBLICADA (27-nov-2026), con permiso del dueño.**
El dueño ya creó su primera cita (sábado 28-nov, 9:30 a. m.) y quedó bien guardada. En la página publicada se revisó
que carga y que las páginas nuevas piden sesión; el panel del navegador de Claude no tenía sesión para ver más.
Siguen pendientes de la Fase 3: precios y stock (el equipo creó pedidos vacíos porque ningún producto tiene
precio) y la autorización de IMCOVALLE. Después: "sigue" para la Fase 5 (seguridad, ajustes y lanzamiento).

**Tareas y Despachos (pedido del dueño, 27-nov-2026) — PUBLICADOS (28-nov-2026), con permiso del dueño.**

## Tareas y Despachos (27/28-nov-2026, pedido por el dueño) — PUBLICADOS y revisados en la página
- [x] Decisiones del dueño: **Tareas del equipo** (qué hacer, fecha límite, responsable, cliente opcional y prioridad;
  se marca hecha; "Mis tareas" o "Todo el equipo"; las vencidas en rojo y las de hoy en el Inicio) y **Pedidos por
  despachar** (Por despachar → Despachado → Entregado; al entregar, el pedido queda completado y se descuenta el stock).
- [x] Migración `20261127110000_tareas_despachos.sql` (aplicada): tabla `tasks` con permisos (todo el equipo las ve;
  cada uno se asigna las suyas y el admin a cualquiera; las cambia el responsable, quien la creó o el admin; las borra
  quien la creó o el admin). En pedidos: `dispatched_at`, `carrier`, `tracking_number`, `dispatch_notes`,
  `delivered_at` y `received_by`, con reglas en la base (solo se despachan pedidos enviados; uno despachado no vuelve a
  borrador sin deshacer el despacho; la entrega solo se guarda con el pedido completado). 12 de 12 pruebas OK.
- [x] Menú: **Tareas** y **Despachos** debajo de Catálogo.
- [x] `/tareas`: formulario rápido (qué hacer, fecha, prioridad, cliente y, para el admin, responsable); grupos
  Vencidas (en rojo), Para hoy, Próximas y Sin fecha; círculo para marcarla hecha (o devolverla); "Hechas hace poco";
  "Mis tareas" / "Todo el equipo". `/tareas/[id]/editar` con "Borrar tarea".
- [x] Inicio: "Tareas para hoy" (las de hoy y las vencidas; el admin ve las del equipo); se marcan ahí mismo.
- [x] `/despachos`: pestañas Por despachar / Despachados / Entregados (los últimos 30). **Despachar**: transportadora
  (Servientrega, Coordinadora, Interrapidísimo, Envía, TCC, Deprisa, Entrega propia u otra), número de guía, fecha y
  notas. **Avisar por WhatsApp** con la transportadora y la guía. **Marcar entregado** (quién recibió y fecha) o
  **Deshacer despacho**. Si no alcanza el stock, dice qué producto falta.
- [x] Página del pedido: sección **Despacho** con lo mismo. Se quitó "Marcar como completado": ahora un pedido se
  completa al marcarlo entregado (así queda la transportadora, la guía y quién recibió).
- [x] Arreglo: en la página del pedido, el nombre de los productos ya no sale letra por letra en pantallas medianas.
- [x] Probado en el panel del navegador (computador y celular): crear, editar, marcar y borrar tareas; despachar,
  deshacer, despachar con entrega propia, aviso de stock insuficiente y entrega. Datos de prueba borrados (el
  siguiente pedido sigue siendo el #5). Tipos, lint y compilación sin errores.
- [x] Publicado en Vercel (28-nov-2026), con permiso del dueño. Revisado en la página publicada: el menú trae Tareas y
  Despachos; Tareas, Despachos, Inicio y un pedido cargan con sesión y sin errores en la consola; sin sesión, las
  páginas nuevas mandan a `/login`.

## Agenda como ruta de visitas (27-nov-2026, como la referencia del dueño) — PUBLICADA y revisada en la página
- [x] Decisiones del dueño: la barra de cada visita muestra **si ya le toca comprar** (días sin comprar ÷ cada cuántos
  días compra; 100 % verde = ya le toca, poco % rojo = compró hace poco); **Iniciar visita** = anotar cómo fue (queda en
  el historial como interacción "Visita"), marcarla hecha y ofrecer crear el pedido; tipos con colores
  (Tu calendario, Planificación inicial, Interacción no planeada, Seguimiento, Compromiso de pago);
  ⭐ = cliente importante (lo marca el admin) y 🟢 = visita hecha.
- [x] Migración `20261127090000_agenda_ruta_visitas.sql` (aplicada): en citas `kind` (tipo), `site_id` (sede, debe ser
  del mismo cliente) y `completed_at` (visita hecha); `zone` en sedes (Norte, Sur, Oriente, Occidente, Centro);
  `is_key` en clientes (solo el admin lo cambia); interacción tipo "visita"; vista `client_purchase_stats` (compras,
  última compra, promedio y frecuencia con pedidos enviados o completados). 9 de 9 pruebas OK.
- [x] `/agenda`: "Agenda del mes" con semanas numeradas (semana del año), lunes a sábado, tarjetas por visita (cliente,
  sede, CIUDAD - ZONA, potencial = compra promedio, ⭐, 🟢, barra), "Total día", buscador de clientes, colores por tipo,
  Anterior / Hoy / Siguiente, vista Semana, "Mis citas" o "Todo el equipo". En el celular los días van uno debajo del otro.
- [x] Ventana **Detalles de la visita**: foto, contacto con llamar y WhatsApp, historial (última compra, compra en
  promedio, frecuencia y días sin comprar), "se llevó" (productos del último pedido), dirección con "Cómo llegar"
  (Google Maps), datos de la visita, Google Calendar, **Reprogramar** e **Iniciar visita**.
- [x] **No programados**: clientes activos sin visita en el mes, primero los que ya les toca comprar, con "Agendar".
- [x] `/agenda/[id]/visita`: registrar la visita y crear el pedido de ese cliente.
- [x] Formulario de cita con tipo y sede; formulario de sede con zona; ⭐ en la ficha del cliente (botón para el admin).
- [x] Probado en el panel del navegador (computador y celular): agenda, detalle, crear cita de prueba, iniciar visita,
  punto verde, borrar cita. Datos de prueba borrados. `node scripts/probar-agenda.mjs`: 31 de 31 OK.

## Hecho en la Fase 4
- [x] Decisiones del dueño (27-nov): el correo sale **desde el correo de cada vendedor** (el botón abre Gmail/Outlook con
  el pedido escrito) y Google Calendar con un **botón** que abre la cita ya llena. Gratis y sin cuentas nuevas.
  Resend (envío automático, necesita dominio propio) y la sincronización automática con Google quedan para después.
- [x] `/agenda`: vista **Mes** (calendario de lunes a sábado con las citas de cada día) y vista **Semana**; "Mis citas" o
  "Todo el equipo" (el admin ve el equipo por defecto). Cada cita muestra hora, cliente, dirección, responsable y notas,
  con botones **Editar**, **Google Calendar** y **Confirmar por WhatsApp** (al celular del contacto comercial).
- [x] `/agenda/nueva` y `/agenda/[id]/editar`: título (con sugerencias), cliente, fecha, hora, duración, notas y,
  para el admin, el responsable. No deja agendar domingos. **Cancelar** (queda tachada), volver a la agenda o borrar.
- [x] Inicio: "Tus próximas citas" (el admin ve las del equipo), próximos 30 días.
- [x] Ficha del cliente: pestaña **Citas** con las próximas y las anteriores, y botón "Agendar cita".
- [x] Pedidos: sección **"Enviar al cliente"** con botones **WhatsApp** y **Correo** por cada contacto (primero los
  comerciales) y la empresa; el mensaje trae los productos, el total con IVA, las notas y la firma de quien envía.
- [x] `/configuracion` (solo admin): cómo está conectado el CRM (WhatsApp, correo, Google Calendar) y lo que queda
  para después.
- [x] Todo en hora de Colombia (UTC-5). Pruebas sin pantalla: `node scripts/probar-agenda.mjs` (20 de 20 OK).
- [x] Revisado: tipos, lint y registros del servidor sin errores mientras el dueño usaba la agenda. El panel del
  navegador de Claude perdió la sesión, así que las pantallas las probó el dueño en su propio navegador.

## Fase 3: Catálogo y pedidos — PUBLICADA (26-nov-2026)
Revisada en la página publicada: catálogo con las 18 categorías y las 59 plumillas IMCOV (con foto, sin precio,
stock 0), pedidos e inicio con ventas por tipo; sin errores en la consola.

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
- [x] Migración `20261127050000_catalogo_categorias_busqueda.sql` (aplicada): tabla `product_categories` con 18
  categorías (las 16 de IMCOVALLE + Plumillas + Baterías de carro), cada una con su grupo para el tablero
  (llantas, baterías, plumillas u otros); `products.category` ligado a esa tabla; origen de productos copiados
  (`source`, `source_id`: solo los escribe el copiador); fotos con dirección https; búsqueda sin tildes
  (columna `search` calculada sola + índice). 11 de 11 pruebas OK.
- [x] Migración `20261127060000_pedidos_sin_precio.sql` (aplicada): un producto sin precio (0) no se puede agregar
  a un pedido; la base avisa "… todavía no tiene precio". 2 de 2 pruebas OK.
- [x] Catálogo: filtro con las 18 categorías; búsqueda sin tildes y por palabras ("bateria akt" encuentra
  "Batería … AKT"); "Sin precio" en vez de $ 0; para el admin, aviso de cuántos productos no tienen precio y casilla
  "Solo productos sin precio". En el formulario el precio es opcional (vacío = sin precio).
- [x] Pedidos: el buscador muestra "Sin precio" y no deja agregar esos productos.
- [x] Tablero: ventas por tipo de producto (Llantas, Baterías, Plumillas y Otros productos).
- [x] **Plumillas IMCOV montadas (59)** con `scripts/cargar-plumillas.mjs`: Multiacople Trasera 10" a 16",
  y Multiacople Delantera, Metálica, Aerodinámica De Lujo y Siliconada de 14" a 26" (cada pulgada). Códigos
  `PLU-MAT-10`, `PLU-MAD-14`, `PLU-MET-14`, `PLU-AER-14`, `PLU-SIL-14`…; foto por línea en el almacén
  `productos/lineas/`; marca IMCOV; descripción con los milímetros; sin precio y stock 0.
- [x] Copiador de IMCOVALLE listo (`scripts/imcovalle.mjs`). Probado leyendo 1 página y cargando 3 productos
  inventados (`datos/prueba/productos.json`), que luego se borraron. **No se ha copiado nada de IMCOVALLE.**

## Modo claro / oscuro (26-nov-2026, pedido por el dueño)
- [x] En el menú, abajo ("Apariencia"): **Claro** (el normal), **Oscuro** y **Automático** (sigue al celular o
  computador). Se guarda en cada aparato (navegador), no en la cuenta. Sin destello blanco al abrir.
- [x] Colores del modo oscuro en `src/app/globals.css` (`:root.dark`): los mismos nombres (paper, ink, line, mist,
  brand…) con valores para fondo oscuro. El rojo se aclara (#f25a72) para leerse sobre negro; por eso la letra de los
  botones rojos usa el color nuevo `on-brand` (blanca en claro, oscura en oscuro).
- [x] Probado en computador y celular: inicio, catálogo con fotos, agenda, formularios, menú del celular y el modo
  Automático (cambia solo cuando el aparato cambia). Sin errores en la consola.
- [x] Publicado en Vercel (26-nov-2026), con permiso del dueño, y revisado en la página publicada.

## Pendiente de la Fase 3
- [x] Publicada en Vercel (26-nov-2026), con permiso del dueño.
- [ ] Autorización escrita de IMCOVALLE. Con ella: `node scripts/imcovalle.mjs copiar --autorizado`
  (unos 15–20 minutos) y después `node scripts/imcovalle.mjs cargar` (primero se puede usar `--simular`).
- [ ] El dueño pone precios y stock (hoy todo dice "Sin precio" y "Agotado").

## Catálogo de IMCOVALLE (revisado el 26-nov-2026; NO se ha copiado nada)
- El dueño dijo que el catálogo es de IMCOVALLE (https://imcovalle.com), "Importadora y Comercializadora del Valle",
  Cali, y que vende todo. Decidió copiarlo de la página, **sin precios ni existencias** (los pone él).
- Sus términos (punto 6, Propiedad Intelectual) prohíben reproducir textos e imágenes sin autorización escrita.
  El dueño la va a pedir; el copiador no copia sin la palabra `--autorizado`.
- `robots.txt` deja leer las páginas públicas pero no `/api/`; el copiador solo usa páginas públicas y el mapa del sitio.
- 17.610 productos (mapa del sitio) en 16 categorías: llantas-moto, llantas-carro, rines, baterias-moto, aceites,
  aditivos, kits-arrastre, frenos, amortiguadores, luces, repuestos-motor, repuestos-honda, accesorios, maleteros,
  en-tienda (para recoger en Cali, 1.880) y otros (4.415). No tiene plumillas.
- Cómo copia: recorre `/productos?sort=name_asc&page=N` (24 por página, unas 734 páginas, de a 2 con pausas) y lee
  los datos que cada página trae escondidos (`self.__next_f`): código interno, nombre, categoría y foto. Luego
  revisa el mapa del sitio y completa uno por uno los que falten.
- Al cargar: código `IMC-` + comienzo de su código interno; fotos mostradas desde su página (no se copian a nuestro
  almacén); **los productos que ya están en el CRM no se tocan** (ni nombre, ni categoría, ni precio, ni stock).

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
- Ponerle la **zona** a las sedes de tus clientes (Norte, Sur…) y marcar con ⭐ los clientes importantes.
- **Poner precios** (y stock) a los productos que tu equipo vende: sin precio no pueden armar pedidos
  (hay pedidos vacíos en borrador por eso). Sin stock, en Despachos no se puede marcar un pedido como entregado.
- Decidir qué hacer con el producto de prueba **"PRUEBA Producto despacho (se borra)"** (código 44300S94-003):
  le pusiste foto, línea y precio, así que no lo borré. ¿Se borra o se vuelve producto real (cambiándole el nombre)?
- Pedir a IMCOVALLE la autorización escrita (un correo sirve) para copiar su catálogo. Si te dan un Excel, mejor.
- Poner precios y stock a los productos (empezando por las 59 plumillas).
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
- **Catálogo sin precio (26-nov):** el catálogo se monta sin precios y con stock 0; el dueño los pone después.
  Sin precio no se puede pedir. "Sin precio" = precio 0 en la base.
- **Categorías:** viven en la tabla `product_categories` (no en el código). Cada una tiene un grupo para el tablero.
- **Copiador:** solo agrega productos nuevos; nunca cambia lo que ya está en el CRM (el dueño organiza a su gusto).
- **Pedidos:** número consecutivo automático (#1, #2…). Las ventas del tablero cuentan pedidos enviados y completados.
  Un vendedor ve todos los pedidos, pero solo cambia los suyos; el admin cambia todos.
- **Despachos (28-nov):** un pedido se completa solo al marcarlo entregado en Despachos (o en la sección Despacho del
  pedido). Lo despacha y lo entrega su vendedor o un admin. Fecha de despacho o entrega: si es hoy, la hora de ese
  momento; si fue otro día, ese día al mediodía (no se aceptan fechas futuras).
- **Tareas (28-nov):** cada vendedor se asigna las suyas; el admin puede asignarlas a cualquiera. El admin ve por
  defecto las del equipo y cada vendedor las suyas (los dos pueden cambiar la vista).
- Carpeta del proyecto: `Documentos\Proyectos\crm-three-lions`. Repositorio: `CRMthreelions` (cuenta cardonaventas33-blip). Rama: `main`.
- Pantallas internas en `src/app/(app)/` (con menú); `/login` va fuera, sin menú.
- Nombres de las claves: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (pública por diseño) y
  `SUPABASE_SECRET_KEY` (solo servidor). Supabase usa las claves nuevas `sb_publishable_` y `sb_secret_`.
- **Colores:** fondo blanco, letras negras, rojo `#c8102e` de acento. El logo conserva azul marino y dorado.
  En el código: `bg-paper`, `text-ink`, `text-ink-soft`, `border-line`, `bg-mist`, `bg-brand`, `bg-brand-dark`, `bg-brand-soft`, `text-ok`.
  Letra sobre botones rojos: `text-on-brand` (nunca `text-white`). No usar colores fijos (white, black, gray-…):
  así el modo oscuro funciona solo. Excepción: el velo detrás del menú del celular (`bg-black/50`).
- **Modo oscuro:** opcional; por defecto el CRM se ve claro (como lo diseñó el dueño).
- **Navegación:** menú lateral con íconos y grupos (como la referencia del dueño), sin carpetas.
- **Agenda:** lunes a sábado, sin domingos.
- **Fotos del catálogo:** en `fotos-catalogo/`, fuera de GitHub; se suben al almacén `productos` de Supabase.
- **Hosting:** Vercel Hobby (gratis) mientras se construye; es solo para uso no comercial. Antes de la Fase 5,
  decidir entre Vercel Pro (unos 20 USD al mes) u otro servicio que permita uso comercial gratis.
- **Publicar:** antes de subir cambios a GitHub (y por lo tanto a la página pública), Claude pregunta al dueño.

## Líneas de plumillas del dueño (marca IMCOV) — ya están en el catálogo
Cada medida es un producto distinto (cada pulgada del rango, 59 en total):

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
- Antes de `npm run build` hay que detener el servidor de desarrollo (ambos usan `.next`). Después de compilar,
  el servidor de desarrollo a veces se cierra con "EINVAL … readlink" (OneDrive y la carpeta `.next`):
  basta con arrancarlo otra vez.
- Programas con la clave secreta (leen `.env.local` sin mostrarla): `scripts/cargar-plumillas.mjs` y
  `scripts/imcovalle.mjs`. Ambos se pueden correr varias veces sin repetir productos; `--simular` no cambia nada.
- Búsqueda: la columna `products.search` se calcula sola (nombre + código + línea + medida + marca, sin tildes).
  En el código, `palabrasDeBusqueda()` limpia lo que escribe la persona igual que la base.
- En Windows, los scripts de Node que se conectan a internet terminan con `process.exitCode`, no con `process.exit()`.
- Componentes del navegador que cambian de estado después de un `redirect()` a la misma página (por ejemplo
  `AccionesDespacho`): se les pone `key` con el estado para que no quede abierto el formulario anterior.
- Filas que dependen del ancho de su caja y no de la pantalla: `@container` en la caja y `@lg:` en los hijos
  (Tailwind v4). Así se arregló la lista de productos del pedido junto a la columna derecha.

## Limpieza pendiente (con tu permiso)
- Archivos de ejemplo de Next.js en `public/` (`next.svg`, `vercel.svg`, `file.svg`, `globe.svg`, `window.svg`).
- Variable vieja "Crmthreelions" en Vercel: no se usa.
