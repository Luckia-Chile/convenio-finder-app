import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Solo informativo para la UI: la autorización real la aplica la base de datos (is_super_admin()).
export const useSuperAdmin = () => {
  const { user } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!user) {
      setIsSuperAdmin(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase.rpc('is_super_admin').then(({ data, error }) => {
      if (!active) return;
      setIsSuperAdmin(!error && data === true);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user]);

  return { isSuperAdmin, loading };
};
