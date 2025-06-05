'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

// Создаем отдельный клиент ТОЛЬКО для reset-password с включенным detectSessionInUrl
const resetPasswordClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false, // НЕ сохраняем сессию
      autoRefreshToken: false, // НЕ обновляем токены
      flowType: 'implicit',
      detectSessionInUrl: true, // Включаем ТОЛЬКО для этой страницы
      debug: true,
    },
  }
);

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const [recoverySession, setRecoverySession] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const handleAuthFromUrl = async () => {
      try {
        console.log('Current URL:', window.location.href);

        // Проверяем наличие recovery параметров в URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = hashParams.get('type');
        const accessToken = hashParams.get('access_token');

        console.log('URL Hash params:', { type, accessToken: accessToken ? 'present' : 'absent' });

        if (type === 'recovery' && accessToken) {
          console.log('Recovery URL detected');

          // Очистим URL от токенов СРАЗУ для безопасности
          window.history.replaceState({}, document.title, '/auth/reset-password');

          // Проверяем валидность токена используя отдельный клиент
          try {
            const { data: { user }, error } = await resetPasswordClient.auth.getUser(accessToken);

            if (error || !user) {
              throw new Error('Invalid token');
            }

            console.log('Token is valid for user:', user.email);

            // Сохраняем токен для использования только в контексте сброса пароля
            setRecoverySession({
              access_token: accessToken,
              type: type,
              user: user
            });

            setIsTokenValid(true);
          } catch (tokenError) {
            console.error('Token validation failed:', tokenError);
            setError('Invalid or expired reset token. Please request a new password reset link.');
          }
        } else {
          console.log('No recovery parameters in URL');
          setError('Invalid or expired reset token. Please request a new password reset link.');
        }
      } catch (err) {
        console.error('Error processing reset token:', err);
        setError('Error processing reset token. Please try again.');
      } finally {
        setIsCheckingToken(false);
      }
    };

    handleAuthFromUrl();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!recoverySession?.access_token) {
      setError('Invalid recovery session. Please request a new password reset link.');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Attempting to update password with recovery token...');

      // Используем recovery токен напрямую для смены пароля с отдельным клиентом
      const { error } = await resetPasswordClient.auth.updateUser(
        { password: password },
        { accessToken: recoverySession.access_token }
      );

      if (error) {
        console.error('Password update error:', error);
        if (error.message.includes('session_not_found') || error.message.includes('invalid_token')) {
          setError('Reset token has expired. Please request a new password reset link.');
        } else {
          setError(error.message);
        }
        return;
      }

      console.log('Password updated successfully');
      setSuccess('Your password has been successfully reset.');
      setPassword('');
      setConfirmPassword('');

      // Очищаем recovery session
      setRecoverySession(null);

      // Также очищаем любые сессии из отдельного клиента
      await resetPasswordClient.auth.signOut();

      setTimeout(() => {
        router.push('/auth/login?message=Password reset successful');
      }, 3000);
    } catch (err) {
      console.error('Unexpected error during password update:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Компонент остается тем же...
  if (isCheckingToken) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 border border-gray-200">
          <h1 className="text-2xl font-bold text-center mb-6">Reset Password</h1>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <span className="ml-3">Verifying reset token...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isTokenValid) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 border border-gray-200">
          <h1 className="text-2xl font-bold text-center mb-6 text-red-600">Invalid Reset Link</h1>

          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
            {error}
          </div>

          <div className="text-center space-y-4">
            <Link
              href="/auth/forgot-password"
              className="inline-block bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors"
            >
              Request New Reset Link
            </Link>

            <p className="text-sm text-gray-600">
              <Link href="/auth/login" className="text-primary hover:underline">
                Back to Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 border border-gray-200">
        <h1 className="text-2xl font-bold text-center mb-6">Reset Password</h1>

        {/* Предупреждение о безопасности */}
        <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md mb-4 text-sm">
          <strong>Security Notice:</strong> This page is only for password reset. You are not logged in to your account.
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-md mb-4">
            {success}
            <p className="mt-2">Redirecting to login page...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="••••••••"
              minLength={8}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="••••••••"
              minLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            <Link href="/auth/login" className="text-primary hover:underline">
              Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}