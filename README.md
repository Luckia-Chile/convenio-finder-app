# Sistema de Convenios

Aplicación web para consultar beneficiarios de convenios y cargarlos masivamente desde Excel.
React + Vite + TypeScript + Tailwind/shadcn, sobre un Supabase self-hosted (on-premise).

## Puesta en marcha

```sh
npm install --legacy-peer-deps
cp .env.example .env.local      # completa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm run dev                     # http://localhost:8080
```

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción en `dist/` |
| `npm test` | Pruebas unitarias (Vitest) |
| `npm run lint` | ESLint |

## Roles y permisos

- **consultor:** busca beneficiarios.
- **admin:** además carga/reemplaza el Excel y administra instituciones.
- **super admin** (`public.super_admins`, solo si además son admin): crea usuarios, restablece contraseñas y cambia roles desde `/usuarios`.

La autorización real la aplican RLS y las funciones SQL; la interfaz solo oculta opciones.

## Base de datos

Ver [supabase/README.md](supabase/README.md). Resumen: ejecutar en orden `supabase/onprem/001`, `002` y `003`.

## Despliegue (Easypanel)

El `Dockerfile` compila la app y la sirve con nginx (cabeceras de seguridad y CSP incluidas).
Define como **Build args**: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. Las variables `VITE_*` quedan
incrustadas en el bundle: usa solo la anon key, **nunca** la `service_role`.

## Scripts de migración (`scripts/`)

`export-supabase.mjs`, `import-supabase.mjs` y `generate-supabase-secrets.mjs` mueven datos entre instancias.
Escriben en `db_exports/` (ignorada por git). Contienen datos personales: no los subas ni los compartas.
