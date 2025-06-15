// src/pages/Index.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { RoleContent } from '@/components/auth/RoleGuard';
import { Header } from '@/components/layout/Header';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Search, FileText, Users, BarChart3, TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

const Index = () => {
  const { user } = useAuth();
  const { role, isAdmin, loading } = useRole();
  const [beneficiariosCount, setBeneficiariosCount] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchBeneficiariosCount = async () => {
      if (user) {
        try {
          setLoadingStats(true);
          const { count } = await supabase
            .from('beneficiarios')
            .select('*', { count: 'exact', head: true });
          setBeneficiariosCount(count || 0);
        } catch (error) {
          console.error('Error al obtener estadísticas:', error);
        } finally {
          setLoadingStats(false);
        }
      }
    };

    fetchBeneficiariosCount();
  }, [user]);

  // Show login screen if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          {/* Logo de Luckia Principal */}
          <div className="relative group mb-8">
            <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto bg-white rounded-3xl shadow-2xl p-4 group-hover:shadow-3xl transition-all duration-500 group-hover:scale-105">
              <img 
                src="/Logo_Luckia.svg" 
                alt="Luckia Logo"
                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            {/* Efecto de brillo animado */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 animate-pulse"></div>
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent mb-4">
            Sistema de Convenios
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-600 mb-2 leading-relaxed">
            Plataforma inteligente para la gestión de acuerdos de consultoría
          </p>
          
          <p className="text-sm text-gray-500 mb-8 flex items-center justify-center space-x-2">
            <span>Powered by</span>
            <div className="w-4 h-4">
              <img 
                src="/Logo_Luckia.svg" 
                alt="Luckia"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-semibold">Luckia</span>
          </p>
          
          <Link to="/auth">
            <Button 
              size="lg" 
              className="px-8 py-4 text-lg font-medium h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 group"
            >
              <span>Acceder al Sistema</span>
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
        <Header />
        
        <main className="max-w-7xl mx-auto py-6 sm:py-8 lg:py-12 px-4 sm:px-6 lg:px-8">
          
          {/* Hero Section */}
          <div className="mb-8 sm:mb-12">
            <RoleContent
              adminContent={
                <div className="text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start space-x-4 mb-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-2xl p-2 shadow-lg border border-gray-100">
                      <img 
                        src="/Logo_Luckia.svg" 
                        alt="Luckia Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                        Panel de Administración
                      </h1>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="default" className="bg-blue-100 text-blue-700 border-blue-200">
                          <BarChart3 className="h-3 w-3 mr-1" />
                          Acceso Completo
                        </Badge>
                        <Badge variant="outline" className="text-gray-600 border-gray-200">
                          <div className="w-3 h-3 mr-1">
                            <img src="/Logo_Luckia.svg" alt="Luckia" className="w-full h-full object-contain" />
                          </div>
                          Luckia
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-base sm:text-lg text-gray-600 max-w-3xl leading-relaxed">
                    Gestiona acuerdos de consultoría, sube archivos Excel y supervisa el sistema completo con herramientas avanzadas.
                  </p>
                </div>
              }
              consultorContent={
                <div className="text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start space-x-4 mb-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-2xl p-2 shadow-lg border border-gray-100">
                      <img 
                        src="/Logo_Luckia.svg" 
                        alt="Luckia Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-emerald-900 bg-clip-text text-transparent">
                        Panel de Consultor
                      </h1>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          <Users className="h-3 w-3 mr-1" />
                          Solo Consulta
                        </Badge>
                        <Badge variant="outline" className="text-gray-600 border-gray-200">
                          <div className="w-3 h-3 mr-1">
                            <img src="/Logo_Luckia.svg" alt="Luckia" className="w-full h-full object-contain" />
                          </div>
                          Luckia
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-base sm:text-lg text-gray-600 max-w-3xl leading-relaxed">
                    Accede a herramientas especializadas para consultar información de beneficiarios de manera rápida y eficiente.
                  </p>
                </div>
              }
            />
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 mb-8 sm:mb-12">
            
            {/* Buscar Beneficiarios - Para todos */}
            <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg hover:scale-[1.02] bg-gradient-to-br from-white to-green-50/50">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Search className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg sm:text-xl text-gray-900 group-hover:text-green-700 transition-colors">
                      Buscar Beneficiarios
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base mt-1">
                      Encuentra información rápida y precisa
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 mb-4">
                  Sistema de búsqueda inteligente con filtros avanzados y resultados en tiempo real.
                </p>
                <Link to="/beneficiarios">
                  <Button className="w-full h-12 text-base font-medium bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 group-hover:shadow-lg transition-all">
                    <Search className="h-4 w-4 mr-2" />
                    Buscar Ahora
                    <ArrowRight className="h-4 w-4 ml-auto group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Subir Archivos - Solo Admin */}
            <RoleContent
              adminContent={
                <Card className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg hover:scale-[1.02] bg-gradient-to-br from-white to-blue-50/50">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Upload className="h-7 w-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg sm:text-xl text-gray-900 group-hover:text-blue-700 transition-colors">
                          Subir Archivos
                        </CardTitle>
                        <CardDescription className="text-sm sm:text-base mt-1">
                          Procesa archivos Excel masivamente
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 mb-4">
                      Carga y procesa miles de registros con validación automática y reportes detallados.
                    </p>
                    <Link to="/beneficiarios">
                      <Button className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 group-hover:shadow-lg transition-all">
                        <Upload className="h-4 w-4 mr-2" />
                        Subir Archivos
                        <ArrowRight className="h-4 w-4 ml-auto group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              }
            />

            {/* Gestionar Convenios - Para todos (próximamente) */}
            <Card className="group transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-purple-50/50 opacity-75">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                    <FileText className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg sm:text-xl text-gray-900">
                      Gestionar Convenios
                    </CardTitle>
                    <CardDescription className="text-sm sm:text-base mt-1">
                      Administra acuerdos y contratos
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 mb-4">
                  Herramientas avanzadas para administrar y revisar todos los convenios de consultoría.
                </p>
                <Button disabled className="w-full h-12 text-base font-medium bg-gray-200 text-gray-500 cursor-not-allowed">
                  <FileText className="h-4 w-4 mr-2" />
                  Próximamente
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sistema de Estadísticas - Solo Admin */}
          <RoleContent
            adminContent={
              <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-indigo-50/50 relative overflow-hidden">
                <CardHeader className="pb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <TrendingUp className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl sm:text-2xl text-gray-900">Estado del Sistema</CardTitle>
                      <p className="text-sm sm:text-base text-gray-600 mt-1 flex items-center space-x-2">
                        <span>Métricas en tiempo real</span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <span>Powered by</span>
                          <div className="w-4 h-4">
                            <img src="/Logo_Luckia.svg" alt="Luckia" className="w-full h-full object-contain" />
                          </div>
                        </span>
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    
                    {/* Archivos Subidos */}
                    <div className="p-6 bg-white/80 rounded-2xl border border-blue-100 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                          <Upload className="h-5 w-5 text-white" />
                        </div>
                        <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                          Total
                        </Badge>
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                        {loadingStats ? (
                          <div className="h-8 w-8 bg-blue-100 rounded animate-pulse"></div>
                        ) : (
                          <span>-</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="hidden sm:inline">Archivos Procesados</span>
                        <span className="sm:hidden">Archivos</span>
                      </div>
                    </div>

                    {/* Beneficiarios Registrados */}
                    <div className="p-6 bg-white/80 rounded-2xl border border-emerald-100 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                          Activos
                        </Badge>
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                        {loadingStats ? (
                          <div className="h-8 w-20 bg-emerald-100 rounded animate-pulse"></div>
                        ) : (
                          <span>{beneficiariosCount.toLocaleString()}</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="hidden sm:inline">Beneficiarios Registrados</span>
                        <span className="sm:hidden">Beneficiarios</span>
                      </div>
                    </div>

                    {/* Convenios Activos */}
                    <div className="p-6 bg-white/80 rounded-2xl border border-purple-100 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <FileText className="h-5 w-5 text-white" />
                        </div>
                        <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">
                          Vigentes
                        </Badge>
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                        {loadingStats ? (
                          <div className="h-8 w-8 bg-purple-100 rounded animate-pulse"></div>
                        ) : (
                          <span>-</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="hidden sm:inline">Convenios Activos</span>
                        <span className="sm:hidden">Convenios</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            }
          />
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Index;