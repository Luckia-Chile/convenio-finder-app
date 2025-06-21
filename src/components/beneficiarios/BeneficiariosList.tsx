import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Calendar, Building2, CreditCard, ChevronDown, CheckCircle, MoreHorizontal, AlertTriangle, Info } from 'lucide-react';
import { InstitutionInfo } from '@/utils/institutionDetector';

interface Beneficiario {
  id: string;
  rut: string;
  nombre: string;
  apellido: string;
  empresa: string;
  created_at: string;
}

interface BeneficiariosListProps {
  beneficiarios: Beneficiario[];
  isLoading: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  totalResults?: number;
  detectedInstitution?: InstitutionInfo; // 🆕 NUEVA PROP
}

export const BeneficiariosList: React.FC<BeneficiariosListProps> = ({ 
  beneficiarios, 
  isLoading,
  onLoadMore,
  hasMore = false,
  totalResults = 0,
  detectedInstitution // 🆕 NUEVA PROP
}) => {
  const currentCount = beneficiarios.length;
  const remainingCount = totalResults - currentCount;

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatRut = (rut: string) => {
    if (!rut || rut.trim() === '') return 'Sin RUT';
    return rut;
  };

  if (isLoading && beneficiarios.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Buscando beneficiarios...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Resultados de Búsqueda</span>
          </CardTitle>
          <Badge variant="secondary" className="text-sm">
            {currentCount.toLocaleString()} beneficiarios{totalResults > 0 && ` de ${totalResults.toLocaleString()}`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* 🆕 BANNER DE INSTITUCIÓN DETECTADA */}
        {detectedInstitution && (
          <div className={`${detectedInstitution.color.bg} ${detectedInstitution.color.border} border-l-4 rounded-lg p-4 mb-6 shadow-sm`}>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="text-3xl">{detectedInstitution.icon}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <Info className={`h-5 w-5 ${detectedInstitution.color.text}`} />
                  <h3 className={`text-lg font-semibold ${detectedInstitution.color.text}`}>
                    {detectedInstitution.displayName}
                  </h3>
                  <Badge variant="outline" className={`${detectedInstitution.color.bg} ${detectedInstitution.color.text} border-current`}>
                    Solo Credencial
                  </Badge>
                </div>
                <p className={`text-sm ${detectedInstitution.color.text} leading-relaxed`}>
                  {detectedInstitution.credentialMessage}
                </p>
                {currentCount === 0 && (
                  <div className="mt-3 flex items-center space-x-2">
                    <AlertTriangle className={`h-4 w-4 ${detectedInstitution.color.text}`} />
                    <span className={`text-sm font-medium ${detectedInstitution.color.text}`}>
                      No es necesario buscar en el sistema - presentar credencial directamente
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {beneficiarios.length === 0 ? (
          <div className="text-center py-8">
            {/* 🆕 MENSAJE DIFERENCIADO PARA INSTITUCIONES */}
            {detectedInstitution ? (
              <div className="space-y-4">
                <div className="text-6xl">{detectedInstitution.icon}</div>
                <div>
                  <p className={`text-xl font-semibold ${detectedInstitution.color.text} mb-2`}>
                    {detectedInstitution.displayName}
                  </p>
                  <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                    Esta institución no requiere búsqueda en el sistema. Los funcionarios deben presentar únicamente su credencial institucional.
                  </p>
                </div>
                <div className={`${detectedInstitution.color.bg} rounded-lg p-4 max-w-md mx-auto`}>
                  <p className={`text-sm ${detectedInstitution.color.text} font-medium`}>
                    ✅ Procedimiento: Verificar credencial institucional vigente
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No se encontraron beneficiarios</p>
                <p className="text-gray-400">
                  Intenta con diferentes términos de búsqueda o sube un archivo Excel con nuevos datos.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Indicador de progreso de carga */}
            {totalResults > 0 && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    📊 Mostrando {currentCount.toLocaleString()} de {totalResults.toLocaleString()} beneficiarios
                  </span>
                  {hasMore && (
                    <span className="text-blue-600 font-medium">
                      {remainingCount.toLocaleString()} más por cargar
                    </span>
                  )}
                  {!hasMore && currentCount > 0 && (
                    <span className="text-green-600 font-medium flex items-center space-x-1">
                      <CheckCircle className="h-4 w-4" />
                      <span>Completado</span>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 🆕 MENSAJE INFORMATIVO CUANDO HAY RESULTADOS + INSTITUCIÓN */}
            {detectedInstitution && currentCount > 0 && (
              <div className={`${detectedInstitution.color.bg} rounded-lg p-3 border ${detectedInstitution.color.border}`}>
                <div className="flex items-center space-x-2">
                  <Info className={`h-4 w-4 ${detectedInstitution.color.text}`} />
                  <span className={`text-sm ${detectedInstitution.color.text}`}>
                    <strong>Nota:</strong> Estos registros pueden corresponder a personal administrativo. 
                    Para funcionarios operativos, verificar credencial institucional.
                  </span>
                </div>
              </div>
            )}

            {/* Vista Desktop y Tablet: Tabla */}
            <div className="hidden md:block">
              <div className="overflow-x-auto">
                <Table translate="no" className="notranslate">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>RUT</TableHead>
                      <TableHead>Apellido</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Empresa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {beneficiarios.map((beneficiario, index) => (
                      <TableRow key={beneficiario.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-500">
                          {index + 1}
                        </TableCell>
                        <TableCell 
                          className="font-medium notranslate" 
                          translate="no"
                        >
                          {formatRut(beneficiario.rut)}
                        </TableCell>
                        <TableCell 
                          className="notranslate" 
                          translate="no"
                        >
                          {beneficiario.apellido}
                        </TableCell>
                        <TableCell 
                          className="notranslate" 
                          translate="no"
                        >
                          {beneficiario.nombre}
                        </TableCell>
                        <TableCell 
                          className="notranslate" 
                          translate="no"
                        >
                          {beneficiario.empresa}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Vista Mobile: Lista simple sin cards complejas */}
            <div className="md:hidden space-y-3">
              {beneficiarios.map((beneficiario, index) => (
                <div 
                  key={beneficiario.id} 
                  className="bg-white border border-gray-200 rounded-lg p-4 space-y-3"
                >
                  {/* Header simple */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <span className="text-xs text-gray-400">
                      {formatDate(beneficiario.created_at)}
                    </span>
                  </div>
                  
                  {/* Información básica */}
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Nombre</span>
                      <p className="font-medium text-gray-900" translate="no">
                        {beneficiario.apellido}, {beneficiario.nombre}
                      </p>
                    </div>
                    
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">RUT</span>
                      <p className="font-medium text-gray-900" translate="no">
                        {formatRut(beneficiario.rut)}
                      </p>
                    </div>
                    
                    <div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Empresa</span>
                      <p className="font-medium text-gray-900" translate="no">
                        {beneficiario.empresa}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Botón Cargar más resultados */}
            {hasMore && (
              <div className="flex flex-col items-center space-y-3 pt-4 border-t">
                <Button 
                  onClick={onLoadMore} 
                  disabled={isLoading}
                  variant="outline" 
                  className="px-6"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      <span>Cargando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <MoreHorizontal className="h-4 w-4" />
                      <span>Cargar más resultados</span>
                    </div>
                  )}
                </Button>
                <p className="text-sm text-gray-500">
                  {remainingCount.toLocaleString()} beneficiarios restantes
                </p>
              </div>
            )}

            {/* Mensaje de completitud */}
            {!hasMore && currentCount > 0 && totalResults > 200 && (
              <div className="flex items-center justify-center space-x-2 pt-4 border-t">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-600 font-medium">
                  ✅ Se han cargado todos los {totalResults.toLocaleString()} beneficiarios
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};