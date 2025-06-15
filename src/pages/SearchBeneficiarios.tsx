// src/pages/SearchBeneficiarios.tsx
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { AdminOnly } from '@/components/auth/RoleGuard';
import { Header } from '@/components/layout/Header';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SearchForm } from '@/components/beneficiarios/SearchForm';
import { BeneficiariosList } from '@/components/beneficiarios/BeneficiariosList';
import { UploadSection } from '@/components/beneficiarios/UploadSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Upload, Users, Shield, Lock, Sparkles, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SearchBeneficiarios = () => {
  const { isAdmin } = useRole();
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSearchParams, setCurrentSearchParams] = useState<any>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const { toast } = useToast();

  // Función para cargar más resultados manteniendo los filtros actuales
  const handleLoadMore = async () => {
    if (!currentSearchParams || !hasMoreResults) return;

    setIsLoading(true);
    
    try {
      const currentOffset = searchResults.length;
      const BATCH_SIZE = 200;
      
      let query = supabase.from('beneficiarios').select('*', { count: 'exact' });

      // Aplicar los mismos filtros de la búsqueda original
      const { searchTerm, searchType } = currentSearchParams;
      
      if (searchTerm?.trim()) {
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
        <Header />
        
        <main className="max-w-7xl mx-auto py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
          
          {/* Hero Section */}
          <div className="mb-8 sm:mb-12">
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start space-x-4 mb-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                    <span className="hidden sm:inline">Gestión de Beneficiarios</span>
                    <span className="sm:hidden">Beneficiarios</span>
                  </h1>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                      <Search className="h-3 w-3 mr-1" />
                      Sistema Inteligente
                    </Badge>
                    {isAdmin && (
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin Access
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-base sm:text-lg text-gray-600 max-w-3xl leading-relaxed">
                {isAdmin ? (
                  "Busca beneficiarios existentes o procesa nuevos archivos Excel con información de convenios usando herramientas administrativas avanzadas."
                ) : (
                  "Accede al sistema de búsqueda inteligente para encontrar información de beneficiarios de convenios de manera rápida y eficiente."
                )}
              </p>
            </div>
          </div>

          {/* Tabs Container con diseño luxury */}
          <div className="w-full">
            <Tabs defaultValue="search" className="space-y-6 sm:space-y-8">
              
              {/* Tabs List - Diseño premium responsive */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-xl p-2">
                <TabsList className="grid w-full grid-cols-2 h-auto p-0 bg-transparent">
                  
                  {/* Tab Buscar - Para todos */}
                  <TabsTrigger 
                    value="search" 
                    className="relative flex items-center justify-center space-x-3 px-4 sm:px-6 py-4 sm:py-5 text-sm sm:text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 group hover:bg-gray-50"
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-100 group-data-[state=active]:bg-white/20 flex items-center justify-center transition-colors">
                      <Search className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 group-data-[state=active]:text-white" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="hidden xs:inline font-semibold">Buscar Beneficiarios</span>
                      <span className="xs:hidden font-semibold">Buscar</span>
                      <span className="text-xs opacity-80 hidden sm:block">Sistema inteligente</span>
                    </div>
                    <Sparkles className="h-4 w-4 text-green-500 group-data-[state=active]:text-white/80 opacity-60 group-data-[state=active]:opacity-100 hidden sm:block" />
                  </TabsTrigger>
                  
                  {/* Tab Subir - Solo Admin o Mensaje */}
                  {isAdmin ? (
                    <TabsTrigger 
                      value="upload" 
                      className="relative flex items-center justify-center space-x-3 px-4 sm:px-6 py-4 sm:py-5 text-sm sm:text-base font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 group hover:bg-gray-50"
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 group-data-[state=active]:bg-white/20 flex items-center justify-center transition-colors">
                        <Upload className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 group-data-[state=active]:text-white" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="hidden xs:inline font-semibold">Subir Archivos</span>
                        <span className="xs:hidden font-semibold">Subir</span>
                        <span className="text-xs opacity-80 hidden sm:block">Procesamiento masivo</span>
                      </div>
                      <Zap className="h-4 w-4 text-blue-500 group-data-[state=active]:text-white/80 opacity-60 group-data-[state=active]:opacity-100 hidden sm:block" />
                    </TabsTrigger>
                  ) : (
                    <div className="flex items-center justify-center space-x-3 px-4 sm:px-6 py-4 sm:py-5 text-sm sm:text-base text-gray-400 cursor-not-allowed rounded-xl bg-gray-50/50">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                        <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="hidden xs:inline font-medium">Solo Administradores</span>
                        <span className="xs:hidden font-medium">Admin</span>
                        <span className="text-xs opacity-60 hidden sm:block">Acceso restringido</span>
                      </div>
                    </div>
                  )}
                </TabsList>
              </div>

              {/* Tab Content - Buscar */}
              <TabsContent value="search" className="space-y-6 sm:space-y-8 mt-6 sm:mt-8">
                
                {/* Search Form Card */}
                <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-green-50/30 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5"></div>
                  <CardHeader className="pb-6 relative">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Search className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg sm:text-xl lg:text-2xl text-gray-900 flex items-center space-x-2">
                          <span>Búsqueda Inteligente</span>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 hidden sm:inline-flex">
                            <Sparkles className="h-3 w-3 mr-1" />
                            IA Powered
                          </Badge>
                        </CardTitle>
                        <p className="text-sm sm:text-base text-gray-600 mt-1">
                          Encuentra beneficiarios con filtros avanzados y resultados en tiempo real
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <SearchForm 
                      onSearch={setSearchResults}
                      setIsLoading={setIsLoading}
                      onSearchStateChange={(params, total, hasMore) => {
                        setCurrentSearchParams(params);
                        setTotalResults(total);
                        setHasMoreResults(hasMore);
                      }}
                    />
                  </CardContent>
                </Card>

                {/* Results */}
                <BeneficiariosList 
                  beneficiarios={searchResults}
                  isLoading={isLoading}
                  onLoadMore={handleLoadMore}
                  hasMore={hasMoreResults}
                  totalResults={totalResults}
                />
              </TabsContent>

              {/* Tab Content - Upload (Solo Admin) */}
              {isAdmin && (
                <TabsContent value="upload" className="mt-6 sm:mt-8">
                  <div className="space-y-6">
                    {/* Header del upload */}
                    <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50/30 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5"></div>
                      <CardHeader className="relative">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Upload className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg sm:text-xl lg:text-2xl text-gray-900 flex items-center space-x-2">
                              <span>Procesamiento de Archivos</span>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 hidden sm:inline-flex">
                                <Zap className="h-3 w-3 mr-1" />
                                Masivo
                              </Badge>
                            </CardTitle>
                            <p className="text-sm sm:text-base text-gray-600 mt-1">
                              Carga y procesa archivos Excel con validación automática y reportes detallados
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>

                    {/* Upload Section */}
                    <AdminOnly showMessage={true}>
                      <UploadSection />
                    </AdminOnly>
                  </div>
                </TabsContent>
              )}

              {/* Mensaje para consultores cuando intentan acceder a upload */}
              {!isAdmin && (
                <TabsContent value="upload" className="mt-6 sm:mt-8">
                  <Alert className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-lg">
                    <Shield className="h-5 w-5 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      <div className="space-y-2">
                        <p className="font-medium">Acceso Restringido</p>
                        <p className="text-sm">
                          La funcionalidad de carga de archivos está disponible exclusivamente para administradores del sistema. 
                          Como consultor, tienes acceso completo a las herramientas de búsqueda y consulta de beneficiarios.
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default SearchBeneficiarios;