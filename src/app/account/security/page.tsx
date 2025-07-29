'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function SecurityPage() {
  const { user, isLoading: authLoading, updatePassword } = useAuth();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      // Use replace instead of push to prevent redirect loop when using browser back button
      router.replace('/auth/login?redirect=/account/security');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    // Validate passwords
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      setIsSubmitting(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Update password
      const { error } = await updatePassword(newPassword);
      
      if (error) {
        setError(error.message);
        return;
      }
      
      // Clear form and show success message
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Your password has been updated successfully.');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">Security Settings</h1>
          <div className="bg-white rounded-lg shadow-md p-8 flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Security Settings</h1>
          <Link
            href="/account"
            className="text-primary hover:text-primary/80 text-sm font-medium"
          >
            Back to Account
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium">Change Password</h2>
          </div>

          <div className="p-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-600 p-3 rounded-md mb-4">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Password must be at least 8 characters long.
                </p>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden mt-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium">Account Email</h2>
          </div>

          <div className="p-6">
            <p className="text-gray-600 mb-4">
              Your current email address is: <span className="font-medium">{user.email}</span>
            </p>
            <p className="text-gray-600 mb-4">
              To change your email address, please contact customer support.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden mt-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium">Security Tips</h2>
          </div>

          <div className="p-6">
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Use a strong, unique password for your account.</li>
              <li>Never share your password with anyone.</li>
              <li>Enable two-factor authentication if available.</li>
              <li>Regularly check your account for any suspicious activity.</li>
              <li>Log out when using shared or public computers.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}