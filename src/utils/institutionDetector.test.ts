import { describe, expect, it } from 'vitest';
import { detectInstitution, getAllInstitutions, getInstitutionById } from './institutionDetector';

describe('detectInstitution', () => {
  it.each([
    ['carabineros', 'carabineros'],
    ['Carabineros de Chile', 'carabineros'],
    ['pdi', 'pdi'],
    ['Policía de Investigaciones', 'pdi'],
    ['colegio médico', 'colegio_medico'],
    ['caja araucana', 'caja_araucana'],
  ])('"%s" se detecta como %s', (term, id) => {
    const r = detectInstitution(term);
    expect(r.isInstitution).toBe(true);
    expect(r.institution?.id).toBe(id);
    expect(r.confidence).toBeGreaterThanOrEqual(70);
  });

  it.each(['juan perez', '12345678-9', 'acme ltda'])('"%s" no es una institución', (term) => {
    expect(detectInstitution(term).isInstitution).toBe(false);
  });

  it('términos de menos de 3 caracteres no se evalúan', () => {
    expect(detectInstitution('pd')).toEqual({ isInstitution: false, confidence: 0 });
    expect(detectInstitution('   ')).toEqual({ isInstitution: false, confidence: 0 });
  });

  it('ignora acentos y mayúsculas', () => {
    expect(detectInstitution('COLEGIO MEDICO').institution?.id).toBe('colegio_medico');
  });
});

describe('catálogo de instituciones', () => {
  it('getAllInstitutions devuelve una copia y los ids son únicos', () => {
    const all = getAllInstitutions();
    all.pop();
    expect(getAllInstitutions().length).toBeGreaterThan(all.length);
    const ids = getAllInstitutions().map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('getInstitutionById encuentra y devuelve undefined si no existe', () => {
    expect(getInstitutionById('pdi')?.name).toBe('PDI');
    expect(getInstitutionById('no-existe')).toBeUndefined();
  });
});
