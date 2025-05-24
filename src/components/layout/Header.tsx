'use client';

import { useState, useEffect, FormEvent, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { getNavigationLinks } from '@/lib/supabase/db';
import { NavigationLink } from '@/lib/supabase/types';
import SearchSuggestions from '@/components/search/SearchSuggestions';

export default function Header() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [navLinks, setNavLinks] = useState<NavigationLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { user, profile, signOut } = useAuth();
  const { itemCount } = useCart();
  const { itemCount: wishlistItemCount } = useWishlist();

  // Fetch navigation links on the component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch navigation links for main navigation
        const { data: navLinksData, error: navLinksError } = await getNavigationLinks('main_nav');
        if (navLinksError) {
          console.error('Error fetching navigation links:', navLinksError);
        } else {
          setNavLinks(navLinksData || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if the click is inside the search input
      const isClickInSearchInput = searchInputRef.current && searchInputRef.current.contains(target);

      // Check if the click is inside the suggestions dropdown
      const isClickInSuggestions = target.closest('.search-suggestions-dropdown') !== null;

      // Only close suggestions if the click is outside both the search input and suggestions
      if (!isClickInSearchInput && !isClickInSuggestions) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setIsUserMenuOpen(false);
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSuggestions(false);
    }
  };

  const handleSearchFocus = () => {
    if (searchQuery.trim().length >= 2) {
      setShowSuggestions(true);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    // Only show suggestions if there's at least 2 characters
    setShowSuggestions(value.trim().length >= 2);
  };

  const handleSelectSuggestion = () => {
    setShowSuggestions(false);
    setSearchQuery('');
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-primary">TechCortex</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            {!isLoading && (
              <>
                {navLinks.map(link => (
                  <Link
                    key={link.id}
                    href={link.url}
                    className="text-gray-600 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </>
            )}
          </nav>

          {/* Centered Search Bar */}
          <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:block">
            <form onSubmit={handleSearch} className="flex items-center">
              <div className="relative flex items-center">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={handleSearchFocus}
                  placeholder="Search products..."
                  className="border border-gray-300 rounded-full py-2 px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-96 shadow-sm"
                />
                <button type="submit" className="absolute right-2 text-gray-500 hover:text-primary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
                {/* Search Suggestions */}
                <SearchSuggestions
                  query={searchQuery}
                  isVisible={showSuggestions}
                  onSelectSuggestion={handleSelectSuggestion}
                />
              </div>
            </form>
          </div>

          {/* User Action Icons */}
          <div className="flex items-center space-x-4">
            {/* Wishlist */}
            <Link href="/account/wishlist" className="text-gray-600 hover:text-primary relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              {wishlistItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-secondary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {wishlistItemCount > 99 ? '99+' : wishlistItemCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link href="/cart" className="text-gray-600 hover:text-primary relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-secondary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {/* User Profile / Login */}
            <div className="relative">
              {user ? (
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="text-gray-600 hover:text-primary flex items-center"
                >
                  <span className="hidden sm:block mr-2 text-sm font-medium">
                    {profile?.first_name || user.email?.split('@')[0]}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="h-6 w-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </button>
              ) : (
                <Link href="/auth/login" className="text-gray-600 hover:text-primary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="h-6 w-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </Link>
              )}

              {/* User dropdown menu */}
              {isUserMenuOpen && user && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                  <Link
                    href="/account"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    My Account
                  </Link>
                  <Link
                    href="/account/orders"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    Orders
                  </Link>
                  <Link
                    href="/account/wishlist"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    Wishlist
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-primary focus:outline-none"
              aria-label="Toggle menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="h-6 w-6"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={cn('md:hidden', isMobileMenuOpen ? 'block' : 'hidden')}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {/* Mobile search */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={handleSearchFocus}
                  placeholder="Search products..."
                  className="w-full border border-gray-300 rounded-full py-2 px-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
                />
                <button type="submit" className="absolute right-3 text-gray-500 hover:text-primary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
                {/* Search Suggestions for Mobile */}
                <SearchSuggestions
                  query={searchQuery}
                  isVisible={showSuggestions && isMobileMenuOpen}
                  onSelectSuggestion={handleSelectSuggestion}
                />
              </div>
            </form>

            {!isLoading && (
              <>
                {navLinks.map(link => (
                  <Link
                    key={link.id}
                    href={link.url}
                    className="block py-2 text-gray-600 hover:text-primary"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </>
            )}

            {/* Mobile auth links */}
            {!user ? (
              <>
                <Link
                  href="/auth/login"
                  className="block py-2 text-gray-600 hover:text-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="block py-2 text-gray-600 hover:text-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/account"
                  className="block py-2 text-gray-600 hover:text-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Account
                </Link>
                <Link
                  href="/account/orders"
                  className="block py-2 text-gray-600 hover:text-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Orders
                </Link>
                <Link
                  href="/account/wishlist"
                  className="block py-2 text-gray-600 hover:text-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Wishlist
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left py-2 text-gray-600 hover:text-primary"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
