import { describe, expect, it } from 'vitest';
import { processExcelData } from './excelDataProcessor';

const row = (APELLIDO = '', NOMBRE = '', RUT = '', EMPRESA = '') => ({ APELLIDO, NOMBRE, RUT, EMPRESA });

describe('processExcelData', () => {
  it('normaliza el RUT: sin puntos ni guion y en mayúsculas', () => {
    const r = processExcelData([row('Pérez', 'Ana', '12.345.678-k', 'Acme')]);
    expect(r.validRows).toEqual([{ apellido: 'Pérez', nombre: 'Ana', rut: '12345678K', empresa: 'Acme' }]);
  });

  it('acepta filas sin RUT (beneficiarios con credencial) y recorta espacios', () => {
    const r = processExcelData([row('  Soto ', ' Luis ', '', ' Acme ')]);
    expect(r.validRows[0]).toMatchObject({ apellido: 'Soto', nombre: 'Luis', rut: '', empresa: 'Acme' });
  });

  it('descarta encabezados, filas vacías y observaciones con su motivo', () => {
    const r = processExcelData([
      row('APELLIDO', 'NOMBRE', 'RUT', 'EMPRESA'),
      row(),
      row('OBSERVACIONES', '', '', ''),
      row('TOTAL', '', '', ''),
      row('Ruiz', 'Eva', '1-9', 'Acme'),
    ]);
    expect(r.totalRows).toBe(5);
    expect(r.validRows).toHaveLength(1);
    expect(r.skippedRows).toBe(4);
    expect(r.skippedReasons).toEqual(
      expect.arrayContaining([
        '1 filas: Fila de encabezado',
        '1 filas: Fila completamente vacía',
        '2 filas: Fila de observaciones/notas',
      ])
    );
  });

  it('una fila con al menos un dato es válida', () => {
    expect(processExcelData([row('', '', '9999999-9', '')]).validRows).toHaveLength(1);
  });

  it('ARICA COLLEGE "SIN LISTADO" se ignora, pero sus beneficiarios reales se conservan', () => {
    const r = processExcelData([
      row('SIN LISTADO', '', '', 'ARICA COLLEGE'),
      row('Díaz', 'Pía', '2-7', 'Arica College'),
    ]);
    expect(r.validRows.map((v) => v.apellido)).toEqual(['Díaz']);
    expect(r.skippedReasons).toEqual(['1 filas: ARICA COLLEGE sin listado']);
  });

  it.each([
    ['carabineros de chile', 'CARABINEROS'],
    ['Colegio Medico de Chile', 'COLEGIO MÉDICO'],
    ['pdi', 'PDI'],
    ['Caja de Compensación La Araucana', 'CAJA LA ARAUCANA'],
    ['Caja Los Andes', 'Caja Los Andes'],
  ])('normaliza la empresa "%s" → "%s"', (input, expected) => {
    expect(processExcelData([row('X', 'Y', '', input)]).validRows[0].empresa).toBe(expected);
  });

  it('acepta encabezados alternativos (APELLIDOS, RUN, INSTITUCION)', () => {
    const r = processExcelData([{ APELLIDOS: 'Mora', NOMBRES: 'Ian', RUN: '3-5', INSTITUCION: 'Acme' }]);
    expect(r.validRows[0]).toEqual({ apellido: 'Mora', nombre: 'Ian', rut: '35', empresa: 'Acme' });
  });
});
