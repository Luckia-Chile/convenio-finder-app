Todo revisado en modo solo lectura; solo se ejecutaron consultas SELECT. Dos detalles: el SQL Editor de Supabase solo muestra el resultado de la última sentencia, así que uní tus 4 conteos en un solo SELECT con union all. Además, la grilla no mostraba todas las columnas, así que las agrupé por tabla. Los datos son los mismos.

1) Table Editor → beneficiarios: 15.792 registros.

2) Conteos

Consulta	role	Total
public.beneficiarios	—	15.792
public.profiles	—	11
auth.users	—	11
profiles por role	consultor	9
profiles por role	admin	2

3a) Columnas del esquema public (21 en total)

Tabla	#	Columna	Tipo
beneficiarios	1	id	uuid
	2	apellido	character varying
	3	nombre	character varying
	4	rut	character varying
	5	empresa	character varying
	6	created_at	timestamp with time zone
profiles	1	id	uuid
	2	email	text
	3	full_name	text
	4	created_at	timestamp with time zone
	5	updated_at	timestamp with time zone
	6	role	text
security_audit_logs	1	id	uuid
	2	user_id	uuid
	3	action	text
	4	table_name	text
	5	details	jsonb
	6	ip_address	inet
	7	user_agent	text
	8	success	boolean
	9	created_at	timestamp with time zone

3b) Políticas RLS (9). Todas son PERMISSIVE con roles = {public}. Omití la columna schemaname, que en todas es public.

Tabla	Política	cmd	qual (USING)	with_check
beneficiarios	Authenticated users can view beneficiarios	SELECT	auth.role() = 'authenticated'	NULL
beneficiarios	Only admins can delete beneficiarios	DELETE	auth.role() = 'authenticated' AND is_admin()	NULL
beneficiarios	Only admins can insert beneficiarios	INSERT	NULL	auth.role() = 'authenticated' AND is_admin()
beneficiarios	Only admins can update beneficiarios	UPDATE	auth.role() = 'authenticated' AND is_admin()	ídem
profiles	Los usuarios pueden actualizar su propio perfil	UPDATE	auth.uid() = id	NULL
profiles	Los usuarios pueden insertar su propio perfil	INSERT	NULL	auth.uid() = id
profiles	Los usuarios pueden ver su propio perfil	SELECT	auth.uid() = id	NULL
security_audit_logs	Only admins can view audit logs	SELECT	is_admin()	NULL
security_audit_logs	System can insert audit logs	INSERT	NULL	true

Encontré dos posibles problemas de seguridad en estas políticas. No toqué nada.

El UPDATE de profiles no tiene with_check ni restricción sobre role. Si is_admin() lee profiles.role, un consultor podría ponerse role = 'admin' a sí mismo.
El INSERT de security_audit_logs es true para public. Cualquiera, incluso un usuario anónimo con la anon key, podría insertar registros falsos en el log de auditoría.

4) Backups: no tienes ninguno. El proyecto está en el plan Free, que no incluye backups diarios ("Free Plan does not include project backups"). PITR tampoco está activo: es un add-on que exige plan Pro y parte en USD 100/mes. Con 15.792 registros sin respaldo, te recomiendo hacer un pg_dump manual periódico.

5) Connection string (URI directa):

postgresql://postgres:[YOUR-PASSWORD]@db.shakktuvnlioyxtzcjdn.supabase.co:5432/postgres

Supabase indica que la conexión directa usa IPv6 por defecto. Si tu red solo tiene IPv4, tendrías que usar el Session pooler.

Al ejecutar las consultas, el SQL Editor dejó una pestaña "Untitled query" con cambios sin guardar. No la guardé; puedes cerrarla sin problema.