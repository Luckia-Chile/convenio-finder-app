import { describe, expect, it } from 'vitest';
import { processExcelData } from './excelDataProcessor';

// Verifica que la librería de Excel vendorizada (SheetJS 0.20.x) lee un archivo real
// con el mismo flujo de UploadSection (ArrayBuffer -> filas -> processExcelData).
describe('lectura de Excel (SheetJS)', () => {
  it('lee un .xlsx generado en memoria y lo procesa igual que la carga', async () => {
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.aoa_to_sheet([
      ['APELLIDO', 'NOMBRE', 'RUT', 'EMPRESA'],
      ['Pérez', 'Ana', '12.345.678-5', 'Acme'],
      ['Soto', 'Luis', '', 'carabineros de chile'],
      [],
      ['OBSERVACIONES'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Hoja1');
    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;

    const read = XLSX.read(buffer, { type: 'array' });
    const rows = XLSX.utils.sheet_to_json(read.Sheets[read.SheetNames[0]], { header: 1 }) as any[][];
    const data = rows
      .slice(1)
      .filter((r) => r && r.length > 0 && r.some((c) => c !== null && c !== undefined && c !== ''))
      .map((r) => ({ APELLIDO: r[0], NOMBRE: r[1], RUT: r[2], EMPRESA: r[3] }));

    const result = processExcelData(data);
    expect(result.validRows).toEqual([
      { apellido: 'Pérez', nombre: 'Ana', rut: '123456785', empresa: 'Acme' },
      { apellido: 'Soto', nombre: 'Luis', rut: '', empresa: 'CARABINEROS' },
    ]);
    expect(result.skippedReasons).toEqual(['1 filas: Fila de observaciones/notas']);
  });
});
