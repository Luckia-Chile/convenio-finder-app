-- Gestión de roles de usuario, restringida a los "super administradores".
-- Ejecutar UNA vez en el SQL Editor, después de 001_schema_hardened.sql.
-- Para cambiar quién es super admin, edita public.super_admins desde SQL (no hay UI para eso a propósito).

create table if not exists public.super_admins (
  email text primary key
);
alter table public.super_admins enable row level security;
revoke all on public.super_admins from anon, authenticated; -- sin policies: solo las funciones definer la leen

insert into public.super_admins (email) values
  ('mrmaibe@cl.luckia.com'),
  ('informatica.arica@cl.luckia.com')
on conflict do nothing;

-- Super admin = correo en la lista Y rol 'admin' actual.
-- (informatica.arica verá la gestión recién cuando mrmaibe lo promueva a admin.)
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from auth.users u
    join public.super_admins s on lower(s.email) = lower(u.email)
    join public.profiles p on p.id = u.id
    where u.id = auth.uid() and p.role = 'admin'
  );
$$;
grant execute on function public.is_super_admin() to authenticated;

create or replace function public.list_users_with_roles()
returns table (
  id uuid,
  email text,
  full_name text,
  role text,
  is_super_admin boolean,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if not public.is_super_admin() then
    raise exception 'No autorizado';
  end if;
  return query
    select u.id,
           u.email::text,
           p.full_name,
           p.role,
           exists (select 1 from public.super_admins s where lower(s.email) = lower(u.email)),
           u.created_at,
           u.last_sign_in_at
    from auth.users u
    join public.profiles p on p.id = u.id
    order by lower(u.email);
end;
$$;
grant execute on function public.list_users_with_roles() to authenticated;

create or replace function public.set_user_role(target_user uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  target_email text;
  old_role text;
begin
  if not public.is_super_admin() then
    raise exception 'No autorizado';
  end if;
  if new_role not in ('admin', 'consultor') then
    raise exception 'Rol inválido';
  end if;
  if target_user = auth.uid() then
    raise exception 'No puedes cambiar tu propio rol';
  end if;

  select u.email, p.role into target_email, old_role
  from auth.users u join public.profiles p on p.id = u.id
  where u.id = target_user;
  if target_email is null then
    raise exception 'Usuario no encontrado';
  end if;
  if new_role <> 'admin'
     and exists (select 1 from public.super_admins s where lower(s.email) = lower(target_email)) then
    raise exception 'No se puede quitar el rol a un super administrador';
  end if;

  update public.profiles set role = new_role where id = target_user;

  perform public.log_security_event(
    'SET_USER_ROLE', 'profiles',
    jsonb_build_object('target_email', target_email, 'old_role', old_role, 'new_role', new_role)
  );
end;
$$;
grant execute on function public.set_user_role(uuid, text) to authenticated;

-- Cierra el hueco: antes cualquier admin podía cambiar 'role' por la API (policy profiles_update_admin).
-- Ahora solo un super admin (o SQL directo / service_role, donde auth.uid() es null).
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_super_admin() then
    raise exception 'No autorizado para cambiar el rol';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
