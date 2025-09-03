// src/components/layout/Header.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Shield, User, Menu, X, Moon, Sun } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';

export const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const { role, isAdmin, loading } = useRole();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Reset signing out state when user becomes null (logout successful)
  useEffect(() => {
    if (!user && isSigningOut) {
      console.log('🔄 User is null, resetting isSigningOut state');
      setIsSigningOut(false);
    }
  }, [user, isSigningOut]);

  const handleSignOut = async () => {
    try {
      console.log('🎯 handleSignOut called');
      console.log('🎯 signOut function exists:', !!signOut);
      console.log('🎯 current user:', user);
      
      if (!signOut) {
        console.error('❌ signOut function no está disponible');
        return;
      }
      
      setIsSigningOut(true);
      setMobileMenuOpen(false);
      
      console.log('🎯 Calling signOut...');
      await signOut();
      console.log('🎯 signOut call completed');
      
    } catch (error) {
      console.error('❌ Error en handleSignOut:', error);
      setIsSigningOut(false);
    }
  };

  const getRoleBadge = () => {
    if (loading) {
      return (
        <Badge variant="secondary" className="text-xs px-2 py-1 animate-pulse">
          <div className="w-12 h-3 bg-gray-300 rounded"></div>
        </Badge>
      );
    }

    return (
      <Badge 
        variant={isAdmin ? "default" : "secondary"}
        className={`text-xs px-3 py-1 flex items-center space-x-1 ${
          isAdmin 
            ? 'bg-blue-600 text-white hover:bg-blue-700' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        <Shield className="h-3 w-3" />
        <span className="hidden sm:inline">
          {isAdmin ? 'Administrador' : 'Consultor'}
        </span>
        <span className="sm:hidden">
          {isAdmin ? 'Admin' : 'Consul'}
        </span>
      </Badge>
    );
  };

  if (!user) return null;

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          
          {/* Logo y Título CLICKEABLE */}
          <Link to="/" className="flex items-center space-x-3 min-w-0 flex-1 group transition-all duration-200 hover:opacity-80">
            {/* Logo de Luckia */}
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl overflow-hidden bg-white shadow-lg group-hover:shadow-xl transition-all duration-300 p-1 group-hover:scale-105">
                <img 
                  src="/Logo_Luckia.svg" 
                  alt="Luckia Logo"
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              {/* Efecto de brillo sutil */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                <span className="hidden sm:inline">Sistema de Convenios</span>
                <span className="sm:hidden">Convenios</span>
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden lg:block group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors duration-200">
                Powered by Luckia
              </p>
            </div>
          </Link>

          {/* Desktop: Info del Usuario */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-white" translate="no">
                  {user.email}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Conectado</div>
              </div>
              {getRoleBadge()}
            </div>
            
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-yellow-500" />
              ) : (
                <Moon className="h-4 w-4 text-gray-700" />
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="flex items-center space-x-2 hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-600"
            >
              {isSigningOut ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  <span>Saliendo...</span>
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  <span>Salir</span>
                </>
              )}
            </Button>
          </div>

          {/* Mobile: Badge + Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            {getRoleBadge()}
            
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2"
                  aria-label="Abrir menú"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <div className="flex items-center justify-between">
                    <SheetTitle className="text-left flex items-center space-x-3">
                      {/* Logo en el menú móvil - CLICKEABLE */}
                      <Link 
                        to="/" 
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center space-x-3 group transition-all duration-200 hover:opacity-80"
                      >
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-white shadow-md group-hover:shadow-lg transition-all duration-200">
                          <img 
                            src="/Logo_Luckia.svg" 
                            alt="Luckia Logo"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="group-hover:text-blue-600 transition-colors duration-200">Mi Cuenta</span>
                      </Link>
                    </SheetTitle>
                    <SheetClose asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <X className="h-4 w-4" />
                      </Button>
                    </SheetClose>
                  </div>
                </SheetHeader>
                
                <div className="mt-6 space-y-4">
                  {/* Info del Usuario */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-sm font-medium text-gray-900 dark:text-white mb-1" translate="no">
                      {user.email}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      Usuario conectado
                    </div>
                    {getRoleBadge()}
                  </div>

                  {/* Theme Toggle Mobile */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {theme === 'dark' ? (
                        <Moon className="h-5 w-5 text-blue-500" />
                      ) : (
                        <Sun className="h-5 w-5 text-yellow-500" />
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Modo {theme === 'dark' ? 'oscuro' : 'claro'}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleTheme}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      {theme === 'dark' ? (
                        <Sun className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <Moon className="h-4 w-4 text-gray-700" />
                      )}
                    </Button>
                  </div>

                  {/* Información de empresa */}
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border">
                    <Link 
                      to="/" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="block group transition-all duration-200 hover:opacity-80"
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-6 h-6 rounded overflow-hidden">
                          <img 
                            src="/Logo_Luckia.svg" 
                            alt="Luckia Logo"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">Luckia</span>
                      </div>
                      <p className="text-xs text-gray-600 group-hover:text-blue-500 transition-colors duration-200">
                        Sistema de gestión de convenios empresariales
                      </p>
                      <p className="text-xs text-blue-600 mt-1 font-medium">
                        👆 Toca para ir al dashboard principal
                      </p>
                    </Link>
                  </div>

                  {/* Botón de Salir */}
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="w-full flex items-center justify-center space-x-2 h-11"
                  >
                    {isSigningOut ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        <span>Cerrando Sesión...</span>
                      </>
                    ) : (
                      <>
                        <LogOut className="h-4 w-4" />
                        <span>Cerrar Sesión</span>
                      </>
                    )}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};