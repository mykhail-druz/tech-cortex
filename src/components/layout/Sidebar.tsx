'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getCategories } from '@/lib/supabase/db';
import { Category } from '@/lib/supabase/types';
import { useSidebar } from '@/contexts/SidebarContext';

export default function Sidebar() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { isOpen, toggleSidebar, closeSidebar, isMobile } = useSidebar();
  const pathname = usePathname();

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await getCategories();
        if (error) {
          console.error('Error fetching categories:', error);
        } else {
          setCategories(data || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Set active category based on current path
  useEffect(() => {
    if (pathname?.includes('/products/category/')) {
      const slug = pathname.split('/').pop();
      setActiveCategory(slug || null);
    } else {
      setActiveCategory(null);
    }
  }, [pathname]);

  // Don't render sidebar on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300 ease-in-out"
          onClick={closeSidebar}
          aria-hidden="true"
        ></div>
      )}

      {/* Sidebar container */}
      <div className="relative">
        {/* Always visible toggle button */}
        <button
          onClick={toggleSidebar}
          className="fixed top-24 left-0 z-50 bg-primary text-white p-2 rounded-r-md shadow-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-transform duration-300 ease-in-out"
          aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
          aria-expanded={isOpen}
          aria-controls="sidebar-menu"
          style={{ transform: isOpen ? 'translateX(256px)' : 'translateX(0)' }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            className="h-6 w-6"
            aria-hidden="true"
          >
            {isOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            )}
          </svg>
        </button>

        {/* Sidebar content */}
        <div
          id="sidebar-menu"
          className={`
                        fixed top-16 left-0 z-40 
                        h-[calc(100vh-4rem)] overflow-y-auto 
                        bg-white shadow-lg 
                        transition-all duration-300 ease-in-out
                        ${isOpen ? 'translate-x-0 w-64' : 'md:translate-x-[-100%] translate-x-[-100%] w-64'}
                        border-r border-gray-200
                    `}
          aria-label="Sidebar navigation"
          role="navigation"
        >
          {/* Sidebar header */}
          <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
            <div className="flex items-center p-4">
              <h2 className="text-lg font-semibold text-gray-800">Shop By</h2>
            </div>
          </div>

          {/* Categories section */}
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              Categories
            </h3>

            {isLoading ? (
              <div className="text-gray-400 p-2 flex items-center justify-center">
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-primary"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Loading...
              </div>
            ) : categories.length === 0 ? (
              <div className="text-gray-400 p-2">No categories found</div>
            ) : (
              <ul className="space-y-1" role="menu">
                {categories.map(category => (
                  <li key={category.id} role="menuitem">
                    <Link
                      href={`/products/category/${category.slug}`}
                      className={`
                                                flex items-center py-2 px-3 rounded-md transition-all duration-200
                                                ${
                                                  activeCategory === category.slug
                                                    ? 'bg-primary/10 text-primary font-medium'
                                                    : 'text-gray-600 hover:bg-gray-100 hover:text-primary'
                                                }
                                            `}
                      onClick={isMobile ? closeSidebar : undefined}
                      aria-current={activeCategory === category.slug ? 'page' : undefined}
                    >
                      {category.image_url ? (
                        <span className="w-6 h-6 mr-2 flex-shrink-0 relative">
                          <img
                            src={category.image_url}
                            alt=""
                            className="w-full h-full object-contain"
                            aria-hidden="true"
                          />
                        </span>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-5 w-5 mr-2 ${activeCategory === category.slug ? 'text-primary' : 'text-gray-400'}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      )}
                      <span>{category.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Additional sections could be added here */}
          <div className="p-4">
            <div className="text-xs text-gray-500 mt-4">
              <p>© 2025 TechCortex</p>
              <p>All rights reserved</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
