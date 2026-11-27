-- Catálogo con todas las categorías (las de IMCOVALLE, más plumillas y baterías de carro),
-- productos copiados de otra página (origen) y búsqueda sin tildes.

-- 1) Extensiones: quitar tildes y buscar rápido por pedazos de texto
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- 2) Categorías del catálogo. "family" agrupa para el tablero: llantas, baterías, plumillas u otros.
create table public.product_categories (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  family text not null default 'otros' check (family in ('llantas', 'baterias', 'plumillas', 'otros')),
  position integer not null default 1000
);
comment on table public.product_categories is
  'Categorías del catálogo. family agrupa las ventas del tablero (llantas, baterias, plumillas, otros).';

alter table public.product_categories enable row level security;
grant select, insert, update, delete on public.product_categories to authenticated;
grant select, insert, update, delete on public.product_categories to service_role;

create policy "categorias: el equipo las ve" on public.product_categories
  for select to authenticated using ((select private.es_equipo()));
create policy "categorias: solo el admin las crea" on public.product_categories
  for insert to authenticated with check ((select private.es_admin()));
create policy "categorias: solo el admin las edita" on public.product_categories
  for update to authenticated using ((select private.es_admin())) with check ((select private.es_admin()));
create policy "categorias: solo el admin las borra" on public.product_categories
  for delete to authenticated using ((select private.es_admin()));

insert into public.product_categories (slug, name, family, position) values
  ('plumillas', 'Plumillas', 'plumillas', 10),
  ('llantas-moto', 'Llantas de moto', 'llantas', 20),
  ('llantas-carro', 'Llantas de carro', 'llantas', 30),
  ('rines', 'Rines', 'otros', 40),
  ('baterias-moto', 'Baterías de moto', 'baterias', 50),
  ('baterias-carro', 'Baterías de carro', 'baterias', 60),
  ('aceites', 'Aceites', 'otros', 70),
  ('aditivos', 'Aditivos', 'otros', 80),
  ('kits-arrastre', 'Kits de arrastre', 'otros', 90),
  ('frenos', 'Frenos', 'otros', 100),
  ('amortiguadores', 'Amortiguadores', 'otros', 110),
  ('luces', 'Luces', 'otros', 120),
  ('repuestos-motor', 'Repuestos de motor', 'otros', 130),
  ('repuestos-honda', 'Repuestos Honda', 'otros', 140),
  ('accesorios', 'Accesorios', 'otros', 150),
  ('maleteros', 'Maleteros', 'otros', 160),
  ('en-tienda', 'Disponibles en tienda (Cali)', 'otros', 170),
  ('otros', 'Otros repuestos y accesorios', 'otros', 180);

-- 3) products.category deja de ser una lista fija y queda ligada a la tabla de categorías
alter table public.products alter column category type text using (
  case category::text
    when 'llantas' then 'llantas-moto'
    when 'baterias' then 'baterias-moto'
    else category::text
  end
);
alter table public.products
  add constraint products_category_fkey foreign key (category)
  references public.product_categories (slug) on update cascade on delete restrict;
drop type public.categoria_producto;

-- 4) Origen: productos copiados de otra página, para poder actualizarlos después.
--    Solo los escribe el copiador (clave secreta); la app no los cambia.
alter table public.products
  add column source text check (source in ('imcovalle')),
  add column source_id text check (char_length(source_id) <= 80),
  add constraint products_source_pair_check check ((source is null) = (source_id is null)),
  add constraint products_source_unique unique (source, source_id);
comment on column public.products.source is 'De dónde se copió el producto (por ejemplo imcovalle). Vacío si se creó a mano.';
comment on column public.products.source_id is 'Código del producto en la página de origen.';

-- 5) Foto: ruta del almacén "productos" o dirección https de la página de origen
alter table public.products
  add constraint products_photo_url_check
  check (photo_url is null or photo_url ~ '^https://' or position(':' in photo_url) = 0);

-- 6) Búsqueda sin tildes ni mayúsculas: "bateria" encuentra "Batería"
create function private.normalizar(texto text) returns text
  language sql immutable parallel safe
  set search_path = ''
  as $$ select lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(texto, ''))) $$;
grant usage on schema private to service_role;
grant execute on function private.normalizar(text) to authenticated, service_role;

alter table public.products
  add column search text generated always as (
    private.normalizar(
      name || ' ' || sku || ' ' || coalesce(line, '') || ' ' || coalesce(size, '') || ' ' || coalesce(brand, '')
    )
  ) stored;
comment on column public.products.search is 'Texto para buscar (sin tildes, en minúsculas). Se calcula solo.';
create index products_search_idx on public.products using gin (search extensions.gin_trgm_ops);
