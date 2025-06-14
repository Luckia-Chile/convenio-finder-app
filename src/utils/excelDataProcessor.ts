
interface RawExcelRow {
  [key: string]: any;
}

interface ProcessedRow {
  apellido: string;
  nombre: string;
  rut: string;
  empresa: string;
}

interface ProcessingResult {
  validRows: ProcessedRow[];
  skippedRows: number;
  skippedReasons: string[];
  totalRows: number;
}

export const BATCH_SIZE = 500;

// Clean and format RUT - now allows empty RUT
const cleanRut = (rut: string): string => {
  if (!rut) return '';
  // Remove dots, hyphens, and spaces, keep only numbers and K
  return rut.toString().replace(/[.\-\s]/g, '').toUpperCase();
};

// Validate if a row should be processed
const validateRow = (row: RawExcelRow, index: number): { isValid: boolean; reason?: string } => {
  const apellido = row.APELLIDO?.toString().trim() || '';
  const nombre = row.NOMBRE?.toString().trim() || '';
  const rut = row.RUT?.toString().trim() || '';
  const empresa = row.EMPRESA?.toString().trim() || '';

  // Check for missing required fields (RUT is no longer required)
  if (!apellido || !nombre || !empresa) {
    return { isValid: false, reason: 'Campos obligatorios faltantes (apellido, nombre, empresa)' };
  }

  // Skip header rows or observation rows
  if (apellido.toUpperCase().includes('OBSERVACIONES') || 
      apellido.toUpperCase().includes('NOTAS') ||
      apellido.toUpperCase().includes('TOTAL')) {
    return { isValid: false, reason: 'Fila de observaciones/notas' };
  }

  // Handle special institution cases - ARICA COLLEGE without listing is still valid
  if (empresa.toUpperCase().includes('ARICA COLLEGE') && 
      (apellido.toUpperCase().includes('SIN LISTADO') || nombre.toUpperCase().includes('SIN LISTADO'))) {
    return { isValid: false, reason: 'ARICA COLLEGE sin listado' };
  }

  // RUT can now be empty for credential-only beneficiaries
  // No validation needed for empty RUT

  return { isValid: true };
};

// Normalize row data
const normalizeData = (row: RawExcelRow): ProcessedRow => ({
  apellido: row.APELLIDO?.toString().trim() || '',
  nombre: row.NOMBRE?.toString().trim() || '',
  rut: cleanRut(row.RUT?.toString() || ''), // Can be empty now
  empresa: normalizeEmpresa(row.EMPRESA?.toString().trim() || '')
});

// Handle special institution names
const normalizeEmpresa = (empresa: string): string => {
  const upperEmpresa = empresa.toUpperCase();
  
  // Keep special institutions as-is
  if (upperEmpresa.includes('COLEGIO MÉDICO') || upperEmpresa.includes('COLEGIO MEDICO')) {
    return 'COLEGIO MÉDICO';
  }
  if (upperEmpresa.includes('CARABINEROS')) {
    return 'CARABINEROS';
  }
  if (upperEmpresa === 'PDI') {
    return 'PDI';
  }
  
  return empresa;
};

// Process Excel data with validation and normalization
export const processExcelData = (rawData: RawExcelRow[]): ProcessingResult => {
  const validRows: ProcessedRow[] = [];
  const skippedReasons: string[] = [];
  const reasonCounts: { [key: string]: number } = {};

  rawData.forEach((row, index) => {
    const validation = validateRow(row, index);
    
    if (validation.isValid) {
      const normalizedRow = normalizeData(row);
      validRows.push(normalizedRow);
    } else {
      const reason = validation.reason || 'Razón desconocida';
      reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
    }
  });

  // Format skipped reasons for display
  Object.entries(reasonCounts).forEach(([reason, count]) => {
    skippedReasons.push(`${count} filas: ${reason}`);
  });

  return {
    validRows,
    skippedRows: rawData.length - validRows.length,
    skippedReasons,
    totalRows: rawData.length
  };
};

// Remove duplicates based on RUT - but only for non-empty RUTs
export const removeDuplicates = (data: ProcessedRow[]): { uniqueData: ProcessedRow[]; duplicateCount: number } => {
  const seenRuts = new Set<string>();
  const uniqueData: ProcessedRow[] = [];
  let duplicateCount = 0;

  data.forEach(row => {
    // If RUT is empty, always include the row (no duplicate detection for credential-only users)
    if (!row.rut || row.rut.trim() === '') {
      uniqueData.push(row);
    } else {
      // For non-empty RUTs, check for duplicates
      if (!seenRuts.has(row.rut)) {
        seenRuts.add(row.rut);
        uniqueData.push(row);
      } else {
        duplicateCount++;
      }
    }
  });

  return { uniqueData, duplicateCount };
};
