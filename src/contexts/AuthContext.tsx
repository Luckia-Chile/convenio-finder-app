
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/secureLogger';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        logger.auth('Auth state changed', { event, hasSession: !!session, hasUser: !!session?.user });
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // If signing out, clear any local storage or cached data
        if (event === 'SIGNED_OUT') {
          logger.auth('User signed out, clearing state');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      logger.auth('Initial session check', { hasSession: !!session, hasUser: !!session?.user });
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    try {
      logger.auth('Starting signOut process', { hasUser: !!user, hasSession: !!session });
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.error('Error during signOut', error, { context: 'AUTH' });
        throw error;
      }
      
      logger.auth('SignOut completed successfully');
      
      // Force immediate state update in case the listener doesn't trigger
      logger.auth('Manually clearing user state');
      setUser(null);
      setSession(null);
      
      // Clear any local storage tokens manually
      try {
        const keys = Object.keys(localStorage);
        const clearedKeys: string[] = [];
        keys.forEach(key => {
          if (key.includes('supabase') || key.includes('sb-')) {
            localStorage.removeItem(key);
            clearedKeys.push(key);
          }
        });
        logger.auth('Cleared localStorage keys', { count: clearedKeys.length });
      } catch (storageError) {
        logger.warn('Could not clear localStorage', storageError, { context: 'AUTH' });
      }
      
    } catch (error) {
      logger.error('SignOut failed', error, { context: 'AUTH' });
      throw error;
    }
  };

  const value = {
    user,
    session,
    signUp,
    signIn,
    signOut,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
