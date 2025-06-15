// src/components/layout/Header.tsx
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Shield, User, Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';

export const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const { role, isAdmin, loading } = useRole();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
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
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          
          {/* Logo y Título */}
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {/* Logo de Luckia */}
            <div className="relative group flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl overflow-hidden bg-white shadow-lg group-hover:shadow-xl transition-all duration-300 p-1">
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
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                <span className="hidden sm:inline">Sistema de Convenios</span>
                <span className="sm:hidden">Convenios</span>
              </h1>
              <p className="text-xs text-gray-500 hidden lg:block">
                Powered by Luckia
              </p>
            </div>
          </div>

          {/* Desktop: Info del Usuario */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900" translate="no">
                  {user.email}
                </div>
                <div className="text-xs text-gray-500">Conectado</div>
              </div>
              {getRoleBadge()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center space-x-2 hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4" />
              <span>Salir</span>
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
                      {/* Logo en el menú móvil */}
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-white shadow-md">
                        <img 
                          src="/Logo_Luckia.svg" 
                          alt="Luckia Logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span>Mi Cuenta</span>
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
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-900 mb-1" translate="no">
                      {user.email}
                    </div>
                    <div className="text-xs text-gray-500 mb-3">
                      Usuario conectado
                    </div>
                    {getRoleBadge()}
                  </div>

                  {/* Información de empresa */}
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-6 h-6 rounded overflow-hidden">
                        <img 
                          src="/Logo_Luckia.svg" 
                          alt="Luckia Logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900">Luckia</span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Sistema de gestión de convenios empresariales
                    </p>
                  </div>

                  {/* Botón de Salir */}
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center space-x-2 h-11"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Cerrar Sesión</span>
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