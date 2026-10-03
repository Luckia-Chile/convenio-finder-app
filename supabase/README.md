# Base de datos

## Instancia on-premise (vigente): `onprem/`

Ejecutar **una vez, en orden**, en el SQL Editor de Studio:

1. `001_schema_hardened.sql` — tablas, RLS, auditoría, `replace_beneficiarios` (carga atómica).
2. `002_user_role_management.sql` — super admins, listado y cambio de roles.
3. `003_user_admin_functions.sql` — crear usuarios y restablecer contraseñas (re-ejecutable).

Los super admins se definen en la tabla `public.super_admins` (se edita solo por SQL, a propósito).

## `migrations/` — OBSOLETO, NO EJECUTAR

Son las migraciones históricas de la instancia en la nube (Lovable). Quedaron reemplazadas por `onprem/`.
Contienen sentencias peligrosas (`DROP TABLE ... CASCADE`, políticas que permitían escalar a admin,
un admin de prueba hardcodeado). Se conservan solo como referencia histórica.
