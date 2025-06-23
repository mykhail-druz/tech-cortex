'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils/utils';
import ClientImage from '@/components/ui/ClientImage';

interface UserProfileIndicatorProps {
  className?: string;
}

const UserProfileIndicator: React.FC<UserProfileIndicatorProps> = ({ className }) => {
  const { user, profile, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  // Функция для получения аватара (ТОЛЬКО собственный аватар, без Google fallback)
  const getAvatarUrl = () => {
    // Приоритет: ТОЛЬКО собственный аватар из профиля
    if (profile?.avatar_url) {
      return profile.avatar_url;
    }
    // НЕ используем Google аватар автоматически
    return null;
  };

  // Функция для получения инициалов с заглавными буквами
  const getInitials = () => {
    const firstName = profile?.first_name || user?.user_metadata?.given_name;
    const lastName = profile?.last_name || user?.user_metadata?.family_name;

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

  if (!user) {
    // Guest user - just show login link
    return (
      <div className="relative">
        <Link
          href="/auth/login"
          className={cn(
            'relative flex items-center justify-center p-2 text-gray-700 hover:text-primary transition-colors group',
            className
          )}
          aria-label="Sign In"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 transform transition-transform duration-300 group-hover:scale-110"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </Link>
      </div>
    );
  }

  const avatarUrl = getAvatarUrl();

  // Logged in user - show profile with dropdown
  return (
    <div className="relative">
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className={cn(
          'relative flex items-center justify-center p-2 text-gray-700 hover:text-primary transition-colors group',
          className
        )}
        aria-label="User Profile"
      >
        {avatarUrl ? (
          <div className="w-8 h-8 rounded-full overflow-hidden mr-2 ring-2 ring-gray-200 group-hover:ring-primary transition-all">
            <ClientImage
              src={avatarUrl}
              alt="User Avatar"
              width={32}
              height={32}
              className="w-full h-full object-cover"
              fallbackContent={
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                  <span className="text-primary text-xs font-medium">{getInitials()}</span>
                </div>
              }
            />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center mr-2 ring-2 ring-gray-200 group-hover:ring-primary transition-all">
            <span className="text-primary text-xs font-medium">{getInitials()}</span>
          </div>
        )}
      </button>

      {/* Dropdown menu */}
      {isMenuOpen && (
        <>
          {/* Backdrop для закрытия меню */}
          <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">
                {profile?.first_name || user?.user_metadata?.given_name || 'User'}
                {profile?.last_name && ` ${profile.last_name}`}
                {!profile?.first_name &&
                  user?.user_metadata?.family_name &&
                  ` ${user.user_metadata.family_name}`}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
              {user?.app_metadata?.provider === 'google' && (
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <svg className="w-3 h-3 mr-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google Account
                </p>
              )}
            </div>
            <Link
              href="/account"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                My Account
              </div>
            </Link>
            <Link
              href="/account/orders"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                Orders
              </div>
            </Link>
            <Link
              href="/account/wishlist"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                Wishlist
              </div>
            </Link>
            <div className="border-t border-gray-100">
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center">
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
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Sign Out
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserProfileIndicator;
