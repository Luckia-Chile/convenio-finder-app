// src/hooks/useRole.ts
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/secureLogger';

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
        logger.role('No user found, using fallback consultor role');
        setRole('consultor');
        setLoading(false);
        return;
      }

      try {
        logger.role('Fetching role for user', { hasUser: true });
        setLoading(true);
        setError(null);

        const { data, error: roleError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (roleError) {
          logger.warn('Error fetching user role', roleError, { context: 'ROLE' });
          setRole('consultor');
        } else {
          logger.role('Role fetched from database', { role: data.role, hasData: true });
          setRole(data.role as UserRole);
        }

      } catch (error) {
        logger.error('Critical error fetching role', error, { context: 'ROLE' });
        setError('Error al cargar permisos');
        setRole('consultor');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  logger.role('Current role state', {
    hasUser: !!user,
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