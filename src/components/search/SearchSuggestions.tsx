'use client';

import { useState, useEffect, useRef, forwardRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/supabase/types';
import { searchProducts } from '@/lib/supabase/db';

interface SearchSuggestionsProps {
  query: string;
  isVisible: boolean;
  onSelectSuggestion: () => void;
}

export default function SearchSuggestions({
  query,
  isVisible,
  onSelectSuggestion,
}: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const suggestionItemsRef = useRef<(HTMLLIElement | null)[]>([]);

  // Format price with currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Fetch suggestions when a query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query || query.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await searchProducts(query);
        if (error) {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
        } else {
          // Limit to 5 suggestions
          setSuggestions(data?.slice(0, 5) || []);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce the search to avoid too many requests
    const debounceTimer = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query]);

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
    // Reset the refs array when suggestions change
    suggestionItemsRef.current = suggestionItemsRef.current.slice(0, suggestions.length);
  }, [suggestions]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isVisible) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prevIndex => {
            const nextIndex = prevIndex < suggestions.length ? prevIndex + 1 : 0;
            // Include "See all results" option in navigation
            const maxIndex = suggestions.length > 0 ? suggestions.length : 0;
            return Math.min(nextIndex, maxIndex);
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prevIndex => {
            const nextIndex = prevIndex > 0 ? prevIndex - 1 : suggestions.length;
            return Math.max(nextIndex, -1);
          });
          break;
        case 'Enter':
          if (selectedIndex >= 0) {
            e.preventDefault();
            if (selectedIndex < suggestions.length) {
              // Navigate to the selected product
              window.location.href = `/products/${suggestions[selectedIndex].slug}`;
              // Don't call onSelectSuggestion() to allow navigation to complete
            } else {
              // Navigate to search results page
              window.location.href = `/products?q=${encodeURIComponent(query)}`;
              // Don't call onSelectSuggestion() here to preserve the query
            }
          }
          break;
        case 'Escape':
          e.preventDefault();
          onSelectSuggestion(); // Close suggestions
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, selectedIndex, suggestions, query, onSelectSuggestion]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && selectedIndex < suggestionItemsRef.current.length) {
      const selectedItem = suggestionItemsRef.current[selectedIndex];
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isVisible || (!loading && suggestions.length === 0)) {
    return null;
  }

  return (
    <div
      ref={suggestionsRef}
      className="absolute z-50 w-full bg-white mt-1 rounded-md shadow-lg border border-gray-200 max-h-96 overflow-y-auto top-full left-0 search-suggestions-dropdown"
    >
      {loading ? (
        <div className="p-4 text-center text-gray-500">
          <div className="animate-spin inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full mr-2"></div>
          Loading suggestions...
        </div>
      ) : (
        <ul className="py-2" role="listbox">
          {suggestions.map((product, index) => (
            <li
              key={product.id}
              ref={el => (suggestionItemsRef.current[index] = el)}
              className={`${selectedIndex === index ? 'bg-primary/5 border-l-2 border-primary' : 'hover:bg-gray-50'} transition-colors duration-150`}
              role="option"
              aria-selected={selectedIndex === index}
            >
              <a
                href={`/products/${product.slug}`}
                className="flex items-center p-3"
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={e => {
                  e.preventDefault();
                  window.location.href = `/products/${product.slug}`;
                }}
              >
                <div className="w-14 h-14 relative flex-shrink-0 bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                  {product.main_image_url ? (
                    <Image
                      src={product.main_image_url}
                      alt={product.title}
                      fill
                      sizes="56px"
                      className="object-contain p-1"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">{product.title}</p>
                  {product.brand && <p className="text-xs text-gray-500">{product.brand}</p>}
                  <p className="text-sm font-semibold text-primary mt-1">
                    {formatPrice(product.price)}
                  </p>
                </div>
              </a>
            </li>
          ))}
          {suggestions.length > 0 && (
            <li
              className={`border-t border-gray-100 mt-2 ${selectedIndex === suggestions.length ? 'bg-primary/5 border-l-2 border-primary' : 'hover:bg-gray-50'} transition-colors duration-150`}
              ref={el => (suggestionItemsRef.current[suggestions.length] = el)}
              role="option"
              aria-selected={selectedIndex === suggestions.length}
            >
              <a
                href={`/products?q=${encodeURIComponent(query)}`}
                className="block p-3 text-center font-medium text-primary hover:text-primary-dark"
                onMouseEnter={() => setSelectedIndex(suggestions.length)}
                onClick={e => {
                  e.preventDefault();
                  window.location.href = `/products?q=${encodeURIComponent(query)}`;
                }}
              >
                <span className="flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  See all results for "{query}"
                </span>
              </a>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
