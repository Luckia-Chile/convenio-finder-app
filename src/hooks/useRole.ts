// src/hooks/useRole.ts
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'admin' | 'consultor';

interface UseRoleReturn {
  role: UserRole;
  isAdmin: boolean;
  isConsultor: boolean;
  loading: boolean;
  error: string | null;
}

export const useRole = (): UseRoleReturn => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>('consultor');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        console.log('🔍 useRole: No hay usuario, usando fallback consultor');
        setRole('consultor');
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 useRole: Buscando rol para usuario:', user.email);
        setLoading(true);
        setError(null);

        const { data, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (roleError) {
          console.warn('🚨 useRole: Error al obtener rol:', roleError);
          setRole('consultor');
        } else {
          console.log('✅ useRole: Rol obtenido de BD:', data.role, 'para usuario:', user.email);
          setRole(data.role as UserRole);
        }

      } catch (error) {
        console.error('🚨 useRole: Error crítico:', error);
        setError('Error al cargar permisos');
        setRole('consultor');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  console.log('🔍 useRole: Estado actual ->', {
    userEmail: user?.email,
    role,
    isAdmin: role === 'admin',
    isConsultor: role === 'consultor',
    loading
  });

  return {
    role,
    isAdmin: role === 'admin',
    isConsultor: role === 'consultor',
    loading,
    error
  };
};

export const usePermissions = () => {
  const { isAdmin } = useRole();
  return {
    canUploadFiles: isAdmin,
    canViewStats: isAdmin,
    canSearch: true,
    canManageUsers: isAdmin
  };
};