'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import { Product } from '@/lib/supabase/types/types';
import AddToWishlistButton from './AddToWishlistButton';
import AddToCompareButton from './AddToCompareButton';

// Старый интерфейс для обратной совместимости
interface LegacyProductProps {
  id: string;
  title: string;
  price: number;
  oldPrice?: number;
  image: string;
  category?: string;
  subcategory?: string;
  rating: number;
  inStock: boolean;
  slug: string;
  layout?: 'grid' | 'list';
}

// Новый интерфейс
interface NewProductCardProps {
  product: Product;
  compact?: boolean;
  layout?: 'grid' | 'list';
}

// Объединенный тип пропсов
type ProductCardProps = NewProductCardProps | (LegacyProductProps & { product?: never });

export default function ProductCard(props: ProductCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const { addItem } = useCart();
  const toast = useToast();

  // Определяем, какой API используется
  const isNewAPI = 'product' in props && props.product !== undefined;

  let id: string;
  let title: string;
  let price: number;
  let oldPrice: number | null;
  let image: string | null;
  let rating: number;
  let inStock: boolean;
  let slug: string;
  let brand: string | null = null;
  let review_count: number = 0;
  let layout: 'grid' | 'list' = 'grid';
  let compact: boolean = false;

  if (isNewAPI) {
    // Новый API - используем объект Product
    const { product } = props as NewProductCardProps;
    if (!product) {
      return <div className="p-4 text-red-500">Product data is missing</div>;
    }

    id = product.id;
    title = product.title;
    price = product.price;
    oldPrice = product.old_price;
    image = product.main_image_url;
    rating = typeof product.rating === 'number' && !isNaN(product.rating) ? product.rating : 0;
    inStock = product.in_stock;
    slug = product.slug;
    brand = product.brand;
    review_count = product.review_count || 0;
    layout = (props as NewProductCardProps).layout || 'grid';
    compact = (props as NewProductCardProps).compact || false;
  } else {
    // Старый API - используем отдельные пропсы
    const legacyProps = props as LegacyProductProps;
    id = legacyProps.id;
    title = legacyProps.title;
    price = legacyProps.price;
    oldPrice = legacyProps.oldPrice || null;
    image = legacyProps.image;
    rating =
      typeof legacyProps.rating === 'number' && !isNaN(legacyProps.rating) ? legacyProps.rating : 0;
    inStock = legacyProps.inStock;
    slug = legacyProps.slug;
    layout = legacyProps.layout || 'grid';
  }

  // Handle adding to cart
  const addToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!inStock) return;

    const { error } = await addItem(id, 1);

    if (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add product to cart');
    } else {
      toast.success(`Product added to cart`);
    }
  };

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
    const safeRating = Math.max(0, Math.min(5, rating)); // Ограничиваем от 0 до 5

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <svg
          key={i}
          className={`h-4 w-4 ${i <= safeRating ? 'text-yellow-500' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }
    return stars;
  };

  // Компактная версия для PC Builder
  if (compact) {
    return (
      <div className="p-3 border rounded-lg hover:border-primary transition-colors">
        <div className="flex items-center space-x-3">
          {/* Изображение */}
          <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
            {image ? (
              <Image
                src={image}
                alt={title}
                width={64}
                height={64}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400 text-xs">No Image</span>
              </div>
            )}
          </div>

          {/* Информация */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-gray-900 line-clamp-1">{title}</h4>
            {brand && <p className="text-xs text-gray-500 mt-1">{brand}</p>}

            {/* Рейтинг (только если есть) */}
            {rating > 0 && (
              <div className="flex items-center mt-1">
                <div className="flex">{renderRating(rating)}</div>
                <span className="text-xs text-gray-500 ml-1">({rating.toFixed(1)})</span>
                {review_count > 0 && (
                  <span className="text-xs text-gray-400 ml-1">{review_count} reviews</span>
                )}
              </div>
            )}

            {/* Цена */}
            <div className="flex items-center mt-2">
              <span className="font-semibold text-sm text-gray-900">{formatPrice(price)}</span>
              {oldPrice && oldPrice > price && (
                <span className="ml-2 text-xs text-gray-500 line-through">
                  {formatPrice(oldPrice)}
                </span>
              )}
            </div>

            {/* Статус наличия */}
            {!inStock && (
              <span className="inline-block mt-1 text-xs text-red-600">Out of Stock</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Обычная версия карточки
  return (
    <div
      className={cn(
        'group bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md',
        layout === 'grid' ? 'flex flex-col h-[400px]' : 'flex flex-row h-[200px]'
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Link
        href={`/products/${slug}`}
        className={cn(
          'block',
          layout === 'grid' ? 'h-48 w-full' : 'h-full w-[200px] flex-shrink-0'
        )}
      >
        <div
          className={cn(
            'relative overflow-hidden bg-gray-100',
            layout === 'grid' ? 'h-48 w-full' : 'h-full w-full'
          )}
        >
          {/* Изображение */}
          <div className="relative h-full w-full">
            {image ? (
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
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">No Image</span>
              </div>
            )}
          </div>

          {/* Бейджи */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {oldPrice && oldPrice > price && (
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

          {/* Action buttons in top right */}
          <div
            className="absolute top-2 right-2 z-10 flex flex-col gap-2"
            onClick={e => e.stopPropagation()}
          >
            <AddToWishlistButton productId={id} variant="icon" />
            <AddToCompareButton productId={id} variant="icon" />
          </div>
        </div>
      </Link>

      <div
        className={cn('flex flex-col flex-grow', layout === 'grid' ? 'p-4' : 'p-4 justify-between')}
      >
        <div>
          {/* Бренд */}
          {brand && <p className="text-xs text-gray-500 mb-1">{brand}</p>}

          {/* Название */}
          <Link href={`/products/${slug}`}>
            <h3
              className={cn(
                'font-medium text-gray-900 hover:text-primary transition-colors line-clamp-2',
                layout === 'grid' ? 'mb-1' : 'mb-2'
              )}
            >
              {title}
            </h3>
          </Link>

          {/* Рейтинг (только если есть отзывы) */}
          {rating > 0 && (
            <div className="flex items-center mb-2">
              {renderRating(rating)}
              <span className="text-xs text-gray-500 ml-1">({rating.toFixed(1)})</span>
              {review_count > 0 && (
                <span className="text-xs text-gray-400 ml-1">({review_count})</span>
              )}
            </div>
          )}
        </div>

        <div className={layout === 'list' ? 'flex items-center justify-between' : ''}>
          {/* Цена */}
          <div className="flex items-center mb-2">
            <span className="font-semibold text-gray-900">{formatPrice(price)}</span>
            {oldPrice && oldPrice > price && (
              <span className="ml-2 text-sm text-gray-500 line-through">
                {formatPrice(oldPrice)}
              </span>
            )}
          </div>

          {/* Add to Cart button */}
          <button
            onClick={addToCart}
            disabled={!inStock}
            className={cn(
              'py-2 px-3 rounded-md text-sm font-medium transition-colors w-full',
              inStock
                ? 'bg-primary text-white hover:bg-primary/90'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            )}
          >
            {inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  );
}
