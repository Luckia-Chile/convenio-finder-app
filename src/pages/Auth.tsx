
import React, { useState, useEffect } from 'react';
import { AuthForm } from '@/components/auth/AuthForm';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const Auth: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const { user, loading } = useAuth();

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400 transition-colors duration-500">Cargando...</p>
        </div>
      </div>
    );
  }

  // Redirect to home if user is already authenticated
  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 transition-colors duration-500">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white transition-colors duration-500">
            Sistema de Convenios
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 transition-colors duration-500">
            Plataforma de gestión para acuerdos de consultoría
          </p>
        </div>
        <AuthForm mode={mode} onToggleMode={toggleMode} />
      </div>
    </div>
  );
};

export default Auth;
