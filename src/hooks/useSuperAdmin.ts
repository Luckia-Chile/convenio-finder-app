import { usePermissionsState } from '@/contexts/PermissionsContext';

// Solo informativo para la UI: la autorización real la aplica la base de datos (is_super_admin()).
export const useSuperAdmin = () => {
  const { isSuperAdmin, loading } = usePermissionsState();
  return { isSuperAdmin, loading };
};
