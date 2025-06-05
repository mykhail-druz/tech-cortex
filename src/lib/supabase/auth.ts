import { supabase } from '@/lib/supabaseClient';
import { Session, User, AuthError } from '@supabase/supabase-js';

// Types for authentication responses
export type AuthResponse = {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
};

// Sign up with email and password
export const signUp = async (
  email: string,
  password: string,
  metadata?: { first_name?: string; last_name?: string }
): Promise<AuthResponse> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });

  return {
    user: data?.user || null,
    session: data?.session || null,
    error,
  };
};

// Sign in with email and password
export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return {
    user: data?.user || null,
    session: data?.session || null,
    error,
  };
};

// Sign in with OAuth provider (only Google is supported)
export const signInWithOAuth = async (provider: 'google', redirectTo?: string): Promise<void> => {
  if (provider !== 'google') {
    console.error('Only Google authentication is currently supported');
    return;
  }

  const redirectUrl = `${window.location.origin}/auth/callback${redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`;
  console.log('OAuth redirect URL:', redirectUrl);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    },
  });

  console.log('OAuth response:', { data, error });

  if (error) {
    console.error('OAuth initiation error:', error);
    throw error;
  }
};


// Sign out
export const signOut = async (): Promise<{ error: AuthError | null }> => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Get current session
export const getSession = async (): Promise<{ session: Session | null; error: AuthError | null }> => {
  const { data, error } = await supabase.auth.getSession();
  return { session: data?.session || null, error };
};

// Get current user
export const getUser = async (): Promise<{ user: User | null; error: AuthError | null }> => {
  const { data, error } = await supabase.auth.getUser();
  return { user: data?.user || null, error };
};

// Reset password
export const resetPassword = async (email: string): Promise<{ error: AuthError | null }> => {
  // Get the site URL from environment or use window.location.origin as fallback
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '');

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/reset-password`, // Это будет обрабатываться route.ts
  });
  return { error };
};

// Update password
export const updatePassword = async (password: string): Promise<{ error: AuthError | null }> => {
  const { error } = await supabase.auth.updateUser({
    password,
  });
  return { error };
};

// Update user email
export const updateEmail = async (email: string): Promise<{ error: AuthError | null }> => {
  const { error } = await supabase.auth.updateUser({
    email,
  });
  return { error };
};

// Update user metadata
export const updateUserMetadata = async (
  metadata: { first_name?: string; last_name?: string; [key: string]: any }
): Promise<{ error: AuthError | null }> => {
  const { error } = await supabase.auth.updateUser({
    data: metadata,
  });
  return { error };
};

// Create a new user profile after signup
export const createUserProfile = async (userId: string, profile: { first_name?: string; last_name?: string }) => {
  // Get the customer role ID
  const roleResponse = await supabase
    .from('user_roles')
    .select('id')
    .eq('name', 'customer')
    .single();

  const customerRoleId = roleResponse.data?.id;

  const { error } = await supabase.from('user_profiles').insert({
    id: userId,
    first_name: profile.first_name || null,
    last_name: profile.last_name || null,
    role_id: customerRoleId, // Set default role to customer
  });
  return { error };
};

// Set up auth state change listener
export const onAuthStateChange = (
  callback: (event: 'SIGNED_IN' | 'SIGNED_OUT' | 'USER_UPDATED' | 'PASSWORD_RECOVERY', session: Session | null) => void
) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    // Блокируем PASSWORD_RECOVERY события чтобы предотвратить автологин
    if (event === 'PASSWORD_RECOVERY') {
      console.log('Blocking PASSWORD_RECOVERY event to prevent auto-login');
      return; // НЕ вызываем callback для recovery событий
    }

    callback(event, session);
  });
};
