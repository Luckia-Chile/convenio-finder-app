-- Crear usuarios y restablecer contraseñas desde la app, solo para super admins (is_super_admin()).
-- Ejecutar UNA vez en el SQL Editor, después de 002. Es seguro re-ejecutarlo (create or replace).
-- Requiere pgcrypto (en Supabase self-hosted vive en el schema "extensions").

-- Versión anterior (generaba la contraseña): se elimina para no dejar una sobrecarga.
drop function if exists public.admin_create_user(text, text, text);

create or replace function public.admin_create_user(
  new_email text,
  new_password text,
  new_full_name text default '',
  new_role text default 'consultor'
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions, pg_temp
as $$
declare
  uid uuid := gen_random_uuid();
  clean_email text := lower(btrim(new_email));
begin
  if not public.is_super_admin() then
    raise exception 'No autorizado';
  end if;
  if clean_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Correo inválido';
  end if;
  if new_role not in ('admin', 'consultor') then
    raise exception 'Rol inválido';
  end if;
  if new_password is null or length(new_password) < 8 then
    raise exception 'La contraseña debe tener al menos 8 caracteres';
  end if;
  if exists (select 1 from auth.users where lower(email) = clean_email) then
    raise exception 'Ya existe un usuario con ese correo';
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', clean_email,
    crypt(new_password, gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', coalesce(btrim(new_full_name), '')),
    now(), now(),
    '', '', '', '', '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), uid, uid::text,
    jsonb_build_object('sub', uid::text, 'email', clean_email, 'email_verified', true),
    'email', now(), now(), now()
  );

  -- handle_new_user ya creó el perfil como 'consultor'.
  if new_role = 'admin' then
    update public.profiles set role = 'admin' where id = uid;
  end if;

  perform public.log_security_event(
    'CREATE_USER', 'auth.users',
    jsonb_build_object('target_email', clean_email, 'role', new_role)
  );

  return jsonb_build_object('id', uid, 'email', clean_email);
end;
$$;
grant execute on function public.admin_create_user(text, text, text, text) to authenticated;

-- Versión anterior (generaba una contraseña aleatoria): se elimina para no dejar una sobrecarga.
drop function if exists public.admin_reset_password(uuid);

-- El administrador define la nueva contraseña; la base nunca genera contraseñas.
create or replace function public.admin_reset_password(target_user uuid, new_password text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions, pg_temp
as $$
declare
  target_email text;
begin
  if not public.is_super_admin() then
    raise exception 'No autorizado';
  end if;
  if new_password is null or length(new_password) < 8 then
    raise exception 'La contraseña debe tener al menos 8 caracteres';
  end if;

  select email into target_email from auth.users where id = target_user;
  if target_email is null then
    raise exception 'Usuario no encontrado';
  end if;

  update auth.users
     set encrypted_password = crypt(new_password, gen_salt('bf')),
         updated_at = now()
   where id = target_user;

  -- Cierra las sesiones abiertas del usuario (la contraseña anterior deja de servir de inmediato).
  delete from auth.sessions where user_id = target_user;

  perform public.log_security_event(
    'RESET_PASSWORD', 'auth.users',
    jsonb_build_object('target_email', target_email)
  );

  return jsonb_build_object('id', target_user, 'email', target_email);
end;
$$;
grant execute on function public.admin_reset_password(uuid, text) to authenticated;
