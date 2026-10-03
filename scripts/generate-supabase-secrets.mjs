// Genera los secretos para Supabase self-hosted y los guarda en db_exports/supabase-secrets.env
// (carpeta ignorada por git). No imprime los valores en consola.
// Uso: node scripts/generate-supabase-secrets.mjs
import { randomBytes, createHmac } from 'node:crypto';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';

const out = 'db_exports/supabase-secrets.env';
if (existsSync(out)) {
  console.error(`${out} ya existe. Bórralo a propósito si quieres regenerar (invalidaría las claves anteriores).`);
  process.exit(1);
}

const hex = (bytes) => randomBytes(bytes).toString('hex');
const b64url = (b) => Buffer.from(b).toString('base64url');
const jwt = (payload, secret) => {
  const data = `${b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${b64url(JSON.stringify(payload))}`;
  return `${data}.${createHmac('sha256', secret).update(data).digest('base64url')}`;
};

const JWT_SECRET = hex(32); // 64 caracteres
const iat = Math.floor(Date.now() / 1000);
const exp = iat + 10 * 365 * 24 * 3600;

const lines = [
  `POSTGRES_PASSWORD=${hex(16)}`, // solo hex: sin caracteres que rompan URLs de conexión
  `JWT_SECRET=${JWT_SECRET}`,
  `ANON_KEY=${jwt({ role: 'anon', iss: 'supabase', iat, exp }, JWT_SECRET)}`,
  `SERVICE_ROLE_KEY=${jwt({ role: 'service_role', iss: 'supabase', iat, exp }, JWT_SECRET)}`,
  `DASHBOARD_USERNAME=admin_${hex(3)}`,
  `DASHBOARD_PASSWORD=${hex(12)}`,
  `SECRET_KEY_BASE=${hex(64)}`,
  `VAULT_ENC_KEY=${hex(16)}`, // exactamente 32 caracteres
  `PG_META_CRYPTO_KEY=${hex(16)}`,
  `LOGFLARE_PUBLIC_ACCESS_TOKEN=${hex(24)}`,
  `LOGFLARE_PRIVATE_ACCESS_TOKEN=${hex(24)}`,
  `S3_PROTOCOL_ACCESS_KEY_ID=${hex(16)}`,
  `S3_PROTOCOL_ACCESS_KEY_SECRET=${hex(32)}`,
  `POOLER_TENANT_ID=convenios`,
];

mkdirSync('db_exports', { recursive: true });
writeFileSync(out, lines.join('\n') + '\n');
console.log(`Secretos escritos en ${out}. Ábrelo, copia los valores a Easypanel y guárdalo en un gestor de contraseñas.`);
