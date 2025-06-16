'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import * as authService from '@/lib/supabase/auth';
import { UserProfile } from '@/lib/supabase/types/types';
import * as dbService from '@/lib/supabase/db';
import * as adminDbService from '@/lib/supabase/adminDb';
import debounce from 'lodash.debounce';

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
  signInWithOAuth: (provider: 'google', redirectTo?: string) => Promise<void>;
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
  signInWithOAuth: async (_, __) => {},
  signOut: async () => ({ error: new Error('AuthContext not initialized') }),
  resetPassword: async () => ({ error: new Error('AuthContext not initialized') }),
  updatePassword: async () => ({ error: new Error('AuthContext not initialized') }),
  updateProfile: async () => ({ error: new Error('AuthContext not initialized') }),
});

// Cache duration in milliseconds (30 seconds)
const CACHE_DURATION = 30000;

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const router = useRouter();

  // Initialize auth state
  const initializeAuth = useCallback(async () => {
    // Skip initialization on reset-password page
    if (typeof window !== 'undefined' && window.location.pathname === '/auth/reset-password') {
      console.log('Skipping auth initialization on reset-password page');
      setIsLoading(false);
      return;
    }

    // If already initialized, don't initialize again
    if (isInitialized) {
      return;
    }

    setIsLoading(true);

    try {
      // Cancel any previous requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      // Check cache first
      const cachedSessionData = sessionStorage.getItem('auth_session_data');
      if (cachedSessionData) {
        const { data, timestamp } = JSON.parse(cachedSessionData);
        if (Date.now() - timestamp < CACHE_DURATION) {
          // Use cached data
          console.log('Using cached session data');
          setSession(data.session);
          setUser(data.user);
          setProfile(data.profile);
          setIsLoading(false);
          setIsInitialized(true);
          return;
        } else {
          // Cache expired, remove it
          sessionStorage.removeItem('auth_session_data');
        }
      }

      // Get current session
      const { session: currentSession } = await authService.getSession();
      setSession(currentSession);

      if (currentSession?.user) {
        setUser(currentSession.user);

        // Fetch user profile
        const { data: userProfile } = await dbService.getUserProfile(currentSession.user.id, { signal });
        setProfile(userProfile);

        // Cache the data
        sessionStorage.setItem('auth_session_data', JSON.stringify({
          data: {
            session: currentSession,
            user: currentSession.user,
            profile: userProfile
          },
          timestamp: Date.now()
        }));
      }

      setIsInitialized(true);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error initializing auth:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized]);

  // Debounced version of initializeAuth
  const debouncedInitializeAuth = useCallback(
    debounce(() => {
      initializeAuth();
    }, 300),
    [initializeAuth]
  );

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        debouncedInitializeAuth();
      }
    };

    // Initialize auth on first load
    initializeAuth();

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [initializeAuth, debouncedInitializeAuth]);

  // Set up auth state change listener
  useEffect(() => {
    // Skip on reset-password page
    if (typeof window !== 'undefined' && window.location.pathname === '/auth/reset-password') {
      return;
    }

    const { data: authListener } = authService.onAuthStateChange(async (event, session) => {
      // Additional check inside listener
      if (typeof window !== 'undefined' && window.location.pathname === '/auth/reset-password') {
        console.log('Ignoring auth state change on reset-password page');
        return;
      }

      setSession(session);
      setUser(session?.user || null);

      if (session?.user) {
        // Cancel any previous requests
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        try {
          // Fetch or create user profile
          const { data: userProfile } = await dbService.getUserProfile(session.user.id, { signal });

          if (!userProfile) {
            // Create a profile if it doesn't exist
            const metadata = session.user.user_metadata;

            // Extract user data from metadata - handles both email and OAuth sign-ins
            const userData = {
              first_name:
                metadata?.first_name || metadata?.given_name || metadata?.name?.split(' ')[0] || '',
              last_name:
                metadata?.last_name ||
                metadata?.family_name ||
                (metadata?.name?.split(' ').length > 1
                  ? metadata?.name?.split(' ').slice(1).join(' ')
                  : '') ||
                '',
            };

            console.log('Creating user profile for', session.user.id, 'with data:', userData);

            // Try to create profile using admin service to bypass RLS
            const { error: profileError } = await adminDbService.createUserProfile(
              session.user.id,
              userData
            );

            if (profileError) {
              console.error('Error creating user profile with admin service:', profileError);
              // Fallback to regular auth service
              await authService.createUserProfile(session.user.id, userData);
            }

            // Fetch the newly created profile
            const { data: newProfile } = await dbService.getUserProfile(session.user.id, { signal });
            setProfile(newProfile);

            // Cache the data
            sessionStorage.setItem('auth_session_data', JSON.stringify({
              data: {
                session,
                user: session.user,
                profile: newProfile
              },
              timestamp: Date.now()
            }));
          } else {
            setProfile(userProfile);

            // Cache the data
            sessionStorage.setItem('auth_session_data', JSON.stringify({
              data: {
                session,
                user: session.user,
                profile: userProfile
              },
              timestamp: Date.now()
            }));
          }
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('Error handling auth state change:', error);
          }
        }
      } else {
        setProfile(null);
        // Clear cache when user logs out
        sessionStorage.removeItem('auth_session_data');
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
          // Try to create a profile using admin service to bypass RLS
          const { error: profileError } = await adminDbService.createUserProfile(
            user.id,
            metadata || {}
          );

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
  const signInWithOAuth = async (provider: 'google', redirectTo?: string) => {
    await authService.signInWithOAuth(provider, redirectTo);
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

      // Cancel any previous requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

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
        const { data: updatedProfile } = await dbService.getUserProfile(user.id, { signal });
        setProfile(updatedProfile);

        // Update cache with new profile data
        const cachedSessionData = sessionStorage.getItem('auth_session_data');
        if (cachedSessionData) {
          const { data, timestamp } = JSON.parse(cachedSessionData);
          sessionStorage.setItem('auth_session_data', JSON.stringify({
            data: {
              ...data,
              profile: updatedProfile
            },
            timestamp: Date.now()
          }));
        }
      }

      return { error };
    } catch (error) {
      if (error.name !== 'AbortError') {
        return { error: error as Error };
      }
      return { error: null };
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

  // На странице reset-password возвращаем минимальный контекст
  if (typeof window !== 'undefined' && window.location.pathname === '/auth/reset-password') {
    return {
      ...context,
      user: null,
      profile: null,
      session: null,
      isLoading: false,
      isAdmin: false,
      isManager: false,
      hasRole: () => false,
    };
  }

  return context;
};
