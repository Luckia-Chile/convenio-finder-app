// Valores de configuración y marca centralizados (antes estaban repetidos por el código).

export const BRAND = {
  name: 'Sistema de Convenios',
  company: 'Luckia',
  logo: '/Logo_Luckia.svg',
} as const;

// Resultados por página en la búsqueda de beneficiarios.
export const SEARCH_PAGE_SIZE = 200;

// Tamaño máximo recomendado del Excel; configurable con VITE_MAX_FILE_SIZE (bytes).
const envMax = Number(import.meta.env.VITE_MAX_FILE_SIZE);
export const MAX_UPLOAD_BYTES = Number.isFinite(envMax) && envMax > 0 ? envMax : 50 * 1024 * 1024;

// Empresas cuyas filas "SIN LISTADO" se ignoran al cargar el Excel.
export const COMPANIES_WITHOUT_LIST = ['ARICA COLLEGE'] as const;
