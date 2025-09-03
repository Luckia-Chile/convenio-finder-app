
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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
        console.log('🔔 Auth state changed:', event, session);
        console.log('🔔 User before:', user);
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        console.log('🔔 User after:', session?.user ?? null);
        
        // If signing out, clear any local storage or cached data
        if (event === 'SIGNED_OUT') {
          console.log('🚪 User signed out, clearing state');
          localStorage.removeItem('sb-' + supabase.supabaseUrl.split('//')[1] + '-auth-token');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔍 Initial session check:', session);
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
      console.log('🚪 Starting signOut process...');
      console.log('🚪 Current user:', user);
      console.log('🚪 Current session:', session);
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Error during signOut:', error);
        throw error;
      }
      
      console.log('✅ SignOut completed successfully');
      
      // Force immediate state update in case the listener doesn't trigger
      console.log('🔄 Manually clearing user state...');
      setUser(null);
      setSession(null);
      
      // Clear any local storage tokens manually
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes('supabase') || key.includes('sb-')) {
            localStorage.removeItem(key);
            console.log('🗑️ Cleared localStorage key:', key);
          }
        });
      } catch (storageError) {
        console.warn('⚠️ Could not clear localStorage:', storageError);
      }
      
    } catch (error) {
      console.error('❌ SignOut failed:', error);
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
