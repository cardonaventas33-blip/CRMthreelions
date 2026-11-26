-- =====================================================================
-- CRM Three Lions · Fase 1
-- Usuarios con rol, tablas del negocio y permisos (RLS).
--
-- Reglas principales:
--   * Solo el equipo (rol vendedor o admin) ve y trabaja con los datos.
--   * Una cuenta nueva empieza "pendiente" (sin acceso) salvo que un
--     administrador la cree con rol desde el CRM.
--   * Quien no ha iniciado sesión (anon) no puede leer ni escribir nada.
--   * Precios y totales de los pedidos los calcula la base de datos.
-- =====================================================================

-- 1) Tipos ------------------------------------------------------------
create type public.rol_usuario as enum ('pendiente', 'vendedor', 'admin');
create type public.tipo_interaccion as enum ('llamada', 'reunion', 'email');
create type public.categoria_producto as enum ('plumillas', 'llantas', 'baterias');
create type public.estado_pedido as enum ('borrador', 'enviado', 'completado');

-- 2) Esquema privado: funciones internas que la API no expone ------------
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- Pone sola la fecha de "última modificación"
create function private.tocar_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- 3) Perfiles: un perfil por cada usuario de Supabase Auth ---------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null default '' check (char_length(name) <= 120),
  role public.rol_usuario not null default 'pendiente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is 'Usuarios del CRM y su rol: admin, vendedor o pendiente (sin acceso).';

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function private.tocar_updated_at();

-- Rol de quien hace la consulta (security definer para no chocar con RLS)
create function private.mi_rol()
returns public.rol_usuario
language sql
stable
security definer
set search_path = ''
as $$
  select p.role from public.profiles p where p.id = (select auth.uid());
$$;

create function private.es_equipo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select private.mi_rol()) in ('vendedor', 'admin'), false);
$$;

create function private.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select private.mi_rol()) = 'admin', false);
$$;

revoke all on function private.mi_rol() from public;
revoke all on function private.es_equipo() from public;
revoke all on function private.es_admin() from public;
grant execute on function private.mi_rol() to authenticated;
grant execute on function private.es_equipo() to authenticated;
grant execute on function private.es_admin() to authenticated;

-- Crea el perfil cuando nace un usuario en Supabase Auth.
-- El rol solo se toma de app_metadata (eso únicamente lo puede poner el
-- servidor con la clave secreta); si no viene, queda "pendiente".
create function private.crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  rol_pedido text := new.raw_app_meta_data ->> 'rol';
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    left(coalesce(new.raw_user_meta_data ->> 'name', ''), 120),
    case
      when rol_pedido in ('vendedor', 'admin') then rol_pedido::public.rol_usuario
      else 'pendiente'::public.rol_usuario
    end
  );
  return new;
end;
$$;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function private.crear_perfil();

-- Mantiene el correo del perfil igual al de Supabase Auth
create function private.sincronizar_correo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = coalesce(new.email, '') where id = new.id;
  return new;
end;
$$;

create trigger al_cambiar_correo
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function private.sincronizar_correo();

-- Perfiles para usuarios que ya existieran antes de esta migración
insert into public.profiles (id, email)
select u.id, coalesce(u.email, '') from auth.users u
on conflict (id) do nothing;

alter table public.profiles enable row level security;

create policy "perfiles: cada uno ve el suyo y el equipo ve a todos"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select private.es_equipo()));

create policy "perfiles: cada uno edita su propio nombre"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Cambiar el rol de alguien: solo un admin, y nunca quitarse a sí mismo
create function public.cambiar_rol(usuario uuid, nuevo_rol public.rol_usuario)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.es_admin()) then
    raise exception 'Solo un administrador puede cambiar roles' using errcode = '42501';
  end if;
  if usuario = (select auth.uid()) and nuevo_rol <> 'admin' then
    raise exception 'No puedes quitarte a ti mismo el rol de administrador' using errcode = '42501';
  end if;
  update public.profiles set role = nuevo_rol where id = usuario;
  if not found then
    raise exception 'Ese usuario no existe' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.cambiar_rol(uuid, public.rol_usuario) from public, anon;
grant execute on function public.cambiar_rol(uuid, public.rol_usuario) to authenticated;

-- 4) Clientes ---------------------------------------------------------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 200),
  nit_rut text check (char_length(nit_rut) <= 30),
  contact_name text check (char_length(contact_name) <= 120),
  phone text check (char_length(phone) <= 30),
  email text check (char_length(email) <= 200),
  address text check (char_length(address) <= 300),
  notes text check (char_length(notes) <= 2000),
  photo_url text,
  rut_doc_url text,
  camara_comercio_url text,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.clients is 'Clientes de Three Lions, con sus documentos (RUT, Cámara de Comercio).';

create index clients_name_idx on public.clients (lower(name));
create index clients_nit_rut_idx on public.clients (nit_rut);
create index clients_created_by_idx on public.clients (created_by);

create trigger clients_updated_at
  before update on public.clients
  for each row execute function private.tocar_updated_at();

alter table public.clients enable row level security;

create policy "clientes: el equipo los ve"
  on public.clients for select to authenticated
  using ((select private.es_equipo()));

create policy "clientes: el equipo los crea"
  on public.clients for insert to authenticated
  with check ((select private.es_equipo()) and created_by = (select auth.uid()));

create policy "clientes: el equipo los edita"
  on public.clients for update to authenticated
  using ((select private.es_equipo()))
  with check ((select private.es_equipo()));

create policy "clientes: solo el admin los borra"
  on public.clients for delete to authenticated
  using ((select private.es_admin()));

-- 5) Interacciones (llamadas, reuniones, correos) -----------------------
create table public.interactions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete restrict,
  type public.tipo_interaccion not null,
  note text not null default '' check (char_length(note) <= 4000),
  date timestamptz not null default now(),
  created_at timestamptz not null default now()
);
comment on table public.interactions is 'Historial de llamadas, reuniones y correos con cada cliente.';

create index interactions_client_id_idx on public.interactions (client_id);
create index interactions_user_id_idx on public.interactions (user_id);

alter table public.interactions enable row level security;

create policy "interacciones: el equipo las ve"
  on public.interactions for select to authenticated
  using ((select private.es_equipo()));

create policy "interacciones: el equipo las registra a su nombre"
  on public.interactions for insert to authenticated
  with check ((select private.es_equipo()) and user_id = (select auth.uid()));

create policy "interacciones: quien la creó o el admin la edita"
  on public.interactions for update to authenticated
  using ((select private.es_equipo()) and (user_id = (select auth.uid()) or (select private.es_admin())))
  with check ((select private.es_equipo()) and (user_id = (select auth.uid()) or (select private.es_admin())));

create policy "interacciones: quien la creó o el admin la borra"
  on public.interactions for delete to authenticated
  using ((select private.es_equipo()) and (user_id = (select auth.uid()) or (select private.es_admin())));

-- 6) Productos (catálogo) ----------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 200),
  sku text not null unique check (char_length(btrim(sku)) between 1 and 60),
  category public.categoria_producto not null,
  price numeric(12, 2) not null default 0 check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  photo_url text,
  description text check (char_length(description) <= 2000),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.products is 'Catálogo: plumillas, llantas y baterías con precio y stock.';

create index products_category_idx on public.products (category);

create trigger products_updated_at
  before update on public.products
  for each row execute function private.tocar_updated_at();

alter table public.products enable row level security;

create policy "productos: el equipo los ve"
  on public.products for select to authenticated
  using ((select private.es_equipo()));

create policy "productos: solo el admin los crea"
  on public.products for insert to authenticated
  with check ((select private.es_admin()));

create policy "productos: solo el admin los edita"
  on public.products for update to authenticated
  using ((select private.es_admin()))
  with check ((select private.es_admin()));

create policy "productos: solo el admin los borra"
  on public.products for delete to authenticated
  using ((select private.es_admin()));

-- 7) Pedidos y su detalle -----------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number bigint generated always as identity unique,
  client_id uuid not null references public.clients (id) on delete restrict,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete restrict,
  status public.estado_pedido not null default 'borrador',
  total numeric(14, 2) not null default 0 check (total >= 0),
  notes text check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.orders is 'Pedidos: borrador → enviado → completado. El total lo calcula la base de datos.';

create index orders_client_id_idx on public.orders (client_id);
create index orders_user_id_idx on public.orders (user_id);

create trigger orders_updated_at
  before update on public.orders
  for each row execute function private.tocar_updated_at();

alter table public.orders enable row level security;

create policy "pedidos: el equipo los ve"
  on public.orders for select to authenticated
  using ((select private.es_equipo()));

create policy "pedidos: el equipo los crea en borrador a su nombre"
  on public.orders for insert to authenticated
  with check ((select private.es_equipo()) and user_id = (select auth.uid()) and status = 'borrador');

create policy "pedidos: quien lo creó o el admin lo edita"
  on public.orders for update to authenticated
  using ((select private.es_equipo()) and (user_id = (select auth.uid()) or (select private.es_admin())))
  with check ((select private.es_equipo()) and (user_id = (select auth.uid()) or (select private.es_admin())));

create policy "pedidos: solo se borran en borrador (quien lo creó o el admin)"
  on public.orders for delete to authenticated
  using (
    (select private.es_equipo())
    and status = 'borrador'
    and (user_id = (select auth.uid()) or (select private.es_admin()))
  );

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  quantity integer not null check (quantity > 0 and quantity <= 100000),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  subtotal numeric(14, 2) generated always as (quantity * unit_price) stored,
  unique (order_id, product_id)
);
comment on table public.order_items is 'Productos de cada pedido. El precio sale del catálogo, no del usuario.';

create index order_items_product_id_idx on public.order_items (product_id);

-- ¿Quien consulta puede modificar los productos de este pedido?
create function private.puede_editar_pedido(pedido uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.es_equipo())
     and exists (
       select 1 from public.orders o
       where o.id = pedido
         and o.status = 'borrador'
         and (o.user_id = (select auth.uid()) or (select private.es_admin()))
     );
$$;

revoke all on function private.puede_editar_pedido(uuid) from public;
grant execute on function private.puede_editar_pedido(uuid) to authenticated;

alter table public.order_items enable row level security;

create policy "detalle de pedidos: el equipo lo ve"
  on public.order_items for select to authenticated
  using ((select private.es_equipo()));

create policy "detalle de pedidos: se agrega a pedidos en borrador propios"
  on public.order_items for insert to authenticated
  with check ((select private.puede_editar_pedido(order_id)));

create policy "detalle de pedidos: se cambia en pedidos en borrador propios"
  on public.order_items for update to authenticated
  using ((select private.puede_editar_pedido(order_id)))
  with check ((select private.puede_editar_pedido(order_id)));

create policy "detalle de pedidos: se quita de pedidos en borrador propios"
  on public.order_items for delete to authenticated
  using ((select private.puede_editar_pedido(order_id)));

-- El precio unitario siempre sale del catálogo
create function private.precio_desde_catalogo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select p.price into new.unit_price from public.products p where p.id = new.product_id;
  if new.unit_price is null then
    raise exception 'Ese producto no existe' using errcode = 'P0002';
  end if;
  return new;
end;
$$;

create trigger order_items_precio
  before insert on public.order_items
  for each row execute function private.precio_desde_catalogo();

-- El total del pedido se recalcula cada vez que cambia su detalle
create function private.recalcular_total()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  pedido uuid;
begin
  if tg_op = 'DELETE' then
    pedido := old.order_id;
  else
    pedido := new.order_id;
  end if;
  update public.orders o
     set total = coalesce((select sum(i.subtotal) from public.order_items i where i.order_id = pedido), 0)
   where o.id = pedido;
  return null;
end;
$$;

create trigger order_items_total
  after insert or update or delete on public.order_items
  for each row execute function private.recalcular_total();

-- 8) Citas (agenda) -------------------------------------------------------
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients (id) on delete set null,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete restrict,
  title text not null check (char_length(btrim(title)) between 1 and 200),
  start_at timestamptz not null,
  end_at timestamptz not null,
  notes text check (char_length(notes) <= 2000),
  cancelled boolean not null default false,
  google_event_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointments_fin_despues_de_inicio check (end_at > start_at)
);
comment on table public.appointments is 'Citas de la agenda (lunes a sábado en el calendario).';

create index appointments_user_id_idx on public.appointments (user_id);
create index appointments_client_id_idx on public.appointments (client_id);
create index appointments_start_at_idx on public.appointments (start_at);

create trigger appointments_updated_at
  before update on public.appointments
  for each row execute function private.tocar_updated_at();

alter table public.appointments enable row level security;

create policy "citas: el equipo las ve"
  on public.appointments for select to authenticated
  using ((select private.es_equipo()));

create policy "citas: cada uno agenda las suyas; el admin, las de cualquiera"
  on public.appointments for insert to authenticated
  with check ((select private.es_equipo()) and (user_id = (select auth.uid()) or (select private.es_admin())));

create policy "citas: el responsable o el admin las edita"
  on public.appointments for update to authenticated
  using ((select private.es_equipo()) and (user_id = (select auth.uid()) or (select private.es_admin())))
  with check ((select private.es_equipo()) and (user_id = (select auth.uid()) or (select private.es_admin())));

create policy "citas: el responsable o el admin las borra"
  on public.appointments for delete to authenticated
  using ((select private.es_equipo()) and (user_id = (select auth.uid()) or (select private.es_admin())));

-- 9) Privilegios por columna -------------------------------------------
-- Sin sesión (anon) no se toca nada. Con sesión, solo las columnas que el
-- usuario puede escribir; el resto (dueño, totales, precios, fechas) lo
-- pone la base de datos.
revoke all on
  public.profiles, public.clients, public.interactions, public.products,
  public.orders, public.order_items, public.appointments
from anon;

revoke insert, update, truncate, references, trigger on
  public.profiles, public.clients, public.interactions, public.products,
  public.orders, public.order_items, public.appointments
from authenticated;

grant update (name) on public.profiles to authenticated;

grant insert (name, nit_rut, contact_name, phone, email, address, notes, photo_url, rut_doc_url, camara_comercio_url)
  on public.clients to authenticated;
grant update (name, nit_rut, contact_name, phone, email, address, notes, photo_url, rut_doc_url, camara_comercio_url)
  on public.clients to authenticated;

grant insert (client_id, type, note, date) on public.interactions to authenticated;
grant update (type, note, date) on public.interactions to authenticated;

grant insert (name, sku, category, price, stock, photo_url, description, active) on public.products to authenticated;
grant update (name, sku, category, price, stock, photo_url, description, active) on public.products to authenticated;

grant insert (client_id, notes) on public.orders to authenticated;
grant update (client_id, status, notes) on public.orders to authenticated;

grant insert (order_id, product_id, quantity) on public.order_items to authenticated;
grant update (quantity) on public.order_items to authenticated;

grant insert (client_id, user_id, title, start_at, end_at, notes) on public.appointments to authenticated;
grant update (client_id, user_id, title, start_at, end_at, notes, cancelled) on public.appointments to authenticated;
