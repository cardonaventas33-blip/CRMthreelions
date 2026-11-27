-- =====================================================================
-- CRM Three Lions · Fase 2
-- Clientes como en la referencia del dueño: datos de la empresa, estado,
-- plazo de pago, varias sedes, varios contactos y documentos (Cámara de
-- Comercio, RUT y Tratamiento de Datos) en un almacén privado.
-- =====================================================================

-- 1) Más datos de la empresa ------------------------------------------
create type public.estado_cliente as enum ('pendiente', 'validado', 'inactivo');

alter table public.clients
  add column trade_name text check (char_length(trade_name) <= 200),
  add column city text check (char_length(city) <= 80),
  add column business_type text check (char_length(business_type) <= 80),
  add column employees integer check (employees between 0 and 100000),
  add column payment_term_days smallint not null default 0
    check (payment_term_days in (0, 8, 15, 30, 45, 60, 90)),
  add column status public.estado_cliente not null default 'pendiente',
  add column tratamiento_datos_url text;

-- El contacto ahora vive en su propia tabla (varios por cliente)
alter table public.clients drop column contact_name;

comment on column public.clients.name is 'Razón social';
comment on column public.clients.trade_name is 'Nombre comercial';
comment on column public.clients.email is 'Correo de facturación';
comment on column public.clients.payment_term_days is 'Plazo de pago en días (0 = contado)';
comment on column public.clients.photo_url is 'Ruta en el almacén "clientes" (no es pública)';
comment on column public.clients.rut_doc_url is 'Ruta del RUT en el almacén "clientes"';
comment on column public.clients.camara_comercio_url is 'Ruta de la Cámara de Comercio en el almacén "clientes"';
comment on column public.clients.tratamiento_datos_url is 'Ruta de la autorización de tratamiento de datos';

-- Un NIT o cédula no se puede repetir
drop index if exists public.clients_nit_rut_idx;
create unique index clients_nit_rut_unico on public.clients (nit_rut)
  where nit_rut is not null and nit_rut <> '';
create index clients_trade_name_idx on public.clients (lower(trade_name));
create index clients_city_idx on public.clients (city);

grant insert (trade_name, city, business_type, employees, payment_term_days, status, tratamiento_datos_url)
  on public.clients to authenticated;
grant update (trade_name, city, business_type, employees, payment_term_days, status, tratamiento_datos_url)
  on public.clients to authenticated;

-- 2) Sedes ---------------------------------------------------------------
create table public.client_sites (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null default 'Sede principal' check (char_length(btrim(name)) between 1 and 120),
  address text not null check (char_length(btrim(address)) between 1 and 300),
  city text not null check (char_length(btrim(city)) between 1 and 80),
  traffic text check (char_length(traffic) <= 40),
  opens_at time,
  closes_at time,
  employees integer check (employees between 0 and 100000),
  square_meters integer check (square_meters between 0 and 10000000),
  notes text check (char_length(notes) <= 2000),
  service_days text[] not null default '{}',
  products text[] not null default '{}',
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.client_sites is 'Sedes (sucursales) de cada cliente.';

create index client_sites_client_id_idx on public.client_sites (client_id);

create trigger client_sites_updated_at
  before update on public.client_sites
  for each row execute function private.tocar_updated_at();

-- 3) Contactos -------------------------------------------------------------
create table public.client_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  site_id uuid references public.client_sites (id) on delete set null,
  first_name text not null check (char_length(btrim(first_name)) between 1 and 80),
  last_name text not null default '' check (char_length(last_name) <= 80),
  phone text check (char_length(phone) <= 30),
  email text check (char_length(email) <= 200),
  role_title text check (char_length(role_title) <= 60),
  receives_sales boolean not null default true,
  receives_collections boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.client_contacts is 'Personas de contacto de cada cliente (comercial y cartera).';
comment on column public.client_contacts.role_title is 'Cargo: propietario, administrador, comprador…';

create index client_contacts_client_id_idx on public.client_contacts (client_id);
create index client_contacts_site_id_idx on public.client_contacts (site_id);

create trigger client_contacts_updated_at
  before update on public.client_contacts
  for each row execute function private.tocar_updated_at();

-- La sede de un contacto debe ser del mismo cliente
create function private.sede_del_mismo_cliente()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.site_id is not null and not exists (
    select 1 from public.client_sites s where s.id = new.site_id and s.client_id = new.client_id
  ) then
    raise exception 'La sede no pertenece a este cliente' using errcode = '23503';
  end if;
  return new;
end;
$$;

create trigger client_contacts_sede_valida
  before insert or update of site_id, client_id on public.client_contacts
  for each row execute function private.sede_del_mismo_cliente();

-- 4) Permisos de sedes y contactos: el equipo los maneja -----------------
alter table public.client_sites enable row level security;
alter table public.client_contacts enable row level security;

create policy "sedes: el equipo las ve" on public.client_sites
  for select to authenticated using ((select private.es_equipo()));
create policy "sedes: el equipo las crea" on public.client_sites
  for insert to authenticated with check ((select private.es_equipo()));
create policy "sedes: el equipo las edita" on public.client_sites
  for update to authenticated using ((select private.es_equipo())) with check ((select private.es_equipo()));
create policy "sedes: el equipo las borra" on public.client_sites
  for delete to authenticated using ((select private.es_equipo()));

create policy "contactos: el equipo los ve" on public.client_contacts
  for select to authenticated using ((select private.es_equipo()));
create policy "contactos: el equipo los crea" on public.client_contacts
  for insert to authenticated with check ((select private.es_equipo()));
create policy "contactos: el equipo los edita" on public.client_contacts
  for update to authenticated using ((select private.es_equipo())) with check ((select private.es_equipo()));
create policy "contactos: el equipo los borra" on public.client_contacts
  for delete to authenticated using ((select private.es_equipo()));

revoke all on public.client_sites, public.client_contacts from anon;
grant select, insert, update, delete on public.client_sites, public.client_contacts to authenticated;
grant select, insert, update, delete on public.client_sites, public.client_contacts to service_role;

-- 5) Almacén privado de documentos y fotos ---------------------------------
-- Carpeta por cliente: <id del cliente>/<archivo>. Máximo 10 MB por archivo.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'clientes', 'clientes', false, 10485760,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do nothing;

-- La primera carpeta del archivo debe ser un cliente que exista
create function private.carpeta_de_cliente_valida(ruta text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.clients c
    where c.id::text = (storage.foldername(ruta))[1]
  );
$$;

revoke all on function private.carpeta_de_cliente_valida(text) from public;
grant execute on function private.carpeta_de_cliente_valida(text) to authenticated;

create policy "documentos de clientes: el equipo los ve" on storage.objects
  for select to authenticated
  using (bucket_id = 'clientes' and (select private.es_equipo()));

create policy "documentos de clientes: el equipo los sube" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'clientes'
    and (select private.es_equipo())
    and private.carpeta_de_cliente_valida(name)
  );

create policy "documentos de clientes: el equipo los reemplaza" on storage.objects
  for update to authenticated
  using (bucket_id = 'clientes' and (select private.es_equipo()))
  with check (
    bucket_id = 'clientes'
    and (select private.es_equipo())
    and private.carpeta_de_cliente_valida(name)
  );

create policy "documentos de clientes: el equipo los borra" on storage.objects
  for delete to authenticated
  using (bucket_id = 'clientes' and (select private.es_equipo()));
