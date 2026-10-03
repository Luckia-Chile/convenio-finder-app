// src/pages/Index.tsx
import React, { useEffect, useState } from 'react';
import { BRAND } from '@/config/app';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { RoleContent } from '@/components/auth/RoleGuard';
import { Header } from '@/components/layout/Header';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Search, FileText, Users, ArrowRight, Zap, Shield, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const { user } = useAuth();
  const { isAdmin, role } = useRole();
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 flex items-center justify-center p-4 transition-colors duration-500">
        <div className="text-center max-w-2xl mx-auto">
          {/* Logo Hero */}
          <div className="mb-8 flex justify-center">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-600 transition-all duration-300">
              <img 
                src={BRAND.logo} 
                alt={`${BRAND.company} Logo`} 
                className="h-20 w-auto mx-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 mb-4 transition-all duration-300">
            {BRAND.name}
          </h1>
          <p className="text-xl text-gray-800 dark:text-gray-100 mb-8 leading-relaxed transition-colors duration-300">
            Plataforma de gestión para acuerdos de consultoría
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 dark:from-blue-500 dark:to-purple-500 dark:hover:from-blue-600 dark:hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                <Zap className="h-5 w-5 mr-2" />
                Acceder al Sistema
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Contenido para administradores
  const AdminContent = () => (
    <div className="space-y-8">
      {/* Hero Section para Admin */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:bg-gradient-to-r dark:from-slate-800 dark:via-gray-800 dark:to-zinc-800 rounded-2xl p-8 text-white shadow-xl border border-purple-300 dark:border-gray-600 transition-all duration-500">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src={BRAND.logo} 
                alt={`${BRAND.company} Logo`} 
                className="h-12 w-auto filter brightness-0 invert"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <Shield className="h-8 w-8" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Panel de Administración</h2>
            <p className="text-blue-100 dark:text-gray-100 text-lg transition-colors duration-300">
              Gestiona acuerdos de consultoría, sube archivos Excel y controla el sistema completo
            </p>
          </div>
          <div className="text-center md:text-right bg-white/10 dark:bg-black/20 p-4 rounded-xl backdrop-blur-sm border border-white/20 dark:border-gray-500 transition-all duration-300">
            <div className="text-3xl font-bold text-white">{beneficiariosCount.toLocaleString()}</div>
            <div className="text-blue-100 dark:text-gray-100">Beneficiarios Registrados</div>
          </div>
        </div>
      </div>

      {/* Cards de Acciones - PERFECTAMENTE ALINEADAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Buscar Beneficiarios - ALTURA FIJA */}
        <Card className="hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-100 dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-700 border-0 dark:border dark:border-gray-600 hover:scale-105 h-full flex flex-col">
          <CardHeader className="flex-shrink-0">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 dark:from-green-600 dark:to-emerald-600 rounded-xl">
                <Search className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-green-800 dark:text-green-300 text-lg">Buscar Beneficiarios</CardTitle>
            </div>
            <CardDescription className="text-green-700 dark:text-gray-100 text-sm leading-relaxed min-h-[3rem] flex items-center">
              Encuentra información de beneficiarios de forma rápida y eficiente con nuestro sistema de búsqueda inteligente.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col justify-end pt-2">
            <Link to="/beneficiarios">
              <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 dark:from-green-600 dark:to-emerald-600 dark:hover:from-green-500 dark:hover:to-emerald-500 text-white shadow-lg h-12">
                <Search className="h-4 w-4 mr-2" />
                Buscar Ahora
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Card 2: Subir Archivos - ALTURA FIJA */}
        <Card className="hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-cyan-100 dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-700 border-0 dark:border dark:border-gray-600 hover:scale-105 h-full flex flex-col">
          <CardHeader className="flex-shrink-0">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600 rounded-xl">
                <Upload className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-blue-800 dark:text-blue-300 text-lg">Subir Archivos</CardTitle>
            </div>
            <CardDescription className="text-blue-700 dark:text-gray-100 text-sm leading-relaxed min-h-[3rem] flex items-center">
              Procesa archivos Excel masivamente con validación automática y reportes detallados de carga.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col justify-end pt-2">
            <Link to="/beneficiarios">
              <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 dark:from-blue-600 dark:to-cyan-600 dark:hover:from-blue-500 dark:hover:to-cyan-500 text-white shadow-lg h-12">
                <Upload className="h-4 w-4 mr-2" />
                Subir Archivos
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Card 3: Gestionar Convenios - ALTURA FIJA */}
        <Card className="hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-pink-100 dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-700 border-0 dark:border dark:border-gray-600 hover:scale-105 h-full flex flex-col">
          <CardHeader className="flex-shrink-0">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 rounded-xl">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-purple-800 dark:text-purple-300 text-lg">Gestionar Convenios</CardTitle>
            </div>
            <CardDescription className="text-purple-700 dark:text-gray-100 text-sm leading-relaxed min-h-[3rem] flex items-center">
              Administra y revisa todos los convenios de consultoría con herramientas avanzadas de gestión.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col justify-end pt-2">
            <Link to="/instituciones" className="w-full">
              <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 hover:from-purple-600 hover:to-pink-600 dark:hover:from-purple-700 dark:hover:to-pink-700 text-white h-12 shadow-lg hover:shadow-xl transition-all duration-300">
                <FileText className="h-4 w-4 mr-2" />
                Gestionar Ahora
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas del Sistema */}
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:bg-gradient-to-r dark:from-gray-800 dark:to-gray-700 border-0 dark:border dark:border-gray-600 shadow-lg transition-all duration-300">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-600 dark:to-purple-600 rounded-xl">
              <Users className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-gray-800 dark:text-white">Estado del Sistema</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white dark:bg-black/20 rounded-xl shadow-sm dark:shadow-gray-900/50 hover:scale-105 transition-transform duration-200">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">-</div>
              <div className="text-gray-800 dark:text-gray-100 font-medium">Archivos Subidos</div>
            </div>
            <div className="text-center p-6 bg-white dark:bg-black/20 rounded-xl shadow-sm dark:shadow-gray-900/50 hover:scale-105 transition-transform duration-200">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">{beneficiariosCount.toLocaleString()}</div>
              <div className="text-gray-800 dark:text-gray-100 font-medium">Beneficiarios Registrados</div>
            </div>
            <div className="text-center p-6 bg-white dark:bg-black/20 rounded-xl shadow-sm dark:shadow-gray-900/50 hover:scale-105 transition-transform duration-200">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">-</div>
              <div className="text-gray-800 dark:text-gray-100 font-medium">Convenios Activos</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Contenido para consultores
  const ConsultorContent = () => (
    <div className="space-y-8">
      {/* Hero Section para Consultor */}
      <div className="bg-gradient-to-r from-green-600 via-teal-600 to-cyan-600 dark:bg-gradient-to-r dark:from-slate-800 dark:via-gray-800 dark:to-zinc-800 rounded-2xl p-8 text-white shadow-xl border border-green-300 dark:border-gray-600 transition-all duration-500">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src={BRAND.logo} 
                alt={`${BRAND.company} Logo`} 
                className="h-12 w-auto filter brightness-0 invert"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <User className="h-8 w-8" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Panel de Consultor</h2>
            <p className="text-green-100 dark:text-gray-100 text-lg transition-colors duration-300">
              Utiliza el buscador para encontrar información de beneficiarios de manera eficiente
            </p>
          </div>
          <div className="text-center md:text-right bg-white/10 dark:bg-black/20 p-4 rounded-xl backdrop-blur-sm border border-white/20 dark:border-gray-500 transition-all duration-300">
            <div className="text-3xl font-bold text-white">{beneficiariosCount.toLocaleString()}</div>
            <div className="text-green-100 dark:text-gray-100">Beneficiarios Disponibles</div>
          </div>
        </div>
      </div>

      {/* Card Principal de Búsqueda */}
      <div className="max-w-2xl mx-auto">
        <Card className="hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-teal-50 to-cyan-100 dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-700 border-0 dark:border dark:border-gray-600 hover:scale-105">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 bg-gradient-to-r from-teal-500 to-cyan-500 dark:from-teal-600 dark:to-cyan-600 rounded-2xl w-fit">
              <Search className="h-12 w-12 text-white" />
            </div>
            <CardTitle className="text-2xl text-teal-800 dark:text-teal-300">Buscar Beneficiarios</CardTitle>
            <CardDescription className="text-teal-700 dark:text-gray-100 text-lg">
              Encuentra información de beneficiarios de forma rápida y eficiente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/beneficiarios">
              <Button className="w-full h-14 text-lg bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 dark:from-teal-600 dark:to-cyan-600 dark:hover:from-teal-500 dark:hover:to-cyan-500 text-white shadow-lg">
                <Search className="h-6 w-6 mr-3" />
                Buscar Beneficiarios
                <ArrowRight className="h-6 w-6 ml-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Información Adicional */}
        <div className="text-center mt-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:bg-gradient-to-r dark:from-gray-800 dark:to-gray-700 rounded-xl border-0 dark:border dark:border-gray-600 transition-all duration-300">
          <Users className="h-16 w-16 text-gray-700 dark:text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Acceso Completo</h3>
          <p className="text-gray-800 dark:text-gray-100">
            Consulta información completa de beneficiarios registrados en el sistema de manera segura y eficiente.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 transition-colors duration-500">
        <Header />
        
        <main className="max-w-7xl mx-auto py-8 px-4">
          <RoleContent
            adminContent={<AdminContent />}
            consultorContent={<ConsultorContent />}
            fallbackContent={<ConsultorContent />}
          />
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Index;