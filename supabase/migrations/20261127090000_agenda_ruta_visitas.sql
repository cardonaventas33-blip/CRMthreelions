-- Agenda como ruta de visitas (como la referencia del dueño):
-- tipo de visita, sede visitada, visita hecha, zona de la sede, cliente importante y resumen de compras.

-- 1) Tipo de visita, sede visitada y cuándo se hizo la visita
alter table public.appointments
  add column kind text not null default 'planificacion'
    check (kind in ('planificacion', 'no_planeada', 'seguimiento', 'cobro', 'personal')),
  add column site_id uuid references public.client_sites (id) on delete set null,
  add column completed_at timestamptz;
comment on column public.appointments.kind is
  'Tipo: planificacion (inicial), no_planeada, seguimiento, cobro (compromiso de pago) o personal (tu calendario).';
comment on column public.appointments.completed_at is 'Cuándo se hizo la visita (botón Iniciar visita). Vacío = todavía no.';
create index appointments_site_id_idx on public.appointments (site_id);
grant insert (kind, site_id), update (kind, site_id, completed_at) on public.appointments to authenticated;

-- La sede elegida debe ser del cliente de la cita
create function private.validar_sede_cita() returns trigger
  language plpgsql
  set search_path = ''
as $$
begin
  if new.site_id is not null and not exists (
    select 1 from public.client_sites s where s.id = new.site_id and s.client_id = new.client_id
  ) then
    raise exception 'Esa sede no es del cliente de la cita' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger appointments_validar_sede
  before insert or update of site_id, client_id on public.appointments
  for each row execute function private.validar_sede_cita();

-- 2) Zona de cada sede (para mostrar "CALI - NORTE")
alter table public.client_sites
  add column zone text check (zone in ('norte', 'sur', 'oriente', 'occidente', 'centro'));
grant insert (zone), update (zone) on public.client_sites to authenticated;

-- 3) Cliente importante (estrella): solo el administrador lo marca
alter table public.clients add column is_key boolean not null default false;
comment on column public.clients.is_key is 'Cliente importante (estrella en la agenda). Solo lo cambia un administrador.';
grant update (is_key) on public.clients to authenticated;

create function private.solo_admin_marca_importante() returns trigger
  language plpgsql
  set search_path = ''
as $$
begin
  if new.is_key is distinct from old.is_key and not (select private.es_admin()) then
    raise exception 'Solo un administrador marca clientes importantes' using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger clients_solo_admin_importante
  before update of is_key on public.clients
  for each row execute function private.solo_admin_marca_importante();

-- 4) "Visita" como tipo de interacción (lo que se anota al hacer la visita)
alter type public.tipo_interaccion add value if not exists 'visita';

-- 5) Resumen de compras por cliente (pedidos enviados o completados).
--    frecuencia_dias = promedio de días entre una compra y la siguiente (vacío si solo hay una compra).
create view public.client_purchase_stats
  with (security_invoker = true)
as
with compras as (
  select o.client_id, o.id, o.created_at, o.total,
         lag(o.created_at) over (partition by o.client_id order by o.created_at) as anterior
  from public.orders o
  where o.status in ('enviado', 'completado')
)
select client_id,
       count(*)::int as compras,
       max(created_at) as ultima_compra,
       (array_agg(total order by created_at desc))[1] as ultimo_total,
       (array_agg(id order by created_at desc))[1] as ultimo_pedido,
       round(avg(total)) as promedio,
       round(avg(extract(epoch from (created_at - anterior)) / 86400))::int as frecuencia_dias
from compras
group by client_id;
comment on view public.client_purchase_stats is 'Compras de cada cliente: cuántas, la última, el promedio y cada cuántos días compra.';
grant select on public.client_purchase_stats to authenticated;
