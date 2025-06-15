// src/components/layout/Header.tsx
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole'; // IMPORT DIRECTO
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LogOut, Shield, User } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, signOut } = useAuth();
  const { role, loading } = useRole(); // USAR HOOK DIRECTAMENTE

  if (!user) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const getRoleBadge = () => {
    if (loading) {
      return (
        <Badge variant="outline" className="text-xs">
          <div className="flex items-center space-x-1">
            <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
            <span>Cargando...</span>
          </div>
        </Badge>
      );
    }

    const isAdmin = role === 'admin';
    
    return (
      <Badge 
        variant={isAdmin ? "default" : "secondary"} 
        className={`text-xs ${isAdmin ? 'bg-blue-600 text-white' : 'bg-gray-500 text-white'}`}
      >
        <div className="flex items-center space-x-1">
          {isAdmin ? (
            <Shield className="h-3 w-3" />
          ) : (
            <User className="h-3 w-3" />
          )}
          <span>{isAdmin ? 'Administrador' : 'Consultor'}</span>
        </div>
      </Badge>
    );
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">
              Sistema de Convenios
            </h1>
            
            {/* Indicador de rol */}
            {getRoleBadge()}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {user.email}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};