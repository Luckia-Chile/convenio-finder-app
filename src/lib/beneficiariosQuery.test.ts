import { describe, expect, it } from 'vitest';
import { applyBeneficiariosFilter } from './beneficiariosQuery';

const makeQuery = () => {
  const calls: unknown[][] = [];
  const q: any = {
    ilike: (...a: unknown[]) => (calls.push(['ilike', ...a]), q),
    or: (...a: unknown[]) => (calls.push(['or', ...a]), q),
  };
  return { q, calls };
};

describe('applyBeneficiariosFilter', () => {
  it('no agrega filtros con un término vacío o solo espacios', () => {
    const { q, calls } = makeQuery();
    applyBeneficiariosFilter(q, '   ', 'general');
    applyBeneficiariosFilter(q, undefined, 'rut');
    expect(calls).toEqual([]);
  });

  it('RUT: quita puntos, guion y espacios porque en la base se guarda limpio', () => {
    const { q, calls } = makeQuery();
    applyBeneficiariosFilter(q, '12.345.678-k ', 'rut');
    expect(calls).toEqual([['ilike', 'rut', '%12345678k%']]);
  });

  it('empresa usa ilike sobre la columna empresa', () => {
    const { q, calls } = makeQuery();
    applyBeneficiariosFilter(q, 'Acme', 'empresa');
    expect(calls).toEqual([['ilike', 'empresa', '%Acme%']]);
  });

  it('nombre busca en nombre y apellido con el valor entrecomillado', () => {
    const { q, calls } = makeQuery();
    applyBeneficiariosFilter(q, 'juan', 'nombre');
    expect(calls).toEqual([['or', 'nombre.ilike."%juan%",apellido.ilike."%juan%"']]);
  });

  it('general busca en las cuatro columnas', () => {
    const { q, calls } = makeQuery();
    applyBeneficiariosFilter(q, 'x', 'general');
    expect(calls[0][1]).toBe('rut.ilike."%x%",nombre.ilike."%x%",apellido.ilike."%x%",empresa.ilike."%x%"');
  });

  it('una coma o paréntesis del usuario no inyecta filtros: queda dentro de las comillas', () => {
    const { q, calls } = makeQuery();
    applyBeneficiariosFilter(q, 'a,rut.neq.x)', 'nombre');
    expect(calls[0][1]).toBe('nombre.ilike."%a,rut.neq.x)%",apellido.ilike."%a,rut.neq.x)%"');
  });

  it('escapa las comillas del usuario para no cerrar el valor entrecomillado', () => {
    const { q, calls } = makeQuery();
    applyBeneficiariosFilter(q, 'a"b', 'nombre');
    expect(calls[0][1]).toBe('nombre.ilike."%a\\"b%",apellido.ilike."%a\\"b%"');
  });

  it('% y _ se buscan literalmente (se escapan para LIKE)', () => {
    const { q, calls } = makeQuery();
    applyBeneficiariosFilter(q, '50%_', 'empresa');
    expect(calls).toEqual([['ilike', 'empresa', '%50\\%\\_%']]);
  });
});
