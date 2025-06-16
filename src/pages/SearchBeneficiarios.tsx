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
import { Badge } from '@/components/ui/badge';
import { Search, Upload, Users, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SearchBeneficiarios = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para paginación inteligente
  const [currentSearchParams, setCurrentSearchParams] = useState<any>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  
  const { toast } = useToast();
  const { isAdmin, role } = useRole();

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <Header />
        
        <main className="max-w-7xl mx-auto py-8 px-4">
          {/* Hero Section con Logo */}
          <div className="mb-8">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-white rounded-2xl shadow-lg">
                  <img 
                    src="/Logo_Luckia.svg" 
                    alt="Luckia Logo" 
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
              
              <p className="text-xl text-gray-600 mb-6 max-w-3xl mx-auto">
                {isAdmin 
                  ? 'Busca beneficiarios existentes o sube nuevos archivos Excel con información de convenios.'
                  : 'Busca beneficiarios existentes en el sistema de manera rápida y eficiente.'
                }
              </p>

              <div className="flex flex-wrap gap-3 justify-center">
                <Badge variant="secondary" className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800">
                  <Users className="h-4 w-4 mr-2" />
                  Sistema Activo
                </Badge>
                <Badge variant="secondary" className="px-4 py-2 bg-gradient-to-r from-green-100 to-teal-100 text-green-800">
                  <Zap className="h-4 w-4 mr-2" />
                  Búsqueda Inteligente
                </Badge>
                {isAdmin && (
                  <Badge variant="secondary" className="px-4 py-2 bg-gradient-to-r from-orange-100 to-red-100 text-orange-800">
                    <Upload className="h-4 w-4 mr-2" />
                    Carga Masiva
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Tabs con protección condicional - ARREGLADO */}
          <Tabs defaultValue="search" className="space-y-6">
            <div className="flex justify-center">
              <TabsList className={`grid ${isAdmin ? 'grid-cols-2 w-full max-w-md' : 'grid-cols-1 w-full max-w-xs'} h-12 bg-white shadow-lg rounded-xl border`}>
                <TabsTrigger 
                  value="search" 
                  className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg transition-all duration-300"
                >
                  <Search className="h-5 w-5" />
                  <span className="hidden sm:inline">Buscar Beneficiarios</span>
                  <span className="sm:hidden">Buscar</span>
                </TabsTrigger>
                
                {/* Tab Upload SOLO para admins - CORREGIDO */}
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
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
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
                    onSearchStateChange={(params, total, hasMore) => {
                      setCurrentSearchParams(params);
                      setTotalResults(total);
                      setHasMoreResults(hasMore);
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
              />
            </TabsContent>

            {/* Tab Content Upload SOLO para admins - CORREGIDO */}
            {isAdmin && (
              <TabsContent value="upload" className="space-y-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border-0 overflow-hidden">
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
                    {/* COMPONENTE UPLOAD SIN AdminOnly WRAPPER que causaba problemas */}
                    <UploadSection />
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