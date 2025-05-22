'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Тип для данных продукта
interface ProductProps {
  id: string;
  title: string;
  price: number;
  oldPrice?: number;
  image: string;
  category: string;
  rating: number;
  inStock: boolean;
}

export default function ProductCard({
  id,
  title,
  price,
  oldPrice,
  image,
  category,
  rating,
  inStock,
}: ProductProps) {
  const [isHovering, setIsHovering] = useState(false);

  // Преобразование цены в формат с валютой
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Формирование рейтинга звездами
  const renderRating = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <svg
          key={i}
          className={`h-4 w-4 ${i <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    return stars;
  };

  return (
    <div
      className="group bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Link href={`/products/${id}`}>
        <div className="relative h-48 w-full overflow-hidden bg-gray-100">
          {/* Заглушка для изображения с Next.js Image */}
          <div className="relative h-full w-full">
            <Image
              src={image}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={cn(
                'object-contain transition-transform duration-300',
                isHovering ? 'scale-105' : 'scale-100'
              )}
            />
          </div>

          {/* Бейджи */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {oldPrice && (
              <span className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded">
                Sale
              </span>
            )}
            {!inStock && (
              <span className="bg-gray-600 text-white text-xs font-medium px-4 py-1 rounded">
                Out of Stock
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="p-4">
        {/* Категория */}
        <p className="text-xs text-gray-500 mb-1">{category}</p>

        {/* Название */}
        <Link href={`/products/${id}`}>
          <h3 className="font-medium text-gray-900 mb-1 hover:text-primary transition-colors">
            {title}
          </h3>
        </Link>

        {/* Рейтинг */}
        <div className="flex items-center mb-2">
          {renderRating(rating)}
          <span className="text-xs text-gray-500 ml-1">({rating.toFixed(1)})</span>
        </div>

        {/* Цена */}
        <div className="flex items-center">
          <span className="font-semibold text-gray-900">{formatPrice(price)}</span>
          {oldPrice && (
            <span className="ml-2 text-sm text-gray-500 line-through">{formatPrice(oldPrice)}</span>
          )}
        </div>

        {/* Кнопка добавления в корзину */}
        <button
          disabled={!inStock}
          className={cn(
            'mt-3 w-full py-2 px-3 rounded-md text-sm font-medium transition-colors',
            inStock
              ? 'bg-primary text-white hover:bg-primary/90'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          )}
        >
          {inStock ? 'Add to Cart' : 'Out of Stock'}
        </button>
      </div>
    </div>
  );
}
