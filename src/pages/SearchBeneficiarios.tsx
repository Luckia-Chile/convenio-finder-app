
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

const SearchBeneficiarios = () => {
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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
                  />
                </CardContent>
              </Card>

              <BeneficiariosList 
                beneficiarios={searchResults}
                isLoading={isLoading}
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
