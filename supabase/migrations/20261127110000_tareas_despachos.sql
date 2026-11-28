-- Tareas del equipo y despachos de pedidos (pedido del dueño, 27-nov-2026)

-- 1) Tareas: qué hacer, fecha límite, prioridad, cliente (opcional), responsable y si ya se hizo
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 200),
  notes text check (char_length(notes) <= 2000),
  due_date date,
  priority text not null default 'media' check (priority in ('alta', 'media', 'baja')),
  client_id uuid references public.clients (id) on delete set null,
  assigned_to uuid not null default auth.uid() references public.profiles (id) on delete restrict,
  created_by uuid not null default auth.uid() references public.profiles (id) on delete restrict,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.tasks is 'Tareas del equipo. done_at vacío = pendiente.';
create index tasks_assigned_to_idx on public.tasks (assigned_to);
create index tasks_created_by_idx on public.tasks (created_by);
create index tasks_client_id_idx on public.tasks (client_id);
create index tasks_due_date_idx on public.tasks (due_date);
create trigger tasks_updated_at before update on public.tasks
  for each row execute function private.tocar_updated_at();

alter table public.tasks enable row level security;
grant select, delete on public.tasks to authenticated;
grant insert (title, notes, due_date, priority, client_id, assigned_to) on public.tasks to authenticated;
grant update (title, notes, due_date, priority, client_id, assigned_to, done_at) on public.tasks to authenticated;
grant select, insert, update, delete on public.tasks to service_role;

create policy "tareas: el equipo las ve" on public.tasks
  for select to authenticated using ((select private.es_equipo()));
create policy "tareas: cada uno se asigna las suyas; el admin, a cualquiera" on public.tasks
  for insert to authenticated
  with check (
    (select private.es_equipo())
    and created_by = (select auth.uid())
    and (assigned_to = (select auth.uid()) or (select private.es_admin()))
  );
create policy "tareas: el responsable, quien la creó o el admin la cambia" on public.tasks
  for update to authenticated
  using (
    (select private.es_equipo())
    and (assigned_to = (select auth.uid()) or created_by = (select auth.uid()) or (select private.es_admin()))
  )
  with check (
    (select private.es_equipo())
    and (assigned_to = (select auth.uid()) or created_by = (select auth.uid()) or (select private.es_admin()))
  );
create policy "tareas: quien la creó o el admin la borra" on public.tasks
  for delete to authenticated
  using ((select private.es_equipo()) and (created_by = (select auth.uid()) or (select private.es_admin())));

-- 2) Despachos: datos del envío de cada pedido.
--    Estado del despacho: enviado sin despachar = "Por despachar"; con dispatched_at = "Despachado";
--    completado = "Entregado" (al entregar se completa el pedido y se descuenta el stock).
alter table public.orders
  add column dispatched_at timestamptz,
  add column carrier text check (char_length(carrier) <= 80),
  add column tracking_number text check (char_length(tracking_number) <= 80),
  add column dispatch_notes text check (char_length(dispatch_notes) <= 1000),
  add column delivered_at timestamptz,
  add column received_by text check (char_length(received_by) <= 120);
comment on column public.orders.dispatched_at is 'Cuándo salió el pedido (despacho). Vacío = por despachar.';
comment on column public.orders.carrier is 'Transportadora o "Entrega propia".';
grant update (dispatched_at, carrier, tracking_number, dispatch_notes, delivered_at, received_by)
  on public.orders to authenticated;
create index orders_status_idx on public.orders (status);

create function private.validar_despacho() returns trigger
  language plpgsql
  set search_path = ''
as $$
begin
  if new.dispatched_at is not null and old.dispatched_at is null and new.status not in ('enviado', 'completado') then
    raise exception 'Solo se despachan pedidos enviados' using errcode = 'P0001';
  end if;
  if new.dispatched_at is not null and new.status = 'borrador' then
    raise exception 'Este pedido ya se despachó: primero deshaz el despacho para volverlo a borrador' using errcode = 'P0001';
  end if;
  if new.delivered_at is not null and new.status <> 'completado' then
    raise exception 'La entrega se registra al marcar el pedido como entregado' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create trigger orders_validar_despacho before update on public.orders
  for each row execute function private.validar_despacho();
