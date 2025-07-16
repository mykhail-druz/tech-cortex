'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getCategories } from '@/lib/supabase/db';
import { Category } from '@/lib/supabase/types/types';
import { Layers } from 'lucide-react';
import Image from 'next/image';

// Category skeleton component
const CategorySkeleton = () => (
  <div className="animate-pulse py-2.5 px-4 rounded-md mb-2">
    <div className="flex items-center">
      <div className="w-6 h-6 mr-3 bg-primary-100 rounded-md flex-shrink-0"></div>
      <div className="h-5 bg-primary-100 rounded w-3/4"></div>
      <div className="ml-auto w-4 h-4 bg-primary-100 rounded-full flex-shrink-0"></div>
    </div>
  </div>
);

// Categories skeleton component
const CategoriesSkeleton = () => (
  <div className="space-y-1">
    {[...Array(6)].map((_, index) => (
      <CategorySkeleton key={index} />
    ))}
  </div>
);

// Category item component with hover functionality
interface CategoryItemProps {
  category: Category;
  onCategoryClick: (slug: string, subcategorySlug?: string) => void;
}

const CategoryItem = ({ category, onCategoryClick }: CategoryItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const categoryRef = useRef<HTMLDivElement>(null);

  // Update dropdown position when hovering
  const updateDropdownPosition = () => {
    if (categoryRef.current) {
      const rect = categoryRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.top,
        left: rect.right + 10, // 10px offset from the right edge of the category item
      });
    }
  };

  // Update position on window resize and scroll
  useEffect(() => {
    if (isHovered) {
      const handleResize = () => updateDropdownPosition();
      const handleScroll = () => updateDropdownPosition();

      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll, true); // Capture phase to detect all scrolls

      // Initial position update
      updateDropdownPosition();

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [isHovered]);

  return (
    <div
      ref={categoryRef}
      className="relative group"
      onMouseEnter={() => {
        updateDropdownPosition();
        setIsHovered(true);
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={() => onCategoryClick(category.slug)}
        className={`
          w-full flex items-center py-2.5 px-4 rounded-md transition-all duration-200
           hover:bg-primary-50 hover:text-primary group-hover:bg-primary-50 group-hover:text-primary
        `}
      >
        {category.icon_url ? (
          <span className="w-8 h-8 mr-3 flex-shrink-0 relative">
            <Image
              src={category.icon_url}
              alt=""
              width={32}
              height={32}
              className="object-contain"
              aria-hidden="true"
            />
          </span>
        ) : category.image_url ? (
          <span className="w-8 h-8 mr-3 flex-shrink-0 relative">
            <Image
              src={category.image_url}
              alt=""
              width={32}
              height={32}
              className="object-contain"
              aria-hidden="true"
            />
          </span>
        ) : (
          <Layers className="h-5 w-5 mr-3 group-hover:text-primary" />
        )}
        <span className="font-medium">{category.name}</span>

        {/* Arrow indicator for categories with subcategories */}
        {category.subcategories && category.subcategories.length > 0 && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 ml-auto group-hover:text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </button>

      {/* Subcategories on hover - always visible, not hiding on mouse leave */}
      {isHovered && category.subcategories && category.subcategories.length > 0 && (
        <div
          className="fixed bg-white shadow-xl rounded-md border border-primary-200 min-w-[280px] max-w-[350px] max-h-[90vh] overflow-y-auto z-[100] animate-fadeIn"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
          }}
        >
          <div className="p-4">
            <h4 className="font-semibold  mb-3 border-b pb-2 sticky top-0 bg-white">
              {category.name}
            </h4>
            <ul className="space-y-1.5">
              {category.subcategories.map(subcategory => (
                <li key={subcategory.id}>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onCategoryClick(category.slug, subcategory.slug);
                    }}
                    className="w-full text-left py-2 px-3 rounded-md  hover:bg-primary-50 hover:text-primary transition-colors flex items-center"
                  >
                    <span className="w-1.5 h-1.5 bg-primary-400 rounded-full mr-2 flex-shrink-0"></span>
                    <span className="line-clamp-2">{subcategory.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

// Categories list component
interface CategoriesListProps {
  categories: Category[];
  onCategoryClick: (slug: string, subcategorySlug?: string) => void;
}

const CategoriesList = ({ categories, onCategoryClick }: CategoriesListProps) => {
  if (categories.length === 0) {
    return <div className="text-primary-400 p-2">No categories found</div>;
  }

  return (
    <div className="space-y-1">
      {categories.map(category => (
        <CategoryItem key={category.id} category={category} onCategoryClick={onCategoryClick} />
      ))}
    </div>
  );
};

// Main HomeSidebar component
export default function HomeSidebar() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

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
    const params = new URLSearchParams();

    // Set category parameter
    params.set('category', categorySlug);

    if (subcategorySlug) {
      // Set subcategory parameter
      params.set('subcategory', subcategorySlug);
    }

    // Navigate to the product page with the parameters
    const url = `/products${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(url);
  };

  return (
    <div className="bg-white shadow-md rounded-lg border border-primary-200 w-full h-auto overflow-visible">
      {/* Sidebar header */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 z-20 sticky top-0">
        <div className="flex items-center p-4">
          <h2 className="text-lg font-bold text-white">Shop By Category</h2>
        </div>
      </div>

      {/* Categories section */}
      <div className="p-4 max-h-[calc(100vh-180px)] overflow-y-auto overflow-x-visible">
        {isLoading ? (
          <CategoriesSkeleton />
        ) : (
          <CategoriesList categories={categories} onCategoryClick={handleCategoryClick} />
        )}
      </div>

      {/* View all categories button */}
      <div className="p-4 border-t border-primary-200 bg-primary-50 sticky bottom-0 z-10">
        <button
          onClick={() => router.push('/products')}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white font-medium rounded-md transition-all duration-300 flex items-center justify-center shadow-sm hover:shadow-md"
        >
          View All Categories
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 ml-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
