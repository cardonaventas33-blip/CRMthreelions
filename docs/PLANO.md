# CRM para importadora de plumillas, llantas y baterías

> Plano generado con Arquitecto IA · Creadores Digitales IA. Pégalo completo en Claude Code, dentro de una carpeta nueva y vacía.

## 0. Cómo vamos a trabajar (léelo antes de escribir código)

Hola, Claude. Quiero construir el proyecto que se describe abajo y **soy principiante**: nunca he programado, así que explícame todo como a alguien que empieza de cero. Quiero que seas mi desarrollador senior y mi mentor al mismo tiempo. Estas reglas valen para todo el proyecto:

**Ritmo y comunicación**
1. Trabaja por las fases de la sección 8, una a la vez. No empieces la siguiente hasta que yo te diga "sigue".
2. Antes de cada fase dime en 2 o 3 líneas qué vas a hacer y por qué. Al terminarla dime qué quedó listo, cómo lo pruebo yo (qué abrir, qué tocar y qué debería ver) y qué sigue.
3. Háblame en español sencillo. Si usas una palabra técnica, explícala en una frase la primera vez.
4. Si algo de este plano no está claro o hay una decisión que me toca, pregúntame con opciones concretas y tu recomendación, en vez de adivinar.

**Cuando necesites que yo haga algo**
5. Hay cosas que solo puedo hacer yo: crear cuentas, iniciar sesión, pagar, verificar mi correo o copiar claves. Cuando llegue ese momento, detente y dame instrucciones numeradas: el enlace exacto, qué botón tocar, qué opción elegir y qué debo ver en pantalla al terminar. Espera mi confirmación antes de seguir.
6. Nunca me pidas que pegue contraseñas, claves o tokens en este chat. Dime el nombre exacto de la variable y que la pegue yo en el archivo `.env.local`. Tú solo verificas que exista, sin mostrar su valor.
7. Si hace falta instalar algo en mi computadora (Node.js, Git u otra herramienta), primero revisa si ya lo tengo y, si falta, dame el enlace oficial y los pasos para mi sistema operativo.

**Calidad y seguridad**
8. Usa primero opciones gratuitas (los planes gratis de Vercel, Supabase y similares). Si algo va a costar dinero, avísame antes, con el precio y una alternativa.
9. Seguridad desde el principio: las claves solo en variables de entorno (con `.env.local` en `.gitignore`) y nunca en el código que corre en el navegador; valida en el servidor todo lo que envíe un usuario; si hay cuentas, cada persona solo puede ver y cambiar lo suyo (por ejemplo, con RLS en Supabase); las contraseñas y los pagos siempre con un servicio especializado, nunca hechos a mano.
10. Prueba cada parte antes de decir que funciona: corre el proyecto, revisa que no haya errores en la terminal ni en la consola del navegador y que se vea bien en el celular.
11. Si aparece un error, explícame en una frase qué pasó y arréglalo tú. No me pidas editar código a mano salvo que no haya otra forma.
12. Guarda el avance con Git: un commit con un mensaje claro al cerrar cada fase.

**Memoria del proyecto**
13. Crea `PROGRESS.md` en la raíz con la fase actual, lo hecho, lo que falta, las decisiones tomadas y lo que está pendiente de mi parte. Actualízalo al cerrar cada fase. Si en otra sesión te escribo "continúa", lee primero `PROGRESS.md` y `docs/PLANO.md` y sigue desde ahí.
14. Guarda este plano completo en `docs/PLANO.md` al empezar, para no perderlo.

## 1. Visión del proyecto
Un CRM web simple para la importadora de plumillas, llantas y baterías que permita al equipo de ventas gestionar clientes, agenda, seguimiento, catálogo de productos y pedidos. Resuelve la dispersión de datos (fotos, documentos, historial de interacciones y pedidos) y centraliza tareas comerciales. Éxito de la versión 1: el equipo usa el dashboard para crear clientes con documentos, agendar citas, registrar interacciones y generar pedidos básicos desde el catálogo.

## 2. Para quién es
- Usuario: Vendedor (equipo de ventas). Crea/edita clientes, agenda citas, registra interacciones, crea pedidos, consulta catálogo y clientes.  
- Usuario: Administrador (propietario/gerente). Todo lo anterior + gestión de productos y ver reportes simples.  
- Usuario: Visitante (lectura pública limitada, opcional). Solo página de ingreso / ayuda; no accede a datos.

## 3. Funciones
**Versión 1 (imprescindible)**:
- Autenticación básica (correo/contraseña) y permisos (vendedor vs administrador).
- Dashboard con resumen: próximos eventos de agenda y últimos clientes/pendientes.
- Gestión de clientes: crear/editar cliente con campos y subir foto y documentos (Cámara de comercio, RUT/NIT).
- Ficha de cliente: pestañas Interacciones y Pedidos; historial de interacciones (notas) y lista de pedidos.
- Agenda de citas (crear/editar/cancelar) y sincronización saliente con Google Calendar (opcional, integración simple).
- Catálogo de productos (crear/editar por admin) con foto, SKU, precio estimado y stock.
- Crear pedido desde ficha de cliente o desde catálogo (cliente, productos, cantidad, estado "borrador→enviado→completado").
- Integración para enviar mensajes a clientes por WhatsApp (enlace prellenado) y enviar correos por Resend (plantilla simple).
- Seguridad mínima: validación en servidor, variables de entorno para claves, permisos RLS en la DB.

**Para después**:
- Integración de pagos en línea.
- Automatizaciones avanzadas (recordatorios por SMS/WhatsApp automatizados).
- Reportes financieros y KPI avanzados.
- Roles y permisos más granularizados.
- Imports/exports masivos tipo CSV con mapeo avanzado.

## 4. Pantallas y recorrido
Pantallas:
- Login: correo, contraseña, botón "Olvidé contraseña".
- Dashboard: resumen (próximas citas, últimos 5 clientes creados, pedidos recientes).
- Clientes → Lista: filtro por nombre/NIT, botón "Crear cliente".
- Clientes → Crear/Editar cliente: campos principales + subir foto + subir documentos (RUT, cámara de comercio).
- Cliente → Ficha (pestañas): 
  - Datos: nombre, NIT/RUT, contacto, dirección, fotos, documentos.
  - Interacciones: botón "Registrar interacción" (tipo: llamada/reunión/email, notas, fecha, responsable).
  - Pedidos: lista de pedidos del cliente y botón "Crear pedido".
- Agenda: vista semanal y lista de citas; crear/editar cita (fecha/hora, duración, cliente, responsable, notas).
- Catálogo → Lista: productos con búsqueda, botón "Crear producto".
- Catálogo → Crear/Editar producto: nombre, SKU, categoría (plumillas/llantas/baterías), foto, precio, stock, descripción.
- Pedido → Crear/Editar: seleccionar cliente, añadir productos (cantidad), subtotal, estado, notas; botón "Enviar/Guardar".
- Pedido → Vista detalle: resumen, historial de cambios, botón "Enviar WhatsApp" y "Enviar correo".
- Configuración (solo admin): usuarios, productos, integraciones (Google Calendar, WhatsApp, Resend).

Recorrido principal (vendedor):
1. Login.
2. Dashboard: ver próximas citas y abrir ficha de cliente.
3. Si cliente no existe: Clientes → Crear cliente → subir foto y documentos → guardar.
4. Desde ficha: Interacciones → registrar nota de llamada.
5. Crear pedido: Pedidos → Crear → añadir productos desde catálogo → guardar y marcar "enviado".
6. Enviar mensaje por WhatsApp desde pantalla de pedido para notificar al cliente.

## 5. Datos que guarda
Usar Supabase (Postgres) si hay cuentas/datos. Colecciones/tablas principales:

- users (auth gestionado por Supabase Auth)
  - id (uuid), email (texto), role (texto: admin|vendedor), name (texto)
  - Quién puede ver/cambiar: admin puede ver y cambiar roles; cada usuario puede cambiar su nombre.

- clients
  - id, name (texto), nit_rut (texto), contact_name, phone, email, address, notes (texto corto)
  - photo_url (texto), rut_doc_url (texto), camara_comercio_url (texto), created_by (user id), created_at
  - Ver: vendedores y admins. Editar: vendedores (su equipo) y admins.

- interactions
  - id, client_id, user_id (quién registró), type (llamada/reunión/email), note (texto), date
  - Ver: vendedores y admins. Editar: quien creó + admin.

- products
  - id, name, sku, category (plumillas|llantas|baterías), price (número), stock (número), photo_url, description
  - Ver: todos vendedores/admin. Editar/crear: admin.

- orders
  - id, client_id, user_id (creador), status (borrador|enviado|completado), total, created_at, updated_at, notes
  - Ver: vendedores/admin. Editar: creador y admin. Estado controlado por servidor.

- order_items
  - id, order_id, product_id, quantity, unit_price, subtotal

- appointments
  - id, client_id (opcional), user_id (responsable), title, start_at, end_at, notes, google_event_id (opcional)
  - Ver: vendedores/admin. Editar: responsable y admin.

Almacenamiento de archivos: Supabase Storage o almacenamiento en la nube configurado; urls guardadas en campos *_url. Reglas RLS: cada tabla con políticas para que solo usuarios autenticados puedan leer; clientes y datos solo dentro del equipo (policy por role). Validación en servidor para precios, stock y permisos.

Si no guarda datos: No aplica — sí guarda datos.

## 6. Tecnología
- Frontend: Next.js (App Router) con TypeScript y Tailwind CSS — por ser la opción por defecto sencilla y desplegable en Vercel.  
- Backend/DB/Auth/Storage: Supabase — maneja Postgres, Auth y Storage con RLS para permisos (recomendado por requerimiento de cuentas y documentos).  
- Despliegue: Vercel — despliegue gratuito y directo desde repo Next.js.  
- Correos: Resend — envío de correos transaccionales desde servidor (clave en .env).  
- Integración Calendario: Google Calendar API (opcional) para crear events; credenciales en .env.  
- WhatsApp: WhatsApp Cloud API de Meta — usamos enlace prellenado tipo wa.me para versión 1 y llamada a API para envíos cuando el admin provea token.  
- IA: no requerida ahora; si se usa para plantillas o resúmenes, usar API externa y poner clave en .env (aviso de costo por uso).  
- No añadimos pasarela de pagos sin saber país: preguntar antes de integrar cobros.

## 7. Diseño
Dirección visual: sencillo, profesional y móvil primero. Sensación: funcional y clara, centrada en tareas rápidas para vendedores.

- Paleta:
  - Primario: #0F62FE (azul fuerte)
  - Secundario: #0B6E4F (verde suave)
  - Fondo: #F7F9FC (gris muy claro)
  - Texto principal: #111827
  - Surface/card: #FFFFFF
- Tipografías: Inter (Google Fonts) para UI, JetBrains Mono para datos tabulares si se desea.
- Componentes clave: header con búsqueda, sidebar colapsable (móvil: bottom nav), tarjetas de cliente, listas con acciones, modales para crear/editar, formulario de subida de archivos con vista previa.
- Accesibilidad: contrastes altos, botones táctiles >=44px, etiquetas asociadas a inputs, mensajes de error claros.  
- Animaciones: microinteracciones sutiles (hover en filas, transición al abrir modal, carga de imágenes con fade).

## 8. Plan de construcción por fases
### Fase 0: Preparación
Objetivo: crear proyecto y primer despliegue mínimo.
Tareas:
- Crear repo en GitHub y proyecto Next.js con TypeScript + Tailwind.
- Conectar Vercel y hacer primer despliegue.
- Crear cuenta en Supabase y proyecto base.
Lo que necesito de ti: cuentas de Vercel y Supabase; variables en .env.local: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE (solo en servidor). (gratis/plan inicial)
Listo cuando: al abrir la URL de Vercel se ve la página inicial de Next.js.

### Fase 1: Autenticación y estructura de datos
Objetivo: usuarios autenticados y tablas creadas.
Tareas:
- Configurar Supabase Auth, crear tablas (users, clients, products, orders, order_items, interactions, appointments).
- Implementar RLS básico (roles admin/vendedor).
- Interfaz de Login y Registro simple.
Lo que necesito de ti: nada adicional (usarás cuentas creadas en Fase 0).
Listo cuando: un vendedor puede iniciar sesión y acceder a dashboard vacío.

### Fase 2: Gestión de clientes y almacenamiento de documentos
Objetivo: crear/editar clientes con fotos y documentos.
Tareas:
- Formularios para crear/editar cliente y subir archivos a Supabase Storage.
- Ficha de cliente con pestañas Datos / Interacciones / Pedidos.
- Validación server-side para campos obligatorios.
Lo que necesito de ti: logos e imágenes de empresa (opcional), texto para campos obligatorios si hay etiquetas custom. (gratis)
Listo cuando: puedes crear un cliente, subir foto y dos documentos y verlos en la ficha.

### Fase 3: Catálogo y pedidos
Objetivo: crear productos y generar pedidos.
Tareas:
- CRUD de productos (admin).
- Interfaz para crear pedido desde ficha cliente o desde catálogo.
- Guardar order_items y cálculo de totales server-side.
Lo que necesito de ti: lista inicial de productos (nombre, SKU, categoría, precio, stock) — (fase 3) [por definir: proveer lista en CSV opcional].
Listo cuando: se puede crear producto y realizar un pedido asociado a un cliente y ver total.

### Fase 4: Agenda y comunicacion
Objetivo: agenda funcional y notificaciones por WhatsApp/correo.
Tareas:
- Crear/editar citas (vista lista/semanal).
- Botón "Enviar WhatsApp" (wa.me con mensaje prellenado) y enviar correo via Resend al crear pedido.
- Conectar Google Calendar (opcional) para crear eventos.
Lo que necesito de ti: cuenta de Resend y clave API en .env (RESEND_API_KEY); cuenta Google Cloud y credenciales si sincronizar calendar (opcional); número de WhatsApp o prefijo país. (Resend: pago según uso; Google API: puede ser gratis con límites)
Listo cuando: una cita se crea y se puede enviar un correo y abrir WhatsApp con mensaje al cliente.

### Fase 5: Seguridad, ajustes y primer despliegue público
Objetivo: validar seguridad y desplegar versión 1 a producción.
Tareas:
- Revisar RLS y validaciones server-side.
- Ajustes UI, pruebas de flujo (crear cliente, subir docs, crear pedido, enviar comunicación).
- Despliegue final en Vercel con variables de entorno configuradas.
Lo que necesito de ti: confirmar dominio si quieres custom domain y poner variables finales en Vercel: SUPABASE_*, RESEND_API_KEY, GOOGLE_CREDENTIALS (si aplica), WHATSAPP_TOKEN (si aplica). (dominio: pago si uses custom)
Listo cuando: todos los flujos principales funcionan en producción y puedes crear clientes, pedidos y enviar comunicaciones.

## 9. Lo que vas a necesitar de mí
- Vercel account (Fase 0) — gratis/puede tener pago si domain.
- Supabase account & project (Fase 0) — gratis plan disponible; pegar SUPABASE_URL y SUPABASE_ANON_KEY en .env.local.
- Resend account y API key (Fase 4) — pago según uso; pegar RESEND_API_KEY en .env.local.
- Google Cloud project + OAuth credentials para Google Calendar (opcional, Fase 4) — posiblemente gratuito con límites; pegar GOOGLE_CLIENT_ID/SECRET o credenciales en .env.local.
- WhatsApp Cloud API token y phone number (si desea envíos desde API, Fase 4) — puede requerir verificación; pegar WHATSAPP_TOKEN en .env.local. Para versión 1 se usa enlace wa.me (solo número).
- Lista inicial de productos (Fase 3) — formato CSV o spreadsheet con columnas: name, sku, category, price, stock, description, image(optional).
- Logos, textos legales y descripción de empresa (Fase 2) — imágenes y textos para la app.
- Decisión sobre pasarela de pagos (si aplica en futuro) — indicar país antes de integrar.
- Acceso a Google Sheets/Excel para export/import (opcional, Fase 3) — si quieres integración directa, comparte la intención y credenciales OAuth más adelante.

---

## Para empezar

Guarda este plano en `docs/PLANO.md` y crea `PROGRESS.md`. Luego revisa qué tengo instalado en mi computadora, explícame en pocas líneas cómo vamos a construir el proyecto y arranca con la **Fase 0**. Una fase a la vez: al terminar cada una, esperas mi "sigue".
