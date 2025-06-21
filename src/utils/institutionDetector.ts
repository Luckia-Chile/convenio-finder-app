export interface InstitutionInfo {
  id: string;
  name: string;
  displayName: string;
  credentialMessage: string;
  keywords: string[];
  variants: string[];
  color: {
    bg: string;
    text: string;
    border: string;
  };
  icon: string;
}

export interface DetectionResult {
  isInstitution: boolean;
  institution?: InstitutionInfo;
  matchedTerm?: string;
  confidence: number; // 0-100
}

// Configuración de instituciones que usan credenciales
const INSTITUTIONS: InstitutionInfo[] = [
  {
    id: 'carabineros',
    name: 'CARABINEROS',
    displayName: 'Carabineros de Chile',
    credentialMessage: 'Los funcionarios de Carabineros solo deben presentar su credencial institucional.',
    keywords: ['carabineros', 'carabinero', 'policia', 'uniformada'],
    variants: [
      'carabineros', 'carabinero', 'caravineros', 'caravinero',
      'carabimeros', 'carabimero', 'caravinieros', 'carabiñeros',
      'policia uniformada', 'policía uniformada'
    ],
    color: {
      bg: 'bg-green-50',
      text: 'text-green-800',
      border: 'border-green-200'
    },
    icon: '👮‍♂️'
  },
  {
    id: 'pdi',
    name: 'PDI',
    displayName: 'Policía de Investigaciones',
    credentialMessage: 'Los funcionarios de la PDI solo deben presentar su credencial institucional.',
    keywords: ['pdi', 'policia investigaciones', 'policia de investigaciones', 'investigaciones'],
    variants: [
      'pdi', 'p.d.i', 'p d i',
      'policia investigaciones', 'policía investigaciones',
      'policia de investigaciones', 'policía de investigaciones',
      'policia investigacion', 'policía investigación',
      'investigaciones', 'investigacion',
      'policia civil', 'policía civil'
    ],
    color: {
      bg: 'bg-blue-50',
      text: 'text-blue-800',
      border: 'border-blue-200'
    },
    icon: '🕵️‍♂️'
  },
  {
    id: 'colegio_medico',
    name: 'COLEGIO MÉDICO',
    displayName: 'Colegio Médico de Chile',
    credentialMessage: 'Los profesionales del Colegio Médico solo deben presentar su credencial institucional.',
    keywords: ['colegio medico', 'colegio médico', 'medicos', 'médicos'],
    variants: [
      'colegio medico', 'colegio médico', 'colegiomedico', 'colegiomédico',
      'colegio de medicos', 'colegio de médicos',
      'col medico', 'col médico', 'col. medico', 'col. médico',
      'medicos', 'médicos', 'doctor', 'doctores', 'dr', 'dra'
    ],
    color: {
      bg: 'bg-red-50',
      text: 'text-red-800',
      border: 'border-red-200'
    },
    icon: '⚕️'
  }
];

/**
 * Normaliza texto para comparación: minúsculas, sin acentos, sin espacios extras
 */
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^\w\s]/g, ' ') // Reemplazar símbolos por espacios
    .replace(/\s+/g, ' ') // Espacios múltiples a uno solo
    .trim();
};

/**
 * Calcula similitud entre dos strings usando algoritmo simple
 * Retorna valor entre 0-100
 */
const calculateSimilarity = (str1: string, str2: string): number => {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);
  
  if (s1 === s2) return 100;
  if (s1.includes(s2) || s2.includes(s1)) return 85;
  
  // Algoritmo de distancia de Levenshtein simplificado
  const len1 = s1.length;
  const len2 = s2.length;
  const maxLen = Math.max(len1, len2);
  
  if (maxLen === 0) return 100;
  
  let matches = 0;
  const minLen = Math.min(len1, len2);
  
  for (let i = 0; i < minLen; i++) {
    if (s1[i] === s2[i]) matches++;
  }
  
  return Math.round((matches / maxLen) * 100);
};

/**
 * Detecta si un término de búsqueda corresponde a una institución
 * @param searchTerm Término ingresado por el usuario
 * @param minConfidence Confianza mínima requerida (default: 70)
 * @returns Resultado de la detección
 */
export const detectInstitution = (
  searchTerm: string, 
  minConfidence: number = 70
): DetectionResult => {
  if (!searchTerm || searchTerm.trim().length < 3) {
    return { isInstitution: false, confidence: 0 };
  }
  
  const normalizedSearch = normalizeText(searchTerm);
  let bestMatch: DetectionResult = { isInstitution: false, confidence: 0 };
  
  for (const institution of INSTITUTIONS) {
    // Buscar en variantes exactas primero
    for (const variant of institution.variants) {
      const similarity = calculateSimilarity(normalizedSearch, variant);
      
      if (similarity >= minConfidence && similarity > bestMatch.confidence) {
        bestMatch = {
          isInstitution: true,
          institution,
          matchedTerm: variant,
          confidence: similarity
        };
      }
    }
    
    // Buscar en keywords también
    for (const keyword of institution.keywords) {
      if (normalizedSearch.includes(normalizeText(keyword))) {
        const similarity = 90; // High confidence for keyword matches
        
        if (similarity > bestMatch.confidence) {
          bestMatch = {
            isInstitution: true,
            institution,
            matchedTerm: keyword,
            confidence: similarity
          };
        }
      }
    }
  }
  
  return bestMatch;
};

/**
 * Función auxiliar para agregar nuevas instituciones (para futuro)
 * @param newInstitution Nueva institución a agregar
 */
export const addInstitution = (newInstitution: InstitutionInfo): void => {
  // Validar que no exista ya
  const exists = INSTITUTIONS.find(inst => inst.id === newInstitution.id);
  if (!exists) {
    INSTITUTIONS.push(newInstitution);
  }
};

/**
 * Obtener todas las instituciones configuradas
 */
export const getAllInstitutions = (): InstitutionInfo[] => {
  return [...INSTITUTIONS];
};

/**
 * Buscar institución por ID
 */
export const getInstitutionById = (id: string): InstitutionInfo | undefined => {
  return INSTITUTIONS.find(inst => inst.id === id);
};

/**
 * Función de prueba/debug para validar detecciones
 */
export const testDetection = (): void => {
  const testCases = [
    'carabineros', 'caravineros', 'policia uniformada',
    'pdi', 'policia investigaciones', 'investigaciones',
    'colegio medico', 'colegiomedico', 'medicos',
    'usuario normal', 'juan perez', '12345678-9'
  ];
  
  console.log('🧪 Pruebas de detección de instituciones:');
  testCases.forEach(term => {
    const result = detectInstitution(term);
    console.log(`"${term}" →`, result.isInstitution ? 
      `✅ ${result.institution?.name} (${result.confidence}%)` : 
      `❌ No detectado`
    );
  });
};