// src/components/auth/RoleGuard.tsx
import React from 'react';
import { useRole } from '@/hooks/useRole';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'consultor';
  fallback?: React.ReactNode;
  showMessage?: boolean;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ 
  children, 
  requiredRole = 'admin',
  fallback = null,
  showMessage = false
}) => {
  const { role, loading, error } = useRole();

  if (loading || error) {
    return <>{children}</>;
  }

  const hasPermission = requiredRole === 'consultor' ? true : role === 'admin';

  if (hasPermission) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showMessage) {
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <Lock className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          Esta funcionalidad requiere permisos de administrador.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

export const AdminOnly: React.FC<{ children: React.ReactNode; showMessage?: boolean }> = ({ 
  children, 
  showMessage = false 
}) => {
  return (
    <RoleGuard requiredRole="admin" showMessage={showMessage}>
      {children}
    </RoleGuard>
  );
};

export const RoleContent: React.FC<{
  adminContent?: React.ReactNode;
  consultorContent?: React.ReactNode;
  fallbackContent?: React.ReactNode;
}> = ({ adminContent, consultorContent, fallbackContent }) => {
  const { role, loading } = useRole();

  if (loading) {
    return <>{fallbackContent || consultorContent}</>;
  }

  if (role === 'admin' && adminContent) {
    return <>{adminContent}</>;
  }

  if (role === 'consultor' && consultorContent) {
    return <>{consultorContent}</>;
  }

  return <>{fallbackContent}</>;
};