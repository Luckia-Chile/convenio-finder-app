// src/hooks/useRole.ts
import { usePermissionsState, type UserRole } from '@/contexts/PermissionsContext';

export type { UserRole };

interface UseRoleReturn {
  role: UserRole;
  isAdmin: boolean;
  isConsultor: boolean;
  loading: boolean;
  error: string | null;
}

export const useRole = (): UseRoleReturn => {
  const { role, loading, error } = usePermissionsState();
  return {
    role,
    isAdmin: role === 'admin',
    isConsultor: role === 'consultor',
    loading,
    error,
  };
};

export const usePermissions = () => {
  const { isAdmin } = useRole();
  return {
    canUploadFiles: isAdmin,
    canViewStats: isAdmin,
    canSearch: true,
    canManageUsers: isAdmin,
  };
};
