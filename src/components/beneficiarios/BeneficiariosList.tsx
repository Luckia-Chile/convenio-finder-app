import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Calendar, Building2, CreditCard, ChevronDown, CheckCircle, MoreHorizontal, AlertTriangle, Info, X, Bell, Shield } from 'lucide-react';
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
  detectedInstitution?: InstitutionInfo;
}

export const BeneficiariosList: React.FC<BeneficiariosListProps> = ({ 
  beneficiarios, 
  isLoading,
  onLoadMore,
  hasMore = false,
  totalResults = 0,
  detectedInstitution
}) => {
  const currentCount = beneficiarios.length;
  const remainingCount = totalResults - currentCount;
  
  // 🆕 Estado para modal persistente de institución
  const [showInstitutionModal, setShowInstitutionModal] = useState(false);

  // 🆕 Mostrar modal persistente cuando se detecta institución
  useEffect(() => {
    if (detectedInstitution) {
      setShowInstitutionModal(true);
    }
  }, [detectedInstitution]);

  // 🆕 Función para cerrar modal y limpiar estado
  const handleCloseModal = () => {
    setShowInstitutionModal(false);
  };

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
    <>
      {/* 🚨 MODAL RESPONSIVO Y CONCISO */}
      {showInstitutionModal && detectedInstitution && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-2 sm:p-4" style={{ zIndex: 999999 }}>
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-lg"
            style={{ 
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999998
            }}
            onMouseDown={(e) => e.preventDefault()}
            /*onTouchStart={(e) => e.preventDefault()}*/
            onClick={(e) => e.preventDefault()}
          />
          
          {/* Modal responsivo */}
          <div 
            className={`relative rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-md lg:max-w-lg mx-auto animate-in zoom-in-95 duration-500 ring-4 sm:ring-8 ${
              detectedInstitution.color.text === 'text-green-800' 
                ? 'bg-gradient-to-br from-green-600 via-green-700 to-green-800 ring-green-400' 
                : detectedInstitution.color.text === 'text-blue-800'
                ? 'bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 ring-blue-400'
                : 'bg-gradient-to-br from-red-600 via-red-700 to-red-800 ring-red-400'
            }`}
            style={{ 
              zIndex: 999999,
              transform: 'translate3d(0, 0, 0)',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)'
            }}
          >
            
            {/* Header compacto */}
            <div className="bg-white/95 backdrop-blur-sm rounded-t-2xl sm:rounded-t-3xl p-4 sm:p-6 lg:p-8 border-b-4 sm:border-b-8 border-white">
              <div className="text-center">
                <div className="text-4xl sm:text-5xl lg:text-6xl mb-2 sm:mb-4 animate-bounce drop-shadow-lg">
                  {detectedInstitution.icon}
                </div>
                <h2 className={`text-lg sm:text-xl lg:text-2xl font-black ${detectedInstitution.color.text} mb-2 sm:mb-4 drop-shadow-md leading-tight`}>
                  ⚠️ {detectedInstitution.displayName.toUpperCase()} ⚠️
                </h2>
                <Badge 
                  variant="outline" 
                  className={`${detectedInstitution.color.bg} ${detectedInstitution.color.text} border-current font-black text-sm sm:text-base lg:text-lg px-3 sm:px-4 lg:px-6 py-1 sm:py-2 lg:py-3 ring-2 sm:ring-4 ring-current/20 animate-pulse`}
                >
                  <Shield className="h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5 mr-1 sm:mr-2" />
                  🚨 SOLO CREDENCIAL 🚨
                </Badge>
              </div>
            </div>

            {/* Contenido principal simplificado */}
            <div className="bg-white/95 backdrop-blur-sm p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
              
              {/* Mensaje institucional principal */}
              <div className={`bg-gradient-to-r ${
                detectedInstitution.color.text === 'text-green-800' 
                  ? 'from-green-100 to-green-200 border-green-500' 
                  : detectedInstitution.color.text === 'text-blue-800'
                  ? 'from-blue-100 to-blue-200 border-blue-500'
                  : 'from-red-100 to-red-200 border-red-500'
              } rounded-xl p-4 sm:p-6 border-l-4 sm:border-l-8 ring-2 sm:ring-4 ring-current/20`}>
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <div className={`p-2 sm:p-3 rounded-full ${detectedInstitution.color.bg} ${detectedInstitution.color.text} flex-shrink-0`}>
                    <Info className="h-4 w-4 sm:h-6 sm:w-6 lg:h-8 lg:w-8 font-bold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-black ${detectedInstitution.color.text} mb-2 sm:mb-3 text-base sm:text-lg lg:text-xl tracking-wide`}>
                      🚨 AVISO INSTITUCIONAL 🚨
                    </h3>
                    <p className={`${detectedInstitution.color.text} font-bold leading-relaxed text-sm sm:text-base lg:text-lg`}>
                      {detectedInstitution.credentialMessage}
                    </p>
                  </div>
                </div>
              </div>

              {/* Información adicional solo si hay resultados */}
              {currentCount > 0 && (
                <div className="bg-gradient-to-r from-yellow-100 to-orange-200 border-4 border-yellow-500 rounded-xl p-4 sm:p-6 ring-2 sm:ring-4 ring-yellow-200">
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="p-2 bg-yellow-600 rounded-full flex-shrink-0">
                      <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-yellow-900 mb-2 sm:mb-3 text-sm sm:text-base lg:text-lg">⚠️ NOTA ESPECIAL:</h4>
                      <p className="text-yellow-900 font-bold text-xs sm:text-sm lg:text-base leading-relaxed">
                        Se encontraron <span className="bg-yellow-400 px-1 sm:px-2 py-1 rounded font-black">{currentCount} registros</span> que pueden corresponder a personal administrativo.
                        <br className="hidden sm:block" />
                        <span className="text-red-700 font-black">Funcionarios operativos: verificar credencial institucional.</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer con botón responsivo */}
            <div className="bg-white/95 backdrop-blur-sm rounded-b-2xl sm:rounded-b-3xl p-4 sm:p-6 lg:p-8">
              <Button
                onClick={handleCloseModal}
                className={`w-full h-12 sm:h-16 lg:h-20 text-base sm:text-lg lg:text-xl font-black shadow-2xl transition-all duration-300 transform hover:scale-105 ring-4 sm:ring-8 ring-white/50 ${
                  detectedInstitution.color.text === 'text-green-800' 
                    ? 'bg-gradient-to-r from-green-500 via-green-600 to-green-700 hover:from-green-600 hover:via-green-700 hover:to-green-800' 
                    : detectedInstitution.color.text === 'text-blue-800'
                    ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800'
                    : 'bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:via-red-700 hover:to-red-800'
                } text-white`}
              >
                <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 lg:h-8 lg:w-8 mr-2 sm:mr-4" />
                <span className="hidden sm:inline">✅ ENTENDIDO - CERRAR AVISO ✅</span>
                <span className="sm:hidden">✅ ENTENDIDO ✅</span>
              </Button>
              
              <p className="text-xs sm:text-sm lg:text-base text-gray-800 text-center mt-2 sm:mt-4 font-black bg-yellow-200 px-2 sm:px-4 py-1 sm:py-2 rounded-lg">
                <span className="hidden sm:inline">⚠️ DEBES CERRAR ESTE AVISO PARA CONTINUAR ⚠️</span>
                <span className="sm:hidden">⚠️ CERRAR PARA CONTINUAR ⚠️</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal COMPLETAMENTE BLOQUEADO Y BORROSO */}
      <div className={`${showInstitutionModal ? 'pointer-events-none select-none blur-lg opacity-20 grayscale' : ''} transition-all duration-700`}>
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
                        Esta institución utiliza credenciales institucionales. Revisa el aviso para más información.
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
      </div>
    </>
  );
};