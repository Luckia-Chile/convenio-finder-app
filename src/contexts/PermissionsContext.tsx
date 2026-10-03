import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/secureLogger';

export type UserRole = 'admin' | 'consultor';

interface PermissionsState {
  userId: string | null; // dueño de estos permisos
  role: UserRole;
  isSuperAdmin: boolean;
  loading: boolean;
  error: string | null;
}

const DEFAULT_STATE: PermissionsState = { userId: null, role: 'consultor', isSuperAdmin: false, loading: true, error: null };

const PermissionsContext = createContext<PermissionsState>(DEFAULT_STATE);

/**
 * Carga rol y condición de super admin UNA sola vez por sesión (antes cada componente
 * que usaba useRole/useSuperAdmin hacía sus propias consultas). Solo informativo para la UI:
 * la autorización real la aplica la base de datos (RLS y funciones).
 */
export const PermissionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id;
  const [state, setState] = useState<PermissionsState>(DEFAULT_STATE);
  const currentId = userId ?? null;

  useEffect(() => {
    let active = true;

    if (!userId) {
      setState({ userId: null, role: 'consultor', isSuperAdmin: false, loading: false, error: null });
      return;
    }

    setState({ userId, role: 'consultor', isSuperAdmin: false, loading: true, error: null });

    Promise.all([
      supabase.from('profiles').select('role').eq('id', userId).single(),
      supabase.rpc('is_super_admin'),
    ])
      .then(([profile, superAdmin]) => {
        if (!active) return;
        if (profile.error) logger.warn('Error fetching user role', profile.error, { context: 'ROLE' });
        setState({
          userId,
          role: !profile.error && profile.data?.role === 'admin' ? 'admin' : 'consultor',
          isSuperAdmin: !superAdmin.error && superAdmin.data === true,
          loading: false,
          error: profile.error ? 'Error al cargar permisos' : null,
        });
      })
      .catch((err) => {
        if (!active) return;
        logger.error('Critical error fetching permissions', err, { context: 'ROLE' });
        setState({ userId, role: 'consultor', isSuperAdmin: false, loading: false, error: 'Error al cargar permisos' });
      });

    return () => {
      active = false;
    };
  }, [userId]);

  // Fail-closed: permisos de otro usuario (o aún sin cargar) nunca se aplican al usuario actual.
  const value: PermissionsState =
    currentId && state.userId !== currentId
      ? { userId: currentId, role: 'consultor', isSuperAdmin: false, loading: true, error: null }
      : state;

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
};

export const usePermissionsState = () => useContext(PermissionsContext);
