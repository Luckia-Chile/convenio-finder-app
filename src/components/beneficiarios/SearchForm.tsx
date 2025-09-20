import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, Filter, Loader2, Sparkles, Target, Users, Building2, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { detectInstitution, InstitutionInfo } from '@/utils/institutionDetector';

interface SearchFormProps {
  onSearch: (results: any[]) => void;
  setIsLoading: (loading: boolean) => void;
  onSearchStateChange?: (params: any, totalResults: number, hasMore: boolean, detectedInstitution?: InstitutionInfo) => void;
}

export const SearchForm: React.FC<SearchFormProps> = ({ 
  onSearch, 
  setIsLoading,
  onSearchStateChange 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('general');
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim() && searchType !== 'general') {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor ingresa un término de búsqueda.",
      });
      return;
    }

    setIsLoading(true);
    setIsSearching(true);
    
    try {
      // 🔍 NUEVA FUNCIONALIDAD: Detectar si es búsqueda de institución
      let detectedInstitution: InstitutionInfo | undefined;
      
      if (searchTerm.trim()) {
        const detection = detectInstitution(searchTerm.trim());
        if (detection.isInstitution && detection.institution) {
          detectedInstitution = detection.institution;
          
          // Toast informativo sobre la detección
          toast({
            title: `${detection.institution.icon} Institución detectada`,
            description: `Búsqueda de: ${detection.institution.displayName}`,
            duration: 3000,
          });
        }
      }

      const INITIAL_BATCH_SIZE = 200;
      let query = supabase.from('beneficiarios').select('*', { count: 'exact' });

      // Aplicar filtros según el tipo de búsqueda (FUNCIONALIDAD ORIGINAL INTACTA)
      if (searchTerm.trim()) {
        switch (searchType) {
          case 'rut':
            query = query.ilike('rut', `%${searchTerm}%`);
            break;
          case 'nombre':
            query = query.or(`nombre.ilike.%${searchTerm}%,apellido.ilike.%${searchTerm}%`);
            break;
          case 'empresa':
            query = query.ilike('empresa', `%${searchTerm}%`);
            break;
          default:
            query = query.or(`rut.ilike.%${searchTerm}%,nombre.ilike.%${searchTerm}%,apellido.ilike.%${searchTerm}%,empresa.ilike.%${searchTerm}%`);
        }
      }

      // Obtener primeros 200 resultados con count total
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(0, INITIAL_BATCH_SIZE - 1);

      if (error) {
        console.error('Error searching beneficiarios:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error al buscar beneficiarios. Por favor intenta nuevamente.",
        });
        return;
      }

      const totalResults = count || 0;
      const returnedResults = data?.length || 0;
      const hasMoreResults = returnedResults < totalResults;

      // Actualizar resultados
      onSearch(data || []);
      
      // 🆕 COMUNICAR INSTITUCIÓN DETECTADA AL COMPONENTE PADRE
      if (onSearchStateChange) {
        onSearchStateChange(
          { searchTerm, searchType }, 
          totalResults, 
          hasMoreResults,
          detectedInstitution // ← NUEVA INFORMACIÓN PASADA
        );
      }
      
      // Mensaje informativo según resultados
      if (totalResults === 0) {
        // 🆕 MENSAJE ESPECIAL PARA INSTITUCIONES SIN RESULTADOS
        if (detectedInstitution) {
          toast({
            title: `${detectedInstitution.icon} ${detectedInstitution.displayName}`,
            description: detectedInstitution.credentialMessage,
            duration: 6000,
          });
        } else {
          toast({
            title: "Sin resultados",
            description: "No se encontraron beneficiarios con esos criterios.",
          });
        }
      } else if (hasMoreResults) {
        toast({
          title: "Búsqueda completada",
          description: `Se encontraron ${totalResults.toLocaleString()} beneficiarios, mostrando primeros ${returnedResults}.`,
        });
      } else {
        toast({
          title: "Búsqueda completada",
          description: `Se encontraron ${totalResults.toLocaleString()} beneficiarios.`,
        });
      }

    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error inesperado al realizar la búsqueda.",
      });
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setSearchType('general');
    onSearch([]);
    
    // Limpiar estado de paginación (sin institución)
    if (onSearchStateChange) {
      onSearchStateChange(null, 0, false, undefined);
    }

    toast({
      title: "Búsqueda reiniciada",
      description: "Se limpiaron todos los filtros de búsqueda.",
    });
  };

  const searchTypeOptions = [
    { 
      value: 'general', 
      label: 'Búsqueda General', 
      icon: Target,
      description: 'Busca en todos los campos disponibles',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600'
    },
    { 
      value: 'rut', 
      label: 'RUT del Beneficiario', 
      icon: CreditCard,
      description: 'Busca por número de identificación',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600'
    },
    { 
      value: 'nombre', 
      label: 'Nombre del Beneficiario', 
      icon: Users,
      description: 'Busca por nombres y apellidos',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600'
    },
    { 
      value: 'empresa', 
      label: 'Nombre de Empresa', 
      icon: Building2,
      description: 'Busca por institución o empresa',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-600'
    }
  ];

  const selectedOption = searchTypeOptions.find(option => option.value === searchType);
  const SelectedIcon = selectedOption?.icon || Target;

  return (
    <form onSubmit={handleSearch} className="space-y-6">
      
      {/* Layout responsivo: vertical en móvil, horizontal en desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        
        {/* Tipo de búsqueda */}
        <div className="lg:col-span-4 space-y-3">
          <Label htmlFor="searchType" className="text-sm font-semibold flex items-center space-x-2 text-gray-700 dark:text-gray-300 transition-colors duration-500">
            <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400 transition-colors duration-500" />
            <span>Tipo de búsqueda</span>
          </Label>
          <Select value={searchType} onValueChange={setSearchType}>
            <SelectTrigger className="h-12 sm:h-14 text-base border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus:border-blue-500 dark:focus:border-blue-400 transition-colors bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
              <SelectValue placeholder="Selecciona el tipo" />
            </SelectTrigger>
            <SelectContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-2 border-gray-200 dark:border-gray-600 transition-colors duration-500">
              {searchTypeOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <SelectItem 
                    key={option.value} 
                    value={option.value} 
                    className="py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center space-x-4 w-full">
                      <div className={`w-10 h-10 ${option.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <IconComponent className={`h-5 w-5 ${option.textColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-gray-100 transition-colors duration-500">{option.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block transition-colors duration-500">{option.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Término de búsqueda */}
        <div className="lg:col-span-5 space-y-3">
          <Label htmlFor="searchTerm" className="text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-500">
            Término de búsqueda
          </Label>
          <div className="relative">
            <Input
              id="searchTerm"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ingresa el término a buscar..."
              className="h-12 sm:h-14 text-base pl-12 pr-4 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus:border-blue-500 dark:focus:border-blue-400 transition-colors bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
              disabled={isSearching}
              translate="no"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <SelectedIcon className={`h-5 w-5 ${selectedOption?.textColor || 'text-gray-400'}`} />
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="lg:col-span-3 space-y-3">
          <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300 invisible transition-colors duration-500">Acciones</Label>
          <div className="flex space-x-3">
            <Button 
              type="submit" 
              className="flex-1 h-12 sm:h-14 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 group"
              disabled={isSearching}
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  <span className="hidden sm:inline">Buscando...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <Search className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                  <span>Buscar</span>
                </>
              )}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClear}
              className="px-4 h-12 sm:h-14 border-2 border-gray-200 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              disabled={isSearching}
              title="Limpiar búsqueda"
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Limpiar</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Search Tips Card - Mobile Friendly */}
      <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 shadow-md transition-colors duration-500">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm sm:text-base font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center space-x-2 transition-colors duration-500">
                <span>Consejos de búsqueda inteligente</span>
                <Badge variant="outline" className="bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 border-blue-200 dark:border-blue-600 text-xs transition-colors duration-500">
                  Pro Tips
                </Badge>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-blue-800 dark:text-blue-200 transition-colors duration-500">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span><strong>General:</strong> Busca en todos los campos simultáneamente</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span><strong>RUT:</strong> Acepta formato con o sin puntos/guión</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span><strong>Nombre:</strong> Busca en nombres y apellidos</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span><strong>Empresa:</strong> Incluye instituciones y organizaciones</span>
                  </div>
                </div>
              </div>
              {/* 🆕 NUEVA SECCIÓN: Tips para instituciones */}
              <div className="mt-4 pt-3 border-t border-blue-200 dark:border-blue-700 transition-colors duration-500">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-semibold text-blue-900 dark:text-blue-100 transition-colors duration-500">🏛️ Instituciones con credencial:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-blue-700 dark:text-blue-300 transition-colors duration-500">
                  <span>👮‍♂️ Carabineros</span>
                  <span>🕵️‍♂️ PDI</span>
                  <span>⚕️ Colegio Médico</span>
                  <span>🏛️ Caja La Araucana</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats - Solo en desktop */}
      <div className="hidden lg:flex items-center justify-between pt-2 text-sm text-gray-600 dark:text-gray-400 transition-colors duration-500">
        <div className="flex items-center space-x-2">
          <span>Búsquedas recientes:</span>
          <Badge variant="outline" className="cursor-not-allowed opacity-50">
            Sin historial
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <span>Resultados por página:</span>
          <Badge variant="outline" className="bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-200 dark:border-green-600 transition-colors duration-500">200</Badge>
        </div>
      </div>
    </form>
  );
};