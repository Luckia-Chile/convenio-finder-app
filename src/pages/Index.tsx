
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Search, FileText, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const { user } = useAuth();
  const [beneficiariosCount, setBeneficiariosCount] = useState(0);

  useEffect(() => {
    const fetchBeneficiariosCount = async () => {
      if (user) {
        const { count } = await supabase
          .from('beneficiarios')
          .select('*', { count: 'exact', head: true });
        setBeneficiariosCount(count || 0);
      }
    };

    fetchBeneficiariosCount();
  }, [user]);

  // Show login link if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Sistema de Convenios
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Plataforma de gestión para acuerdos de consultoría
          </p>
          <Link to="/auth">
            <Button size="lg" className="px-8 py-3">
              Acceder al Sistema
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <main className="max-w-7xl mx-auto py-8 px-4">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Bienvenido al Sistema de Convenios
            </h2>
            <p className="text-gray-600">
              Gestiona acuerdos de consultoría, sube archivos Excel y busca beneficiarios de manera eficiente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Upload className="h-6 w-6 text-blue-600" />
                  <CardTitle>Subir Archivos</CardTitle>
                </div>
                <CardDescription>
                  Carga archivos Excel con información de convenios y beneficiarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/beneficiarios">
                  <Button className="w-full">
                    Ir a Subir Archivos
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Search className="h-6 w-6 text-green-600" />
                  <CardTitle>Buscar Beneficiarios</CardTitle>
                </div>
                <CardDescription>
                  Encuentra información de beneficiarios de forma rápida y eficiente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/beneficiarios">
                  <Button className="w-full">
                    Buscar Ahora
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <FileText className="h-6 w-6 text-purple-600" />
                  <CardTitle>Gestionar Convenios</CardTitle>
                </div>
                <CardDescription>
                  Administra y revisa todos los convenios de consultoría
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" disabled>
                  Próximamente
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="h-6 w-6 text-indigo-600" />
              <h3 className="text-xl font-semibold text-gray-900">Estado del Sistema</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">-</div>
                <div className="text-sm text-gray-600">Archivos Subidos</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{beneficiariosCount.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Beneficiarios Registrados</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">-</div>
                <div className="text-sm text-gray-600">Convenios Activos</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Index;
