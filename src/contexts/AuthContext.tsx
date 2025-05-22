'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import * as authService from '@/lib/supabase/auth';
import { UserProfile } from '@/lib/supabase/types';
import * as dbService from '@/lib/supabase/db';
import * as adminDbService from '@/lib/supabase/adminDb';

// Define the context type
type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  hasRole: (role: string) => boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    metadata?: { first_name?: string; last_name?: string }
  ) => Promise<{ error: Error | null }>;
  signInWithOAuth: (provider: 'google') => Promise<void>;
  signOut: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (password: string) => Promise<{ error: Error | null }>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<{ error: Error | null }>;
};

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  isLoading: true,
  isAdmin: false,
  isManager: false,
  hasRole: () => false,
  signIn: async () => ({ error: new Error('AuthContext not initialized') }),
  signUp: async () => ({ error: new Error('AuthContext not initialized') }),
  signInWithOAuth: async () => {},
  signOut: async () => ({ error: new Error('AuthContext not initialized') }),
  resetPassword: async () => ({ error: new Error('AuthContext not initialized') }),
  updatePassword: async () => ({ error: new Error('AuthContext not initialized') }),
  updateProfile: async () => ({ error: new Error('AuthContext not initialized') }),
});

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get current session
        const { session: currentSession } = await authService.getSession();
        setSession(currentSession);

        if (currentSession?.user) {
          setUser(currentSession.user);

          // Fetch user profile
          const { data: userProfile } = await dbService.getUserProfile(currentSession.user.id);
          setProfile(userProfile);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: authListener } = authService.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user || null);

      if (session?.user) {
        // Fetch or create user profile
        const { data: userProfile } = await dbService.getUserProfile(session.user.id);

        if (!userProfile) {
          // Create profile if it doesn't exist
          const metadata = session.user.user_metadata;

          // Extract user data from metadata - handles both email and OAuth sign-ins
          const userData = {
            first_name: metadata?.first_name || metadata?.given_name || metadata?.name?.split(' ')[0] || '',
            last_name: metadata?.last_name || metadata?.family_name || (metadata?.name?.split(' ').length > 1 ? metadata?.name?.split(' ').slice(1).join(' ') : '') || '',
          };

          console.log('Creating user profile for', session.user.id, 'with data:', userData);

          // Try to create profile using admin service to bypass RLS
          const { error: profileError } = await adminDbService.createUserProfile(session.user.id, userData);

          if (profileError) {
            console.error('Error creating user profile with admin service:', profileError);
            // Fallback to regular auth service
            await authService.createUserProfile(session.user.id, userData);
          }

          // Fetch the newly created profile
          const { data: newProfile } = await dbService.getUserProfile(session.user.id);
          setProfile(newProfile);
        } else {
          setProfile(userProfile);
        }
      } else {
        setProfile(null);
      }
    });

    // Clean up the listener
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await authService.signIn(email, password);
      if (error) return { error };
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Sign up function
  const signUp = async (
    email: string,
    password: string,
    metadata?: { first_name?: string; last_name?: string }
  ) => {
    try {
      const { error, user } = await authService.signUp(email, password, metadata);
      if (error) return { error };

      // Create user profile
      if (user) {
        try {
          // Try to create profile using admin service to bypass RLS
          const { error: profileError } = await adminDbService.createUserProfile(user.id, metadata || {});

          if (profileError) {
            console.error('Error creating user profile with admin service:', profileError);
            // Fallback to regular auth service
            await authService.createUserProfile(user.id, metadata || {});
          }

          console.log('User profile created successfully for', user.id);
        } catch (profileError) {
          console.error('Error creating user profile:', profileError);
          // Continue even if profile creation fails - we'll try again on auth state change
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Sign in with OAuth (only Google is supported)
  const signInWithOAuth = async (provider: 'google') => {
    await authService.signInWithOAuth(provider);
    // Note: User profile creation is handled in the auth state change listener
  };

  // Sign out function
  const signOut = async () => {
    try {
      const { error } = await authService.signOut();
      if (error) return { error };

      router.push('/');
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      const { error } = await authService.resetPassword(email);
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Update password
  const updatePassword = async (password: string) => {
    try {
      const { error } = await authService.updatePassword(password);
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Update profile
  const updateProfile = async (profileData: Partial<UserProfile>) => {
    try {
      if (!user) return { error: new Error('User not authenticated') };

      // Update user metadata if first_name or last_name is provided
      if (profileData.first_name || profileData.last_name) {
        const metadata = {
          first_name: profileData.first_name,
          last_name: profileData.last_name,
        };
        await authService.updateUserMetadata(metadata);
      }

      // Update user profile in database
      const { error } = await dbService.updateUserProfile(user.id, profileData);

      if (!error) {
        // Refresh profile data
        const { data: updatedProfile } = await dbService.getUserProfile(user.id);
        setProfile(updatedProfile);
      }

      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // Role-based access control functions
  const hasRole = (roleName: string): boolean => {
    if (!profile || !profile.role) return false;
    return profile.role.name === roleName;
  };

  const isAdmin = hasRole('admin');
  const isManager = hasRole('manager');

  const value = {
    user,
    profile,
    session,
    isLoading,
    isAdmin,
    isManager,
    hasRole,
    signIn,
    signUp,
    signInWithOAuth,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
