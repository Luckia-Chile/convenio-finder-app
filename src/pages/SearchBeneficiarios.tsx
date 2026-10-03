import React, { Suspense, lazy, useState } from 'react';
import { BRAND, SEARCH_PAGE_SIZE } from '@/config/app';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { AdminOnly } from '@/components/auth/RoleGuard';
import { Header } from '@/components/layout/Header';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SearchForm } from '@/components/beneficiarios/SearchForm';
import { BeneficiariosList } from '@/components/beneficiarios/BeneficiariosList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, Upload, Users, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { applyBeneficiariosFilter } from '@/lib/beneficiariosQuery';
import { useToast } from '@/hooks/use-toast';
import { InstitutionInfo } from '@/utils/institutionDetector';

// Solo los admins cargan archivos: el componente (y SheetJS) no se descarga para consultores.
const UploadSection = lazy(() =>
  import('@/components/beneficiarios/UploadSection').then((m) => ({ default: m.UploadSection }))
);

const SearchBeneficiarios = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para paginación inteligente
  const [currentSearchParams, setCurrentSearchParams] = useState<any>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  
  // 🆕 NUEVO ESTADO: Información de institución detectada
  const [detectedInstitution, setDetectedInstitution] = useState<InstitutionInfo | undefined>(undefined);
  
  const { toast } = useToast();
  const { isAdmin, role } = useRole();

  // Función para cargar más resultados manteniendo los filtros actuales
  const handleLoadMore = async () => {
    if (!currentSearchParams || !hasMoreResults) return;

    setIsLoading(true);
    
    try {
      const currentOffset = searchResults.length;
      const BATCH_SIZE = SEARCH_PAGE_SIZE;
      
      let query = supabase.from('beneficiarios').select('*', { count: 'exact' });

      // Aplicar los mismos filtros de la búsqueda original
      const { searchTerm, searchType } = currentSearchParams;
      
      query = applyBeneficiariosFilter(query, searchTerm, searchType);

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + BATCH_SIZE - 1);

      if (error) {
        console.error('Error loading more results:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error al cargar más resultados.",
        });
        return;
      }

      // Agregar nuevos resultados a los existentes
      const newResults = [...searchResults, ...(data || [])];
      setSearchResults(newResults);
      
      // Verificar si hay más resultados
      setHasMoreResults(newResults.length < totalResults);
      
      toast({
        title: "Resultados cargados",
        description: `Se cargaron ${data?.length || 0} beneficiarios adicionales.`,
      });

    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error inesperado al cargar más resultados.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500">
        <Header />
        
        <main className="max-w-7xl mx-auto py-8 px-4">
          {/* Hero Section con Logo */}
          <div className="mb-8">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg transition-colors duration-500">
                  <img 
                    src={BRAND.logo} 
                    alt={`${BRAND.company} Logo`} 
                    className="h-12 w-auto"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
              
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                {isAdmin ? 'Gestión de Beneficiarios' : 'Búsqueda de Beneficiarios'}
              </h2>
              
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-6 max-w-3xl mx-auto transition-colors duration-500">
                {isAdmin 
                  ? 'Busca beneficiarios existentes o sube nuevos archivos Excel con información de convenios.'
                  : 'Busca beneficiarios existentes en el sistema de manera rápida y eficiente.'
                }
              </p>

              <div className="flex flex-wrap gap-3 justify-center">
                <Badge variant="secondary" className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-blue-800 dark:text-blue-200 transition-colors duration-500">
                  <Users className="h-4 w-4 mr-2" />
                  Sistema Activo
                </Badge>
                <Badge variant="secondary" className="px-4 py-2 bg-gradient-to-r from-green-100 to-teal-100 dark:from-green-900 dark:to-teal-900 text-green-800 dark:text-green-200 transition-colors duration-500">
                  <Zap className="h-4 w-4 mr-2" />
                  Búsqueda Inteligente
                </Badge>
                {isAdmin && (
                  <Badge variant="secondary" className="px-4 py-2 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900 dark:to-red-900 text-orange-800 dark:text-orange-200 transition-colors duration-500">
                    <Upload className="h-4 w-4 mr-2" />
                    Carga Masiva
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Tabs con protección condicional */}
          <Tabs defaultValue="search" className="space-y-6">
            <div className="flex justify-center">
              <TabsList className={`grid ${isAdmin ? 'grid-cols-2 w-full max-w-md' : 'grid-cols-1 w-full max-w-xs'} h-12 bg-white dark:bg-gray-800 shadow-lg rounded-xl border dark:border-gray-700 transition-colors duration-500`}>
                <TabsTrigger 
                  value="search" 
                  className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg transition-all duration-300"
                >
                  <Search className="h-5 w-5" />
                  <span className="hidden sm:inline">Buscar Beneficiarios</span>
                  <span className="sm:hidden">Buscar</span>
                </TabsTrigger>
                
                {/* Tab Upload SOLO para admins */}
                {isAdmin && (
                  <TabsTrigger 
                    value="upload" 
                    className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white rounded-lg transition-all duration-300"
                  >
                    <Upload className="h-5 w-5" />
                    <span className="hidden sm:inline">Subir Archivos</span>
                    <span className="sm:hidden">Subir</span>
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            {/* Tab Content Búsqueda */}
            <TabsContent value="search" className="space-y-6">
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl transition-colors duration-500">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center space-x-3">
                    <Search className="h-6 w-6" />
                    <span>Buscar Beneficiarios</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <SearchForm 
                    onSearch={setSearchResults}
                    setIsLoading={setIsLoading}
                    onSearchStateChange={(params, total, hasMore, institution) => {
                      setCurrentSearchParams(params);
                      setTotalResults(total);
                      setHasMoreResults(hasMore);
                      // 🆕 CAPTURAR INSTITUCIÓN DETECTADA
                      setDetectedInstitution(institution);
                    }}
                  />
                </CardContent>
              </Card>

              <BeneficiariosList 
                beneficiarios={searchResults}
                isLoading={isLoading}
                onLoadMore={handleLoadMore}
                hasMore={hasMoreResults}
                totalResults={totalResults}
                // 🆕 PASAR INSTITUCIÓN DETECTADA A LA LISTA
                detectedInstitution={detectedInstitution}
              />
            </TabsContent>

            {/* Tab Content Upload SOLO para admins */}
            {isAdmin && (
              <TabsContent value="upload" className="space-y-6">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-xl border-0 overflow-hidden transition-colors duration-500">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-white/20 rounded-xl">
                        <Upload className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">Subir Archivos Excel</h3>
                        <p className="text-green-100">Carga masiva de beneficiarios desde archivos Excel</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <Suspense fallback={<p className="text-sm text-muted-foreground py-6 text-center">Cargando…</p>}>
                      <UploadSection />
                    </Suspense>
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default SearchBeneficiarios;