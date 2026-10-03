// Exporta los datos de Supabase cloud a db_exports/ (carpeta ignorada por git).
// Uso (PowerShell):
//   $env:SUPABASE_URL="https://<ref>.supabase.co"
//   $env:SUPABASE_SERVICE_ROLE_KEY="<service_role key>"
//   node scripts/export-supabase.mjs
// La service_role omite RLS: no la pongas en el frontend ni la subas a git.
import { createClient } from '@supabase/supabase-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const PAGE = 1000; // límite por defecto de PostgREST
const outDir = `db_exports/${new Date().toISOString().replace(/[:.]/g, '-')}`;
mkdirSync(outDir, { recursive: true });

const csvCell = (v) => {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const toCsv = (rows) => {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  return [cols.join(','), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(','))].join('\n');
};

async function exportTable(table, orderBy = 'id') {
  const { count, error: cErr } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (cErr || count === null) {
    console.warn(`- ${table}: omitida (${cErr?.message ?? 'no existe o no es accesible'})`);
    return;
  }
  const rows = [];
  for (let from = 0; from < count; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order(orderBy, { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...data);
  }
  if (rows.length !== count) throw new Error(`${table}: se esperaban ${count} filas y se leyeron ${rows.length}`);
  const json = JSON.stringify(rows, null, 2);
  writeFileSync(`${outDir}/${table}.json`, json);
  writeFileSync(`${outDir}/${table}.csv`, '﻿' + toCsv(rows));
  const sha = createHash('sha256').update(json).digest('hex').slice(0, 16);
  console.log(`- ${table}: ${rows.length}/${count} filas  sha256:${sha}`);
}

async function exportAuthUsers() {
  const users = [];
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`auth.users: ${error.message}`);
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }
  writeFileSync(`${outDir}/auth_users.json`, JSON.stringify(users, null, 2));
  console.log(`- auth.users: ${users.length} usuarios (sin hash de contraseña; usa pg_dump para eso)`);
}

console.log(`Exportando a ${outDir}`);
await exportTable('beneficiarios');
await exportTable('profiles');
await exportTable('security_audit_logs');
await exportAuthUsers();
console.log('Listo. Compara los conteos con el panel de Supabase antes de dar de baja la instancia cloud.');
