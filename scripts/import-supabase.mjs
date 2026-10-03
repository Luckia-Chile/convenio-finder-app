// Importa el export de la nube a la instancia on-premise.
// Requisito: ya ejecutaste supabase/onprem/001_schema_hardened.sql en el SQL Editor.
// Uso (PowerShell):
//   $env:SUPABASE_URL="http://convenios.intranet.arica"
//   $env:SUPABASE_SERVICE_ROLE_KEY="<SERVICE_ROLE_KEY de la instancia NUEVA>"
//   node scripts/import-supabase.mjs [carpeta_export]
// Si no indicas carpeta usa la más reciente de db_exports/ que tenga beneficiarios.json.
// Es idempotente: si beneficiarios ya tiene filas, aborta (usa --force para vaciar y reimportar).
import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const force = process.argv.includes('--force');
const dirArg = process.argv.slice(2).find((a) => !a.startsWith('--'));

const dir =
  dirArg ??
  `db_exports/${readdirSync('db_exports')
    .filter((d) => existsSync(`db_exports/${d}/beneficiarios.json`))
    .sort()
    .pop()}`;
console.log(`Importando desde ${dir} hacia ${SUPABASE_URL}`);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const read = (f) => JSON.parse(readFileSync(`${dir}/${f}`, 'utf8'));

// ---------------------------------------------------------------- usuarios
const authUsers = read('auth_users.json');
const profiles = read('profiles.json');
const profileById = new Map(profiles.map((p) => [p.id, p]));

const { data: existing, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
if (listErr) throw new Error(`No se pudo conectar a Auth: ${listErr.message}`);
const existingByEmail = new Map(existing.users.map((u) => [u.email?.toLowerCase(), u]));

const credentials = [['email', 'rol', 'password_temporal']];
for (const u of authUsers) {
  const email = u.email?.toLowerCase();
  const old = profileById.get(u.id);
  const role = old?.role ?? 'consultor';
  let target = existingByEmail.get(email);
  if (!target) {
    const password = randomBytes(9).toString('base64url') + 'aA1';
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: old?.full_name ?? u.user_metadata?.full_name ?? '' },
    });
    if (error) throw new Error(`createUser ${email}: ${error.message}`);
    target = data.user;
    credentials.push([email, role, password]);
  }
  // El trigger handle_new_user ya creó el perfil como 'consultor'; aquí restauramos rol y nombre.
  const { error: pErr } = await supabase
    .from('profiles')
    .update({ role, full_name: old?.full_name ?? '' })
    .eq('id', target.id);
  if (pErr) throw new Error(`profile ${email}: ${pErr.message}`);
}
if (credentials.length > 1) {
  const f = `${dir}/NUEVAS_credenciales_temporales.csv`;
  writeFileSync(f, credentials.map((r) => r.join(',')).join('\n'));
  console.log(`- usuarios: ${credentials.length - 1} creados. Contraseñas temporales en ${f} (no se imprimen)`);
} else {
  console.log('- usuarios: ya existían todos');
}

// ----------------------------------------------------------- beneficiarios
const rows = read('beneficiarios.json');
const { count: before, error: cErr } = await supabase
  .from('beneficiarios')
  .select('*', { count: 'exact', head: true });
if (cErr || before === null) throw new Error(`beneficiarios inaccesible: ${cErr?.message ?? 'ejecuta primero el SQL del esquema'}`);

if (before > 0 && !force) {
  console.error(`beneficiarios ya tiene ${before} filas. Usa --force para vaciar y reimportar.`);
  process.exit(1);
}
if (before > 0) {
  const { error } = await supabase.from('beneficiarios').delete().not('id', 'is', null);
  if (error) throw new Error(`vaciar beneficiarios: ${error.message}`);
}

const BATCH = 1000;
for (let i = 0; i < rows.length; i += BATCH) {
  const { error } = await supabase.from('beneficiarios').insert(rows.slice(i, i + BATCH)); // conserva id y created_at
  if (error) throw new Error(`lote ${i / BATCH + 1}: ${error.message}`);
}

const { count: after } = await supabase.from('beneficiarios').select('*', { count: 'exact', head: true });
console.log(`- beneficiarios: ${after}/${rows.length} ${after === rows.length ? 'OK' : '¡NO COINCIDE!'}`);
const { data: roles } = await supabase.from('profiles').select('role');
console.log('- perfiles por rol:', roles.reduce((a, r) => ((a[r.role] = (a[r.role] || 0) + 1), a), {}));
process.exit(after === rows.length ? 0 : 1);
