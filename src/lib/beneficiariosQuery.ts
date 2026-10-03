export type SearchType = 'rut' | 'nombre' | 'empresa' | 'general' | string;

// Escapa los comodines de LIKE para que '%' y '_' del usuario se busquen literalmente.
const escapeLike = (s: string) => s.replace(/[\\%_]/g, '\\$&');

// Dentro de .or() PostgREST separa por comas y paréntesis; entrecomillar el valor evita
// que el texto del usuario inyecte filtros adicionales.
const quote = (s: string) => `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

// En la carga de Excel el RUT se guarda sin puntos, guion ni espacios.
const normalizeRut = (s: string) => s.replace(/[.\-\s]/g, '');

/**
 * Aplica el filtro de búsqueda de beneficiarios de forma segura.
 * Compartido por la búsqueda inicial y por "cargar más".
 */
export const applyBeneficiariosFilter = <Q extends { ilike: Function; or: Function }>(
  query: Q,
  searchTerm: string | undefined,
  searchType: SearchType
): Q => {
  const term = searchTerm?.trim();
  if (!term) return query;

  const like = (value: string) => `%${escapeLike(value)}%`;

  switch (searchType) {
    case 'rut':
      return query.ilike('rut', like(normalizeRut(term)));
    case 'nombre': {
      const p = quote(like(term));
      return query.or(`nombre.ilike.${p},apellido.ilike.${p}`);
    }
    case 'empresa':
      return query.ilike('empresa', like(term));
    default: {
      const p = quote(like(term));
      return query.or(`rut.ilike.${p},nombre.ilike.${p},apellido.ilike.${p},empresa.ilike.${p}`);
    }
  }
};
