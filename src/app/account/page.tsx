'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import * as storageService from '@/lib/supabase/storageService';
import ClientImage from '@/components/ui/ClientImage';
import { US_STATES } from '@/lib/constants/addressConstants';

export default function AccountPage() {
  const { user, profile, isLoading, updateProfile } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    avatar_url: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/login?redirect=/account');
    }
  }, [user, isLoading, router]);

  // Update form data when profile changes (only if no unsaved changes)
  useEffect(() => {
    if (profile && !hasUnsavedChanges) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        address_line1: profile.address_line1 || '',
        address_line2: profile.address_line2 || '',
        city: profile.city || '',
        state: profile.state || '',
        postal_code: profile.postal_code || '',
        country: profile.country || '',
        avatar_url: profile.avatar_url || '',
      });
    }
  }, [profile, hasUnsavedChanges]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setHasUnsavedChanges(true);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size should be less than 2MB');
        return;
      }

      setAvatarFile(file);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      setError(null);
      setHasUnsavedChanges(true);
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return null;

    setUploadingAvatar(true);
    try {
      const { url, error } = await storageService.uploadFile(
        avatarFile,
        'avatars',
        `user-${user?.id}`
      );

      if (error) {
        throw error;
      }

      return url;
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError('Failed to upload avatar. Please try again.');
      return null;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const deleteOldAvatar = async (oldAvatarUrl: string) => {
    if (!oldAvatarUrl) return;

    try {
      console.log('🗑️ Deleting old avatar from storage:', oldAvatarUrl);
      const deleteResult = await storageService.deleteFile(oldAvatarUrl, 'avatars');

      if (deleteResult.success) {
        console.log('✅ Old avatar deleted successfully');
      } else {
        console.warn('⚠️ Failed to delete old avatar:', deleteResult.error?.message);
        // Не показываем ошибку пользователю, так как это не критично
      }
    } catch (err) {
      console.warn('⚠️ Error deleting old avatar:', err);
      // Не показываем ошибку пользователю, так как это не критично
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      // Сохраняем URL старого аватара для удаления
      const oldAvatarUrl = profile?.avatar_url;

      // Upload avatar if a new one is selected
      const updatedFormData = { ...formData };

      if (avatarFile) {
        const avatarUrl = await uploadAvatar();
        if (avatarUrl) {
          updatedFormData.avatar_url = avatarUrl;
        }
      }

      const { error } = await updateProfile(updatedFormData);
      if (error) {
        setError(error.message);
        return;
      }

      // Если профиль обновился успешно и у нас есть новый аватар, удаляем старый
      if (avatarFile && oldAvatarUrl && oldAvatarUrl !== updatedFormData.avatar_url) {
        // Удаляем асинхронно, чтобы не блокировать интерфейс
        deleteOldAvatar(oldAvatarUrl);
      }

      setIsEditing(false);
      setAvatarFile(null);
      setPreviewUrl(null);
      setHasUnsavedChanges(false);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setAvatarFile(null);
    setPreviewUrl(null);
    setError(null);
    setHasUnsavedChanges(false);
    // Reset form data to current profile
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        address_line1: profile.address_line1 || '',
        address_line2: profile.address_line2 || '',
        city: profile.city || '',
        state: profile.state || '',
        postal_code: profile.postal_code || '',
        country: profile.country || '',
        avatar_url: profile.avatar_url || '',
      });
    }
  };

  const removeAvatar = async () => {
    // Сохраняем URL текущего аватара для удаления
    const currentAvatarUrl = formData.avatar_url;

    // Очищаем состояние
    setAvatarFile(null);
    setPreviewUrl(null);
    setFormData(prev => ({ ...prev, avatar_url: '' }));
    setHasUnsavedChanges(true);

    // Если у нас есть сохраненный аватар, удаляем его из storage
    if (currentAvatarUrl) {
      console.log('🗑️ Removing avatar from storage...');
      try {
        await deleteOldAvatar(currentAvatarUrl);
      } catch (err) {
        console.warn('Failed to delete avatar from storage:', err);
      }
    }
  };

  const getCurrentAvatarUrl = () => {
    if (previewUrl) return previewUrl;
    if (formData.avatar_url) return formData.avatar_url;
    // НЕ показываем Google аватар как fallback - пользователь должен явно его выбрать
    return null;
  };

  const getDisplayName = () => {
    const firstName = formData.first_name || profile?.first_name || user?.user_metadata?.given_name;
    const lastName = formData.last_name || profile?.last_name || user?.user_metadata?.family_name;
    return `${firstName || ''} ${lastName || ''}`.trim() || user?.email || 'User';
  };

  const getInitials = () => {
    const firstName = formData.first_name || profile?.first_name || user?.user_metadata?.given_name;
    const lastName = formData.last_name || profile?.last_name || user?.user_metadata?.family_name;

    if (firstName && lastName) {
      return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return '?';
  };

  // Проверка есть ли Google аватар который можно использовать
  const hasGoogleAvatar = user?.user_metadata?.avatar_url && !formData.avatar_url;

  const useGoogleAvatar = async () => {
    const googleAvatarUrl = user?.user_metadata?.avatar_url;
    if (!googleAvatarUrl) return;

    // Сохраняем URL текущего аватара для удаления
    const currentAvatarUrl = formData.avatar_url;

    // Устанавливаем Google аватар
    setFormData(prev => ({ ...prev, avatar_url: googleAvatarUrl }));
    setHasUnsavedChanges(true);

    // Если у нас был свой аватар, удаляем его
    if (currentAvatarUrl) {
      try {
        await deleteOldAvatar(currentAvatarUrl);
      } catch (err) {
        console.warn('Failed to delete old avatar when switching to Google avatar:', err);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">My Account</h1>
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
        <h1 className="text-2xl font-bold mb-8">My Account</h1>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header with gradient background */}
          <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-8 pb-16">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-6">
                {/* Enhanced Avatar Display */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full ring-4 ring-white shadow-lg overflow-hidden bg-white">
                    {getCurrentAvatarUrl() ? (
                      <ClientImage
                        src={getCurrentAvatarUrl()!}
                        alt="User Avatar"
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                        fallbackContent={
                          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                            <span className="text-primary text-2xl font-semibold">
                              {getInitials()}
                            </span>
                          </div>
                        }
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                        <span className="text-primary text-2xl font-semibold">{getInitials()}</span>
                      </div>
                    )}
                  </div>
                  {/* Online status indicator */}
                  <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                  {/* Google avatar indicator */}
                  {user?.app_metadata?.provider === 'google' && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{getDisplayName()}</h2>
                  <p className="text-gray-600">{user.email}</p>
                  <div className="flex items-center mt-2 text-sm text-gray-500">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Verified Account
                    {user.app_metadata?.provider === 'google' && (
                      <span className="ml-2 text-blue-600">• Google Account</span>
                    )}
                  </div>
                </div>
              </div>

              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-4 py-2 bg-white text-primary border border-primary rounded-lg hover:bg-primary hover:text-white transition-colors shadow-sm"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          <div className="p-8 -mt-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md mb-6 border border-red-200">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-10">
                {/* Avatar Upload Section */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-6">Profile Picture</h3>
                  <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-8">
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full ring-4 ring-white shadow-lg overflow-hidden bg-white">
                        {getCurrentAvatarUrl() ? (
                          <img
                            src={getCurrentAvatarUrl()!}
                            alt="Avatar Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                            <span className="text-primary text-3xl font-semibold">
                              {getInitials()}
                            </span>
                          </div>
                        )}
                      </div>
                      {uploadingAvatar && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-3">
                          <label
                            htmlFor="avatar"
                            className="cursor-pointer inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                          >
                            <svg
                              className="w-4 h-4 mr-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            {uploadingAvatar ? 'Uploading...' : 'Choose Photo'}
                            <input
                              id="avatar"
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarChange}
                              className="hidden"
                              disabled={uploadingAvatar}
                            />
                          </label>

                          {/* Кнопка для использования Google аватара */}
                          {hasGoogleAvatar && (
                            <button
                              type="button"
                              onClick={useGoogleAvatar}
                              disabled={uploadingAvatar}
                              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                            >
                              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                              </svg>
                              Use Google Photo
                            </button>
                          )}

                          {(getCurrentAvatarUrl() || avatarFile || formData.avatar_url) && (
                            <button
                              type="button"
                              onClick={removeAvatar}
                              className="inline-flex items-center px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              <svg
                                className="w-4 h-4 mr-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              Remove Photo
                            </button>
                          )}
                        </div>

                        <p className="text-sm text-gray-500">
                          JPG, PNG or GIF. Max size 2MB. Recommended: square image, at least
                          200x200px.
                          {hasGoogleAvatar && (
                            <span className="block text-blue-600 mt-1">
                              💡 You can use your Google profile photo or remove it to show your
                              initials
                            </span>
                          )}
                          <span className="block text-green-600 mt-1">
                            🗑️ Old photos are automatically deleted when you change or remove your
                            avatar
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personal Information Section */}
                <div>
                  <h3 className="text-lg font-medium mb-6">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="first_name"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        First Name
                      </label>
                      <input
                        id="first_name"
                        name="first_name"
                        type="text"
                        value={formData.first_name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="last_name"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Last Name
                      </label>
                      <input
                        id="last_name"
                        name="last_name"
                        type="text"
                        value={formData.last_name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Phone
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Information Section */}
                <div>
                  <h3 className="text-lg font-medium mb-6">Address Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label
                        htmlFor="address_line1"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Address Line 1
                      </label>
                      <input
                        id="address_line1"
                        name="address_line1"
                        type="text"
                        value={formData.address_line1}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label
                        htmlFor="address_line2"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Address Line 2 (Optional)
                      </label>
                      <input
                        id="address_line2"
                        name="address_line2"
                        type="text"
                        value={formData.address_line2}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="city"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        City
                      </label>
                      <input
                        id="city"
                        name="city"
                        type="text"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="state"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        State/Province
                      </label>
                      <select
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      >
                        <option value="">Select a state</option>
                        {US_STATES.map(state => (
                          <option key={state.value} value={state.value}>
                            {state.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="postal_code"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Postal Code
                      </label>
                      <input
                        id="postal_code"
                        name="postal_code"
                        type="text"
                        value={formData.postal_code}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="country"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Country
                      </label>
                      <input
                        id="country"
                        name="country"
                        type="text"
                        value={formData.country}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || uploadingAvatar}
                    className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-10">
                {/* Profile Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div>
                    <h3 className="text-lg font-medium mb-6 text-gray-900 border-b border-gray-200 pb-2">
                      Personal Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium text-gray-900">{user.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Name</p>
                        <p className="font-medium text-gray-900">{getDisplayName()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium text-gray-900">
                          {profile?.phone || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-6 text-gray-900 border-b border-gray-200 pb-2">
                      Address Information
                    </h3>
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Address</p>
                      <p className="font-medium text-gray-900">
                        {profile?.address_line1 ? (
                          <>
                            {profile.address_line1}
                            {profile.address_line2 && <>, {profile.address_line2}</>}
                            <br />
                            {profile.city}, {profile.state} {profile.postal_code}
                            <br />
                            {profile.country}
                          </>
                        ) : (
                          'Not provided'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Link
            href="/account/orders"
            className="group bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:border-primary hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <svg
                  className="w-5 h-5 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-medium mb-2 group-hover:text-primary transition-colors">
              My Orders
            </h3>
            <p className="text-sm text-gray-500">View and track your orders</p>
          </Link>
          <Link
            href="/account/wishlist"
            className="group bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:border-primary hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <svg
                  className="w-5 h-5 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-medium mb-2 group-hover:text-primary transition-colors">
              My Wishlist
            </h3>
            <p className="text-sm text-gray-500">View and manage your wishlist</p>
          </Link>
          <Link
            href="/account/security"
            className="group bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:border-primary hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <svg
                  className="w-5 h-5 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-medium mb-2 group-hover:text-primary transition-colors">
              Security
            </h3>
            <p className="text-sm text-gray-500">Update password and security settings</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
