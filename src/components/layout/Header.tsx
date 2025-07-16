'use client';

import { useState, useEffect, FormEvent, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/utils';
import { useAuth } from '@/contexts/AuthContext';
import SearchSuggestions from '@/components/search/SearchSuggestions';
import CompareIndicator from '@/components/compare/CompareIndicator';
import WishlistIndicator from '@/components/wishlist/WishlistIndicator';
import CartIndicator from '@/components/cart/CartIndicator';
import UserProfileIndicator from '@/components/user/UserProfileIndicator';

export default function Header() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    setIsMobileMenuOpen(false);
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if the click is inside the search input
      const isClickInSearchInput =
        searchInputRef.current && searchInputRef.current.contains(target);

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
          <div className="flex-shrink-0 mr-2 sm:mr-4 md:mr-6 flex items-center">
            <Link href="/" className="flex items-center" aria-label="Go to homepage">
              <div className="relative flex items-center h-16 py-2">
                <Image
                  src="/header-logo.svg"
                  alt="TechCortex Logo"
                  width={120}
                  height={40}
                  className="h-8 sm:h-9 md:h-10 lg:h-11 w-auto object-contain transition-all duration-300"
                  style={{ maxWidth: '100%', objectPosition: 'left center' }}
                  priority
                  quality={90}
                />
              </div>
            </Link>
          </div>

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
          <div className="flex items-center space-x-2">
            {/* PC Builder */}
            <Link
              href="/pc-builder"
              className="hidden md:flex items-center px-3 py-1.5 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <svg
                  className="w-5 h-5 ml-2 transform transition-transform group-hover:rotate-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                  />
                </svg>
              </svg>
              PC Builder
            </Link>

            {/* Wishlist */}
            <WishlistIndicator />

            {/* Compare */}
            <CompareIndicator />

            {/* Cart */}
            <CartIndicator />

            {/* User Profile / Login */}
            <UserProfileIndicator />
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

            {/* Navigation links for mobile based on actual pages */}
            <>
              <Link
                href="/pc-builder"
                className="block py-2 text-gray-600 hover:text-primary font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                    />
                  </svg>
                  PC Builder
                </span>
              </Link>

              <Link
                href="/products"
                className="block py-2 text-gray-600 hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Products
              </Link>

              <Link
                href="/cart"
                className="block py-2 text-gray-600 hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Cart
              </Link>
              <Link
                href="/checkout"
                className="block py-2 text-gray-600 hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Checkout
              </Link>
              <Link
                href="/compare"
                className="block py-2 text-gray-600 hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Compare
              </Link>

              <Link
                href="/about-us"
                className="block py-2 text-gray-600 hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About Us
              </Link>
              <Link
                href="/contact"
                className="block py-2 text-gray-600 hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact
              </Link>
            </>

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
