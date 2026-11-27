-- El catálogo puede tener productos sin precio (precio 0): el dueño los pone después.
-- Un producto sin precio no se puede agregar a un pedido.
create or replace function private.precio_desde_catalogo()
  returns trigger
  language plpgsql
  security definer
  set search_path to ''
as $function$
declare
  v_nombre text;
begin
  select p.price, p.name into new.unit_price, v_nombre from public.products p where p.id = new.product_id;
  if new.unit_price is null then
    raise exception 'Ese producto no existe' using errcode = 'P0002';
  end if;
  if new.unit_price <= 0 then
    raise exception '% todavía no tiene precio. El administrador debe ponérselo en el catálogo.', v_nombre
      using errcode = 'P0001';
  end if;
  return new;
end;
$function$;
