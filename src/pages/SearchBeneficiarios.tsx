import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SearchForm } from '@/components/beneficiarios/SearchForm';
import { BeneficiariosList } from '@/components/beneficiarios/BeneficiariosList';
import { UploadSection } from '@/components/beneficiarios/UploadSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Upload } from 'lucide-react';
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
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-7xl mx-auto py-8 px-4">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Gestión de Beneficiarios
            </h2>
            <p className="text-gray-600">
              Busca beneficiarios existentes o sube nuevos archivos Excel con información de convenios.
            </p>
          </div>

          <Tabs defaultValue="search" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search" className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>Buscar Beneficiarios</span>
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Subir Archivos</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Buscar Beneficiarios</CardTitle>
                </CardHeader>
                <CardContent>
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

            <TabsContent value="upload">
              <UploadSection />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default SearchBeneficiarios;