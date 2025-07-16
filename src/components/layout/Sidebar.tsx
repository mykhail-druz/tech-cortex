'use client';

import { useState, useEffect } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { getCategories } from '@/lib/supabase/db';
import { Category } from '@/lib/supabase/types/types';
import { useSidebar } from '@/contexts/SidebarContext';
import { ChevronLeft, ChevronRight, Menu, Layers } from 'lucide-react';
import Image from 'next/image';

// Category skeleton component
const CategorySkeleton = () => (
  <li role="menuitem" className="space-y-1 animate-pulse">
    <div className="w-full flex items-center py-2 px-3 rounded-md">
      <div className="w-5 h-5 mr-2 bg-gray-200 rounded-md flex-shrink-0"></div>
      <div className="h-5 bg-gray-200 rounded w-3/4"></div>
    </div>
  </li>
);

// All Products skeleton component
const AllProductsSkeleton = () => (
  <li role="menuitem" className="animate-pulse">
    <div className="w-full flex items-center py-2 px-3 rounded-md">
      <div className="w-5 h-5 mr-2 bg-gray-200 rounded-md flex-shrink-0"></div>
      <div className="h-5 bg-gray-200 rounded w-1/2"></div>
    </div>
  </li>
);

// Categories skeleton component
const CategoriesSkeleton = () => (
  <ul className="space-y-1" role="menu">
    <AllProductsSkeleton />
    {[...Array(5)].map((_, index) => (
      <CategorySkeleton key={index} />
    ))}
  </ul>
);

// Sidebar toggle button component
const SidebarToggle = ({ isOpen, toggleSidebar }: { isOpen: boolean; toggleSidebar: () => void }) => (
  <button
    onClick={toggleSidebar}
    className="fixed top-24 left-0 z-50 bg-primary text-white p-2 rounded-r-md shadow-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-transform duration-300 ease-in-out"
    aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
    aria-expanded={isOpen}
    aria-controls="sidebar-menu"
    style={{ transform: isOpen ? 'translateX(256px)' : 'translateX(0)' }}
  >
    {isOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
  </button>
);

// Sidebar overlay component for mobile
const SidebarOverlay = ({ isOpen, closeSidebar }: { isOpen: boolean; closeSidebar: () => void }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300 ease-in-out"
      onClick={closeSidebar}
      aria-hidden="true"
    />
  );
};

// Category item component
interface CategoryItemProps {
  category: Category;
  isActive: boolean;
  activeSubcategory: string | null;
  onClick: (slug: string, subcategorySlug?: string) => void;
}

const CategoryItem = ({ category, isActive, activeSubcategory, onClick }: CategoryItemProps) => {
  return (
    <li role="menuitem" className="space-y-1">
      <button
        onClick={() => onClick(category.slug)}
        className={`
          w-full flex items-center py-2 px-3 rounded-md transition-all duration-200
          ${
            isActive
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-gray-600 hover:bg-gray-100 hover:text-primary'
          }
        `}
        aria-current={isActive ? 'page' : undefined}
      >
        {category.icon_url ? (
          <span className="w-6 h-6 mr-2 flex-shrink-0 relative">
            <Image
              src={category.icon_url}
              alt=""
              width={24}
              height={24}
              className="object-contain"
              aria-hidden="true"
            />
          </span>
        ) : category.image_url ? (
          <span className="w-6 h-6 mr-2 flex-shrink-0 relative">
            <Image
              src={category.image_url}
              alt=""
              width={24}
              height={24}
              className="object-contain"
              aria-hidden="true"
            />
          </span>
        ) : (
          <Layers className={`h-5 w-5 mr-2 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
        )}
        <span>{category.name}</span>
      </button>

      {/* Subcategories */}
      {isActive && category.subcategories && category.subcategories.length > 0 && (
        <ul className="pl-4 space-y-1 mt-1">
          {category.subcategories.map(subcategory => (
            <li key={subcategory.id}>
              <button
                onClick={() => onClick(category.slug, subcategory.slug)}
                className={`
                  w-full text-left py-1 px-2 rounded-md text-sm transition-colors
                  ${
                    activeSubcategory === subcategory.slug
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
              >
                {subcategory.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

// Categories list component
interface CategoriesListProps {
  categories: Category[];
  activeCategory: string | null;
  activeSubcategory: string | null;
  onCategoryClick: (slug: string, subcategorySlug?: string) => void;
}

const CategoriesList = ({ categories, activeCategory, activeSubcategory, onCategoryClick }: CategoriesListProps) => {
  if (categories.length === 0) {
    return <div className="text-gray-400 p-2">No categories found</div>;
  }

  return (
    <ul className="space-y-1" role="menu">
      <li role="menuitem">
        <button
          onClick={() => onCategoryClick('all')}
          className={`
            w-full flex items-center py-2 px-3 rounded-md transition-all duration-200
            ${
              !activeCategory || activeCategory === 'all'
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-gray-600 hover:bg-gray-100 hover:text-primary'
            }
          `}
        >
          <Menu 
            className={`h-5 w-5 mr-2 ${!activeCategory || activeCategory === 'all' ? 'text-primary' : 'text-gray-400'}`}
          />
          <span>All Products</span>
        </button>
      </li>

      {categories.map(category => (
        <CategoryItem
          key={category.id}
          category={category}
          isActive={activeCategory === category.slug}
          activeSubcategory={activeSubcategory}
          onClick={onCategoryClick}
        />
      ))}
    </ul>
  );
};

// Main Sidebar component
export default function Sidebar() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen, toggleSidebar, closeSidebar, isMobile } = useSidebar();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get active category and subcategory from URL parameters
  const activeCategory = searchParams.get('category') || null;
  const activeSubcategory = searchParams.get('subcategory') || null;

  // Fetch categories on the component mount
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

  // Handle navigation to products page with category filter
  const handleCategoryClick = (categorySlug: string, subcategorySlug?: string) => {
    // Build the URL with appropriate parameters
    const params = new URLSearchParams(searchParams.toString());

    if (categorySlug === 'all') {
      // Clear category and subcategory parameters
      params.delete('category');
      params.delete('subcategory');
    } else {
      // Set category parameter
      params.set('category', categorySlug);

      if (subcategorySlug) {
        // Set subcategory parameter
        params.set('subcategory', subcategorySlug);
      } else {
        // Clear subcategory parameter if only category is selected
        params.delete('subcategory');
      }
    }

    // Navigate to the product page with the parameters
    const url = `/products${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(url);

    // Close sidebar on mobile
    if (isMobile) {
      closeSidebar();
    }
  };

  // Don't render sidebar on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <SidebarOverlay isOpen={isOpen && isMobile} closeSidebar={closeSidebar} />

      <div className="relative">
        <SidebarToggle isOpen={isOpen} toggleSidebar={toggleSidebar} />

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
              <Layers className="h-5 w-5 mr-2 text-primary" />
              Categories
            </h3>

            {isLoading ? (
              <CategoriesSkeleton />
            ) : (
              <CategoriesList 
                categories={categories}
                activeCategory={activeCategory}
                activeSubcategory={activeSubcategory}
                onCategoryClick={handleCategoryClick}
              />
            )}
          </div>

          {/* Footer */}
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
