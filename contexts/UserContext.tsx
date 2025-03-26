import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UserDetails {
  user_id: string;
  name: string;
  email: string;
}

interface UserContextType {
  user: User | null;
  session: Session | null;
  userDetails: UserDetails | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserDetails = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('Users')
        .select('user_id, name, email')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setUserDetails(data);
    } catch (error) {
      console.error('Error loading user details:', error);
      setUserDetails(null);
    }
  };

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserDetails(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserDetails(session.user.id);
      } else {
        setUserDetails(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      // 1. Sign up the user with Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) return { error: signUpError };
      if (!authData.user) return { error: new Error('Failed to create user') };

      // 2. Insert user data into Users table
      const { error: insertError } = await supabase
        .from('Users')
        .insert([
          {
            user_id: authData.user.id,
            email: email,
            name: name,
          }
        ]);

      if (insertError) return { error: insertError };

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserDetails(null);
  };

  const value = {
    user,
    session,
    userDetails,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <UserContext.Provider value={value}>
      {!loading && children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
