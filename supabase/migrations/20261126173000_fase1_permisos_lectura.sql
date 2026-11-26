-- =====================================================================
-- CRM Three Lions · Fase 1 (ajuste)
-- En este proyecto, Supabase NO da permisos automáticos sobre las tablas
-- nuevas. Se dan aquí de forma explícita. Las reglas RLS siguen decidiendo
-- qué filas ve y cambia cada persona según su rol.
-- =====================================================================

-- Usuarios con sesión: leer (RLS filtra) y borrar donde RLS lo permita
grant select on
  public.profiles, public.clients, public.interactions, public.products,
  public.orders, public.order_items, public.appointments
to authenticated;

grant delete on
  public.clients, public.interactions, public.products,
  public.orders, public.order_items, public.appointments
to authenticated;

-- El servidor con la clave secreta (service_role) puede trabajar con todo
grant select, insert, update, delete on
  public.profiles, public.clients, public.interactions, public.products,
  public.orders, public.order_items, public.appointments
to service_role;
