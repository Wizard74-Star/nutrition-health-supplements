import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase, safeInvoke } from '@/lib/supabase';

import type { User, Session } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: UserProfile | null;
  profileLoading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  updateDisplayName: (name: string) => Promise<{ error: string | null }>;
  updateProfile: (updates: Partial<Pick<UserProfile, 'display_name' | 'bio' | 'avatar_url'>>) => Promise<{ error: string | null }>;
  deleteAccount: () => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
  isAuthenticated: boolean;
  isRecoveryMode: boolean;
  clearRecoveryMode: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Fetch user profile from database
  const fetchProfile = useCallback(async (userId: string) => {
    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        // Profile might not exist yet (for users created before the trigger)
        // Try to create one
        if (error.code === 'PGRST116') {
          const { data: newProfile, error: insertError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: userId,
              display_name: '',
            })
            .select('*')
            .single();

          if (!insertError && newProfile) {
            setProfile(newProfile as UserProfile);
          }
        } else {
          console.error('Error fetching profile:', error);
        }
      } else if (data) {
        setProfile(data as UserProfile);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user?.id, fetchProfile]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      if (s?.user) {
        fetchProfile(s.user.id);
      }
    });

    // Listen for auth changes, including PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);

      // When user clicks the recovery link in their email, Supabase fires this event
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      }

      // Fetch profile on sign in
      if (event === 'SIGNED_IN' && s?.user) {
        fetchProfile(s.user.id);
      }

      // Clear profile on sign out
      if (event === 'SIGNED_OUT') {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = useCallback(async (email: string, password: string, name?: string): Promise<{ error: string | null }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name || '',
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      // If email confirmation is required
      if (data.user && !data.session) {
        return { error: null };
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'An unexpected error occurred' };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'An unexpected error occurred' };
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsRecoveryMode(false);
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<{ error: string | null }> => {
    try {
      const redirectUrl = `${window.location.origin}${window.location.pathname}`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'An unexpected error occurred' };
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { error: error.message };
      }

      setIsRecoveryMode(false);
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'An unexpected error occurred' };
    }
  }, []);

  const updateDisplayName = useCallback(async (name: string): Promise<{ error: string | null }> => {
    try {
      // Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: name },
      });

      if (authError) {
        return { error: authError.message };
      }

      // Update profile table
      if (user?.id) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({ display_name: name, updated_at: new Date().toISOString() })
          .eq('user_id', user.id);

        if (profileError) {
          console.error('Error updating profile display name:', profileError);
        }

        // Refresh the profile
        await fetchProfile(user.id);
      }

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'An unexpected error occurred' };
    }
  }, [user?.id, fetchProfile]);

  const updateProfile = useCallback(async (updates: Partial<Pick<UserProfile, 'display_name' | 'bio' | 'avatar_url'>>): Promise<{ error: string | null }> => {
    try {
      if (!user?.id) {
        return { error: 'Not authenticated' };
      }

      const updateData: Record<string, any> = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      // If display_name is being updated, also update auth metadata
      if (updates.display_name !== undefined) {
        const { error: authError } = await supabase.auth.updateUser({
          data: { full_name: updates.display_name },
        });
        if (authError) {
          return { error: authError.message };
        }
      }

      const { error: profileError } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (profileError) {
        return { error: profileError.message };
      }

      // Refresh profile
      await fetchProfile(user.id);
      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'An unexpected error occurred' };
    }
  }, [user?.id, fetchProfile]);

  const deleteAccount = useCallback(async (): Promise<{ error: string | null }> => {
    try {
      const { data, error } = await safeInvoke('delete-user-account', {
        body: {},
      });

      if (error) {
        return { error: error.message || 'Failed to delete account. The delete-user-account edge function may not be deployed.' };
      }

      if (data?.error) {
        return { error: data.error };
      }

      // Clear local state
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsRecoveryMode(false);

      // Sign out locally
      await supabase.auth.signOut();

      return { error: null };
    } catch (err: any) {
      return { error: err.message || 'An unexpected error occurred' };
    }
  }, []);


  const clearRecoveryMode = useCallback(() => {
    setIsRecoveryMode(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        profile,
        profileLoading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        updateDisplayName,
        updateProfile,
        deleteAccount,
        refreshProfile,
        isAuthenticated: !!user,
        isRecoveryMode,
        clearRecoveryMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
