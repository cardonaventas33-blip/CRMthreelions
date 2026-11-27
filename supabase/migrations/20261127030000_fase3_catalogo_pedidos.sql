-- =====================================================================
-- CRM Three Lions · Fase 3: catálogo y pedidos
-- Decisiones del dueño: cada medida es un producto (agrupados por línea),
-- los precios ya incluyen IVA, y al completar un pedido se descuenta el stock.
-- =====================================================================

-- 1) Productos: línea, medida y marca ----------------------------------
alter table public.products
  add column line text check (char_length(line) <= 120),
  add column size text check (char_length(size) <= 20),
  add column brand text check (char_length(brand) <= 60);

comment on column public.products.line is 'Línea del producto (ej.: Plumilla Siliconada); agrupa las medidas';
comment on column public.products.size is 'Medida (ej.: 16")';
comment on column public.products.price is 'Precio unitario con IVA incluido';
comment on column public.products.photo_url is 'Ruta en el almacén público "productos"';

create index products_line_idx on public.products (line);

grant insert (line, size, brand) on public.products to authenticated;
grant update (line, size, brand) on public.products to authenticated;

-- 2) Pedidos: estados en orden y pedidos completados que no se tocan -----
create function private.validar_pedido()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'completado' then
    raise exception 'Un pedido completado ya no se puede cambiar' using errcode = 'P0001';
  end if;

  if new.status is distinct from old.status then
    if not (
      (old.status = 'borrador' and new.status = 'enviado')
      or (old.status = 'enviado' and new.status in ('borrador', 'completado'))
    ) then
      raise exception 'Cambio de estado no permitido: de % a %', old.status, new.status using errcode = 'P0001';
    end if;
    if new.status = 'enviado' and not exists (select 1 from public.order_items i where i.order_id = new.id) then
      raise exception 'El pedido no tiene productos' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create trigger orders_validar
  before update on public.orders
  for each row execute function private.validar_pedido();

-- 3) Al completar un pedido se descuenta el stock -----------------------
create function private.descontar_stock()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  faltante record;
begin
  if new.status = 'completado' and old.status <> 'completado' then
    select p.sku, p.stock, i.quantity into faltante
      from public.order_items i
      join public.products p on p.id = i.product_id
     where i.order_id = new.id and p.stock < i.quantity
     limit 1;
    if found then
      raise exception 'Stock insuficiente de % (hay %, el pedido pide %)',
        faltante.sku, faltante.stock, faltante.quantity using errcode = 'P0001';
    end if;

    update public.products p
       set stock = p.stock - i.quantity
      from public.order_items i
     where i.order_id = new.id and p.id = i.product_id;
  end if;
  return new;
end;
$$;

create trigger orders_descontar_stock
  after update of status on public.orders
  for each row execute function private.descontar_stock();

-- 4) Fotos de productos: almacén público (son fotos de catálogo); solo el admin sube
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('productos', 'productos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "fotos de productos: el equipo las ve" on storage.objects
  for select to authenticated
  using (bucket_id = 'productos' and (select private.es_equipo()));

create policy "fotos de productos: solo el admin las sube" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'productos' and (select private.es_admin()));

create policy "fotos de productos: solo el admin las reemplaza" on storage.objects
  for update to authenticated
  using (bucket_id = 'productos' and (select private.es_admin()))
  with check (bucket_id = 'productos' and (select private.es_admin()));

create policy "fotos de productos: solo el admin las borra" on storage.objects
  for delete to authenticated
  using (bucket_id = 'productos' and (select private.es_admin()));
