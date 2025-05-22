'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { getCategories, getNavigationLinks } from '@/lib/supabase/db';
import { Category, NavigationLink } from '@/lib/supabase/types';

export default function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [navLinks, setNavLinks] = useState<NavigationLink[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user, profile, signOut } = useAuth();
    const { itemCount } = useCart();

    // Fetch categories and navigation links on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);

                // Fetch categories
                const { data: categoriesData, error: categoriesError } = await getCategories();
                if (categoriesError) {
                    console.error('Error fetching categories:', categoriesError);
                } else {
                    setCategories(categoriesData || []);
                }

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

    const handleSignOut = async () => {
        await signOut();
        setIsUserMenuOpen(false);
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
                        {isLoading ? (
                            <div className="text-gray-400">Loading...</div>
                        ) : (
                            <>
                                {categories.map((category) => (
                                    <Link
                                        key={category.id}
                                        href={`/products/${category.slug}`}
                                        className="text-gray-600 hover:text-primary transition-colors"
                                    >
                                        {category.name}
                                    </Link>
                                ))}
                            </>
                        )}
                    </nav>

                    {/* User Action Icons */}
                    <div className="flex items-center space-x-4">
                        {/* Search */}
                        <button aria-label="Search" className="text-gray-600 hover:text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>

                        {/* Cart */}
                        <Link href="/cart" className="text-gray-600 hover:text-primary relative">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
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
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </button>
                            ) : (
                                <Link href="/auth/login" className="text-gray-600 hover:text-primary">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                <div className={cn("md:hidden", isMobileMenuOpen ? "block" : "hidden")}>
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {isLoading ? (
                            <div className="text-gray-400 py-2">Loading...</div>
                        ) : (
                            <>
                                {categories.map((category) => (
                                    <Link
                                        key={category.id}
                                        href={`/products/${category.slug}`}
                                        className="block py-2 text-gray-600 hover:text-primary"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {category.name}
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
