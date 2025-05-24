'use client';

import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';

// Define the Product interface
interface Product {
  id: string;
  title: string;
  price: number;
  oldPrice?: number;
  image: string;
  category: string;
  subcategory?: string;
  rating: number;
  inStock: boolean;
  slug: string;
}

interface ProductGridProps {
  products: Product[];
  title?: string;
  filter?: {
    category?: string;
    subcategory?: string;
    minPrice?: number;
    maxPrice?: number;
  };
  sorting?: 'price-asc' | 'price-desc' | 'rating' | 'newest';
  layout?: 'grid' | 'list';
  limit?: number;
}

export default function ProductGrid({
  products,
  title = 'Products',
  filter,
  sorting = 'newest',
  layout = 'grid',
  limit,
}: ProductGridProps) {
  const [displayProducts, setDisplayProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Apply limit if provided
  useEffect(() => {
    setIsLoading(true);

    // Apply limit if provided
    let result = [...products];
    if (limit) {
      result = result.slice(0, limit);
    }

    setDisplayProducts(result);
    setIsLoading(false);
  }, [products, limit]);

  // Show a loading state while filtering/sorting
  if (isLoading) {
    return (
      <div className="w-full">
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(4)
            .fill(0)
            .map((_, index) => (
              <div
                key={index}
                className="bg-gray-100 rounded-lg shadow-sm border border-gray-200 h-64 animate-pulse"
              >
                <div className="h-48 bg-gray-200"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  }

  // Show a message if no products match the filters
  if (displayProducts.length === 0) {
    return (
      <div className="w-full">
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No products found matching your criteria.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-6">{title}</h2>

      <div
        className={`grid gap-6 ${
          layout === 'grid'
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'grid-cols-1'
        }`}
      >
        {displayProducts.map(product => (
          <ProductCard
            key={product.id}
            id={product.id}
            title={product.title}
            price={product.price}
            oldPrice={product.oldPrice}
            image={product.image}
            category={product.category}
            subcategory={product.subcategory}
            rating={product.rating}
            inStock={product.inStock}
            slug={product.slug}
            layout={layout}
          />
        ))}
      </div>
    </div>
  );
}
