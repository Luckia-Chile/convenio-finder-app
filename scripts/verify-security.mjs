// Verifica contra la instancia REAL que los permisos se cumplen en la base de datos
// (no solo en la interfaz): anónimo, consultor, admin no-super y super admin.
//
// Uso (PowerShell), desde la raíz del proyecto:
//   node scripts/verify-security.mjs --secrets db_exports/supabase-secrets.env
// o con variables: SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY (esta última solo para limpieza).
//
// Las credenciales de prueba se leen de NUEVAS_credenciales_temporales.csv (carpeta más reciente de db_exports).
// Si la contraseña de un usuario ya cambió, esa sección se marca SKIP (no falla).
//
// Seguridad de la prueba: ninguna llamada borra ni reemplaza beneficiarios (replace_beneficiarios se invoca
// con una lista vacía, que se rechaza antes de tocar datos). Si un intento de escalada tuviera éxito,
// se revierte con la service_role y la prueba queda en FAIL.
import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const arg = (n) => {
  const i = process.argv.indexOf(n);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const env = { ...process.env };
const secretsPath = arg('--secrets');
if (secretsPath) {
  for (const l of readFileSync(secretsPath, 'utf8').split(/\r?\n/)) {
    const i = l.indexOf('=');
    if (i > 0) env[l.slice(0, i)] = l.slice(i + 1);
  }
}
const URL = env.SUPABASE_URL ?? arg('--url') ?? 'http://convenios.intranet.arica';
const ANON = env.SUPABASE_ANON_KEY ?? env.ANON_KEY;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY ?? env.SERVICE_ROLE_KEY;
if (!ANON || !SERVICE) {
  console.error('Faltan ANON_KEY y/o SERVICE_ROLE_KEY (usa --secrets <archivo>)');
  process.exit(2);
}

const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(URL, SERVICE, opts);
const clientFor = () => createClient(URL, ANON, opts);

// ---- credenciales de prueba
const exportsDir = readdirSync('db_exports')
  .filter((d) => existsSync(`db_exports/${d}/NUEVAS_credenciales_temporales.csv`))
  .sort()
  .pop();
const creds = Object.fromEntries(
  readFileSync(`db_exports/${exportsDir}/NUEVAS_credenciales_temporales.csv`, 'utf8')
    .split(/\r?\n/)
    .slice(1)
    .filter(Boolean)
    .map((l) => l.split(','))
    .map(([email, role, password]) => [email, { role, password }])
);

// ---- mini framework
const results = [];
const record = (status, name, detail = '') => {
  results.push(status);
  console.log(`  ${status === 'PASS' ? '✅' : status === 'SKIP' ? '⏭️ ' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
};
const expectDenied = (name, { error, data }, mustContain = 'No autorizado') => {
  if (error?.message?.includes('Could not find the function')) {
    return record('FAIL', name, 'la función no existe: ¿se aplicaron los SQL 002/003?');
  }
  if (error && error.message.includes(mustContain)) return record('PASS', name);
  record('FAIL', name, error ? `error inesperado: ${error.message}` : `NO fue denegado (respuesta: ${JSON.stringify(data)?.slice(0, 80)})`);
};

const signIn = async (email) => {
  const c = clientFor();
  const cred = creds[email];
  if (!cred) return { skip: 'no está en el CSV' };
  const { data, error } = await c.auth.signInWithPassword({ email, password: cred.password });
  if (error) return { skip: 'no se pudo iniciar sesión (¿cambió la contraseña?)' };
  return { client: c, id: data.user.id };
};

const ZERO_UUID = '00000000-0000-0000-0000-000000000001';
const PROBE_EMAIL = 'zz-verify-probe@invalid.local';
const cleanup = [];

try {
  console.log(`\nInstancia: ${URL}\n`);

  // ---------------------------------------------------------------- anónimo
  console.log('Anónimo (solo con la anon key)');
  {
    const c = clientFor();
    const sel = await c.from('beneficiarios').select('*', { count: 'exact', head: true });
    sel.error || (sel.count ?? 0) === 0
      ? record('PASS', 'no puede leer beneficiarios')
      : record('FAIL', 'no puede leer beneficiarios', `leyó ${sel.count} filas`);
    const ins = await c.from('security_audit_logs').insert({ action: 'FALSO' });
    ins.error ? record('PASS', 'no puede escribir en el log de auditoría') : record('FAIL', 'no puede escribir en el log de auditoría', 'insertó');
    const rpc = await c.rpc('log_security_event', { action_name: 'FALSO' });
    rpc.error ? record('PASS', 'no puede ejecutar log_security_event') : record('FAIL', 'no puede ejecutar log_security_event');
    const sa = await c.rpc('is_super_admin');
    sa.error || sa.data === false ? record('PASS', 'no es super admin') : record('FAIL', 'no es super admin');
  }

  // ------------------------------------------------- usuarios autenticados
  const deniedFunctions = async (label, client) => {
    expectDenied(`${label}: list_users_with_roles denegado`, await client.rpc('list_users_with_roles'));
    expectDenied(`${label}: set_user_role denegado`, await client.rpc('set_user_role', { target_user: ZERO_UUID, new_role: 'admin' }));
    expectDenied(`${label}: admin_reset_password denegado`, await client.rpc('admin_reset_password', { target_user: ZERO_UUID, new_password: 'ProbePass-1234' }));
    const create = await client.rpc('admin_create_user', { new_email: PROBE_EMAIL, new_password: 'ProbePass-1234', new_full_name: 'probe', new_role: 'consultor' });
    if (!create.error) cleanup.push({ type: 'user', id: create.data?.id });
    expectDenied(`${label}: admin_create_user denegado`, create);
  };

  // consultor
  const consultorEmail = ['a@a.cl', 'b@b.cl'].find((e) => creds[e]) ?? Object.keys(creds).find((e) => creds[e].role === 'consultor');
  console.log(`\nConsultor (${consultorEmail})`);
  {
    const s = await signIn(consultorEmail);
    if (s.skip) record('SKIP', 'sección completa', s.skip);
    else {
      const { client, id } = s;
      const cnt = await client.from('beneficiarios').select('*', { count: 'exact', head: true });
      !cnt.error && cnt.count > 0 ? record('PASS', 'puede buscar (leer) beneficiarios', `${cnt.count} filas`) : record('FAIL', 'puede buscar (leer) beneficiarios', cnt.error?.message);
      const ins = await client.from('beneficiarios').insert({ apellido: 'X', nombre: 'X', empresa: 'X' });
      ins.error ? record('PASS', 'no puede insertar beneficiarios') : (cleanup.push({ type: 'benef' }), record('FAIL', 'no puede insertar beneficiarios', 'insertó'));
      expectDenied('no puede reemplazar beneficiarios (replace_beneficiarios)', await client.rpc('replace_beneficiarios', { rows: [] }), 'Access denied');
      await deniedFunctions('consultor', client);

      const esc = await client.from('profiles').update({ role: 'admin' }).eq('id', id);
      const after = await admin.from('profiles').select('role').eq('id', id).single();
      if (after.data?.role === 'admin') {
        await admin.from('profiles').update({ role: 'consultor' }).eq('id', id);
        record('FAIL', 'no puede ascenderse a admin por la API', '¡SE ASCENDIÓ! (revertido)');
      } else {
        record('PASS', 'no puede ascenderse a admin por la API', esc.error?.message ?? 'sin efecto');
      }
    }
  }

  // admin que NO es super admin
  const plainAdmin = Object.keys(creds).find((e) => creds[e].role === 'admin' && !/^(mrmaibe|informatica\.arica)@cl\.luckia\.com$/.test(e));
  console.log(`\nAdmin sin gestión global (${plainAdmin ?? 'ninguno'})`);
  {
    const s = plainAdmin ? await signIn(plainAdmin) : { skip: 'no hay otro admin' };
    if (s.skip) record('SKIP', 'sección completa', s.skip);
    else {
      const { client } = s;
      const sa = await client.rpc('is_super_admin');
      !sa.error && sa.data === false ? record('PASS', 'no es super admin') : record('FAIL', 'no es super admin', JSON.stringify(sa.data ?? sa.error?.message));
      await deniedFunctions('admin', client);

      // El hueco histórico: un admin cambiando roles directo por la API.
      const target = consultorEmail && (await admin.from('profiles').select('id').eq('email', consultorEmail).single()).data?.id;
      if (target) {
        const esc = await client.from('profiles').update({ role: 'admin' }).eq('id', target);
        const after = await admin.from('profiles').select('role').eq('id', target).single();
        if (after.data?.role === 'admin') {
          await admin.from('profiles').update({ role: 'consultor' }).eq('id', target);
          record('FAIL', 'no puede cambiar el rol de otro por la API directa', '¡SE CAMBIÓ! (revertido) — falta aplicar 002');
        } else {
          record('PASS', 'no puede cambiar el rol de otro por la API directa', esc.error?.message ?? 'sin efecto');
        }
      }
    }
  }

  // super admin
  console.log('\nSuper admin (mrmaibe@cl.luckia.com)');
  {
    const s = await signIn('mrmaibe@cl.luckia.com');
    if (s.skip) record('SKIP', 'sección completa', s.skip);
    else {
      const { client, id } = s;
      const sa = await client.rpc('is_super_admin');
      !sa.error && sa.data === true ? record('PASS', 'is_super_admin = true') : record('FAIL', 'is_super_admin = true', JSON.stringify(sa.data ?? sa.error?.message));
      const list = await client.rpc('list_users_with_roles');
      !list.error && list.data?.length > 0 ? record('PASS', 'lista usuarios con sus roles', `${list.data.length} usuarios`) : record('FAIL', 'lista usuarios con sus roles', list.error?.message);
      const self = await client.rpc('set_user_role', { target_user: id, new_role: 'consultor' });
      expectDenied('no puede cambiar su propio rol', self, 'No puedes cambiar tu propio rol');

      // Ciclo completo: crear -> iniciar sesión con esa contraseña -> perfil -> limpiar
      const pw = 'ProbePass-1234';
      const created = await client.rpc('admin_create_user', { new_email: PROBE_EMAIL, new_password: pw, new_full_name: 'Probe', new_role: 'consultor' });
      if (created.error) {
        record('FAIL', 'crea un usuario con la contraseña indicada', created.error.message);
      } else {
        cleanup.push({ type: 'user', id: created.data.id });
        const login = await clientFor().auth.signInWithPassword({ email: PROBE_EMAIL, password: pw });
        !login.error ? record('PASS', 'el usuario creado inicia sesión con la contraseña asignada') : record('FAIL', 'el usuario creado inicia sesión con la contraseña asignada', login.error.message);
        const prof = await admin.from('profiles').select('role').eq('id', created.data.id).single();
        prof.data?.role === 'consultor' ? record('PASS', 'su perfil existe con rol consultor') : record('FAIL', 'su perfil existe con rol consultor', JSON.stringify(prof));
        const dup = await client.rpc('admin_create_user', { new_email: PROBE_EMAIL, new_password: pw });
        dup.error?.message.includes('Ya existe') ? record('PASS', 'rechaza correos duplicados') : record('FAIL', 'rechaza correos duplicados', dup.error?.message);
        const short = await client.rpc('admin_create_user', { new_email: 'zz-otro@invalid.local', new_password: '123' });
        short.error?.message.includes('al menos 8') ? record('PASS', 'rechaza contraseñas de menos de 8 caracteres') : (short.data?.id && cleanup.push({ type: 'user', id: short.data.id }), record('FAIL', 'rechaza contraseñas de menos de 8 caracteres', short.error?.message));

        const newPw = 'NuevaClave-5678';
        const shortReset = await client.rpc('admin_reset_password', { target_user: created.data.id, new_password: '123' });
        shortReset.error?.message.includes('al menos 8')
          ? record('PASS', 'restablecer rechaza contraseñas de menos de 8 caracteres')
          : record('FAIL', 'restablecer rechaza contraseñas de menos de 8 caracteres', shortReset.error?.message);
        const reset = await client.rpc('admin_reset_password', { target_user: created.data.id, new_password: newPw });
        if (reset.error) record('FAIL', 'restablece con la contraseña definida por el administrador', reset.error.message);
        else {
          const oldLogin = await clientFor().auth.signInWithPassword({ email: PROBE_EMAIL, password: pw });
          const newLogin = await clientFor().auth.signInWithPassword({ email: PROBE_EMAIL, password: newPw });
          oldLogin.error && !newLogin.error
            ? record('PASS', 'restablecer: la clave vieja deja de servir y la definida funciona')
            : record('FAIL', 'restablecer: la clave vieja deja de servir y la definida funciona', `vieja:${oldLogin.error ? 'rechazada' : 'AÚN SIRVE'} nueva:${newLogin.error ? 'rechazada' : 'ok'}`);
          reset.data?.password
            ? record('FAIL', 'la base no devuelve ni genera contraseñas')
            : record('PASS', 'la base no devuelve ni genera contraseñas');
        }
      }
    }
  }
} finally {
  // ---- limpieza (siempre)
  for (const item of cleanup) {
    if (item.type === 'user' && item.id) await admin.auth.admin.deleteUser(item.id);
    if (item.type === 'benef') await admin.from('beneficiarios').delete().eq('apellido', 'X').eq('nombre', 'X').eq('empresa', 'X');
  }
  const leftover = (await admin.auth.admin.listUsers({ perPage: 1000 })).data.users.filter((u) => u.email === PROBE_EMAIL);
  for (const u of leftover) await admin.auth.admin.deleteUser(u.id);
}

const n = (s) => results.filter((r) => r === s).length;
console.log(`\nResumen: ${n('PASS')} correctas, ${n('FAIL')} fallidas, ${n('SKIP')} omitidas`);
process.exit(n('FAIL') ? 1 : 0);
