import { COMPANIES_WITHOUT_LIST } from '@/config/app';

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

// Validate if a row should be processed - simplified to only skip truly empty or header rows
const validateRow = (row: RawExcelRow, index: number): { isValid: boolean; reason?: string } => {
  const apellido = getColumnValue(row, ['APELLIDO', 'apellido', 'Apellido', 'APELLIDOS', 'apellidos']);
  const nombre = getColumnValue(row, ['NOMBRE', 'nombre', 'Nombre', 'NOMBRES', 'nombres']);
  const rut = getColumnValue(row, ['RUT', 'rut', 'Rut', 'RUN', 'run']);
  const empresa = getColumnValue(row, [
    'EMPRESA', 'empresa', 'Empresa',
    'INSTITUCION', 'institucion', 'Institución',
    'ORGANIZACION', 'organizacion', 'Organización',
    'ENTIDAD', 'entidad', 'Entidad',
    'EMPLEADOR', 'empleador', 'Empleador',
    'SERVICIO', 'servicio', 'Servicio'
  ]);

  // Skip header rows (mantener como antes)
  if (apellido.toUpperCase() === 'APELLIDO' || 
      nombre.toUpperCase() === 'NOMBRE' ||
      empresa.toUpperCase() === 'EMPRESA') {
    return { isValid: false, reason: 'Fila de encabezado' };
  }

  // NUEVA LÓGICA: Solo rechazar si TODAS las celdas están completamente vacías
  if (!apellido && !nombre && !rut && !empresa) {
    return { isValid: false, reason: 'Fila completamente vacía' };
  }

  // Skip observation rows (mantener como antes)
  if (apellido.toUpperCase().includes('OBSERVACIONES') || 
      apellido.toUpperCase().includes('NOTAS') ||
      apellido.toUpperCase().includes('TOTAL')) {
    return { isValid: false, reason: 'Fila de observaciones/notas' };
  }

  // Handle special institution cases (mantener como antes)
  const sinListado = apellido.toUpperCase().includes('SIN LISTADO') || nombre.toUpperCase().includes('SIN LISTADO');
  const sinListadoCompany = COMPANIES_WITHOUT_LIST.find(c => empresa.toUpperCase().includes(c));
  if (sinListadoCompany && sinListado) {
    return { isValid: false, reason: `${sinListadoCompany} sin listado` };
  }

  // AHORA: Cualquier fila con al menos UN dato se considera válida
  return { isValid: true };
};

// Helper function to find column value with flexible naming
const getColumnValue = (row: RawExcelRow, possibleNames: string[]): string => {
  for (const name of possibleNames) {
    if (row[name] !== undefined && row[name] !== null) {
      return row[name]?.toString().trim() || '';
    }
  }
  return '';
};

// Normalize row data with flexible column mapping
const normalizeData = (row: RawExcelRow): ProcessedRow => ({
  apellido: getColumnValue(row, ['APELLIDO', 'apellido', 'Apellido', 'APELLIDOS', 'apellidos']),
  nombre: getColumnValue(row, ['NOMBRE', 'nombre', 'Nombre', 'NOMBRES', 'nombres']),
  rut: cleanRut(getColumnValue(row, ['RUT', 'rut', 'Rut', 'RUN', 'run'])),
  empresa: normalizeEmpresa(getColumnValue(row, [
    'EMPRESA', 'empresa', 'Empresa',
    'INSTITUCION', 'institucion', 'Institución',
    'ORGANIZACION', 'organizacion', 'Organización',
    'ENTIDAD', 'entidad', 'Entidad',
    'EMPLEADOR', 'empleador', 'Empleador',
    'SERVICIO', 'servicio', 'Servicio'
  ]))
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
  if (upperEmpresa.includes('CAJA') && upperEmpresa.includes('ARAUCANA')) {
    return 'CAJA LA ARAUCANA';
  }
  if (upperEmpresa.includes('COMPENSACION') && upperEmpresa.includes('ARAUCANA')) {
    return 'CAJA LA ARAUCANA';
  }

  return empresa;
};


// Process Excel data with validation and normalization - NO DUPLICATE DETECTION
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

// REMOVED: removeDuplicates function - no longer needed
// All valid rows will be inserted without any duplicate checking
