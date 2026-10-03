-- Esquema consolidado y endurecido para la instancia Supabase on-premise.
-- Reemplaza a las migraciones históricas (que incluyen un DROP TABLE y funciones inseguras).
-- Orden de restauración: 1) este archivo, 2) importar auth.users, 3) importar profiles y beneficiarios.

create extension if not exists pg_trgm;

-- ---------------------------------------------------------------- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  full_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  role text not null default 'consultor' check (role in ('admin', 'consultor'))
);
create index if not exists idx_profiles_role on public.profiles(role);
alter table public.profiles enable row level security;

-- is_admin: search_path fijo para evitar secuestro de funciones.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.get_user_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role from public.profiles where id = auth.uid();
$$;

create policy "profiles_select_own_or_admin" on public.profiles
  for select to authenticated
  using (auth.uid() = id or public.is_admin());

-- El usuario solo puede editar su perfil; el cambio de rol lo bloquea el trigger de abajo.
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_update_admin" on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Sin policy de INSERT: los perfiles los crea solo el trigger handle_new_user.

-- Corrige la escalada de privilegios: nadie cambia 'role' salvo un admin
-- (auth.uid() is null = SQL directo / service_role, donde no hay sesión de usuario).
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'No autorizado para cambiar el rol';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger trg_protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''), 'consultor')
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------- beneficiarios
create table if not exists public.beneficiarios (
  id uuid primary key default gen_random_uuid(),
  apellido varchar(100) not null,
  nombre varchar(100) not null,
  rut varchar(20),
  empresa varchar(200) not null,
  created_at timestamptz default now()
);
create index if not exists idx_beneficiarios_rut on public.beneficiarios(rut) where rut is not null and rut <> '';
create index if not exists idx_beneficiarios_empresa on public.beneficiarios(empresa);
-- Trigram: acelera los ilike '%texto%' de la búsqueda.
create index if not exists idx_benef_nombre_trgm on public.beneficiarios using gin (nombre gin_trgm_ops);
create index if not exists idx_benef_apellido_trgm on public.beneficiarios using gin (apellido gin_trgm_ops);
create index if not exists idx_benef_empresa_trgm on public.beneficiarios using gin (empresa gin_trgm_ops);
create index if not exists idx_benef_rut_trgm on public.beneficiarios using gin (rut gin_trgm_ops);

alter table public.beneficiarios enable row level security;

create policy "beneficiarios_select_auth" on public.beneficiarios
  for select to authenticated using (true);
create policy "beneficiarios_insert_admin" on public.beneficiarios
  for insert to authenticated with check (public.is_admin());
create policy "beneficiarios_update_admin" on public.beneficiarios
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "beneficiarios_delete_admin" on public.beneficiarios
  for delete to authenticated using (public.is_admin());

-- ------------------------------------------------------------- auditoría
create table if not exists public.security_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  table_name text,
  details jsonb,
  ip_address inet,
  user_agent text,
  success boolean default true,
  created_at timestamptz default now()
);
create index if not exists idx_audit_user on public.security_audit_logs(user_id);
create index if not exists idx_audit_action on public.security_audit_logs(action);
create index if not exists idx_audit_created on public.security_audit_logs(created_at desc);
alter table public.security_audit_logs enable row level security;

create policy "audit_select_admin" on public.security_audit_logs
  for select to authenticated using (public.is_admin());
-- Sin policy de INSERT: solo se escribe vía log_security_event (SECURITY DEFINER).

create or replace function public.log_security_event(
  action_name text,
  table_name_param text default null,
  details_param jsonb default null,
  success_param boolean default true
) returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.security_audit_logs (user_id, action, table_name, details, success)
  values (auth.uid(), action_name, table_name_param, details_param, success_param);
exception when others then
  null;
end;
$$;
-- Solo triggers y funciones internas; no se expone a clientes (evita logs falsos).
revoke all on function public.log_security_event(text, text, jsonb, boolean) from public, anon, authenticated;

-- Triggers por sentencia: 1 fila de log por carga, no una por beneficiario.
create or replace function public.audit_benef_insert()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.log_security_event('INSERT_BENEFICIARIOS', 'beneficiarios',
    jsonb_build_object('inserted_count', (select count(*) from new_rows)));
  return null;
end; $$;
create or replace function public.audit_benef_delete()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public.log_security_event('DELETE_BENEFICIARIOS', 'beneficiarios',
    jsonb_build_object('deleted_count', (select count(*) from old_rows)));
  return null;
end; $$;
create trigger trg_audit_benef_insert after insert on public.beneficiarios
  referencing new table as new_rows for each statement execute function public.audit_benef_insert();
create trigger trg_audit_benef_delete after delete on public.beneficiarios
  referencing old table as old_rows for each statement execute function public.audit_benef_delete();

-- ----------------------------------------- carga atómica (reemplaza TRUNCATE+lotes)
-- Todo o nada: si algo falla, los datos anteriores se conservan.
create or replace function public.replace_beneficiarios(rows jsonb)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
set statement_timeout = '300s' -- el rol authenticated tiene ~8s por defecto
as $
declare
  n integer;
begin
  if not public.is_admin() then
    raise exception 'Access denied. Admin privileges required.';
  end if;
  if jsonb_typeof(rows) <> 'array' or jsonb_array_length(rows) = 0 then
    raise exception 'El listado está vacío; no se reemplazan los datos.';
  end if;

  delete from public.beneficiarios;
  insert into public.beneficiarios (apellido, nombre, rut, empresa)
  select r.apellido, r.nombre, nullif(r.rut, ''), r.empresa
  from jsonb_to_recordset(rows) as r(apellido text, nombre text, rut text, empresa text);

  get diagnostics n = row_count;
  return n;
end;
$$;

-- ----------------------------------------------------------------- grants
revoke all on all tables in schema public from anon;
revoke all on all functions in schema public from anon;
grant select, insert, update, delete on public.beneficiarios to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.security_audit_logs to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.get_user_role() to authenticated;
grant execute on function public.replace_beneficiarios(jsonb) to authenticated;
