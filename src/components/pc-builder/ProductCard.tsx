import React, { JSX } from 'react';
import Image from 'next/image';
import { PCBuilderProduct } from '@/types/pc-builder';

interface ProductCardProps {
  product: PCBuilderProduct;
  isSelected?: boolean;
  isCompatible?: boolean;
  incompatibilityReasons?: string[];
  onSelect: (product: PCBuilderProduct) => void;
  onRemove?: (product: PCBuilderProduct) => void;
  onShowSpecifications?: (product: PCBuilderProduct) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isSelected = false,
  isCompatible = true,
  incompatibilityReasons = [],
  onSelect,
  onRemove,
  onShowSpecifications,
}) => {
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const renderStars = (rating: number): JSX.Element => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`} className="text-yellow-400 text-sm">
            ★
          </span>
        ))}
        {hasHalfStar && <span className="text-yellow-400 text-sm">☆</span>}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} className="text-gray-300 text-sm">
            ☆
          </span>
        ))}
        <span className="text-sm text-gray-600 ml-1">{rating}</span>
      </div>
    );
  };

  const handleActionClick = () => {
    if (isSelected && onRemove) {
      onRemove(product);
    } else {
      onSelect(product);
    }
  };

  const handleSpecificationsClick = () => {
    if (onShowSpecifications) {
      onShowSpecifications(product);
    }
  };

  return (
    <div
      className={`bg-white rounded-lg p-2 transition-all duration-200 ${
        isSelected ? 'ring-2 ring-blue-500 shadow-md' : 'hover:shadow-md border border-gray-200'
      }`}
    >
      {/* Table-like Layout with evenly distributed columns */}
      <div className="grid grid-cols-12 gap-2 items-center">
        {/* Product Image - 1 column */}
        <div className="col-span-1">
          <div
            className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
            onClick={handleSpecificationsClick}
          >
            {product.main_image_url ? (
              <Image
                src={product.main_image_url}
                alt={product.title}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Product Name & Brand - 4 columns */}
        <div className="col-span-4">
          <h3
            className="font-medium text-gray-900 text-sm leading-tight cursor-pointer hover:text-blue-600 transition-colors truncate"
            onClick={handleSpecificationsClick}
            title={product.title}
          >
            {product.title}
          </h3>
          {product.brand && <p className="text-xs text-gray-500 mt-1">{product.brand}</p>}
        </div>

        {/* Rating - 2 columns */}
        <div className="col-span-2 flex justify-center">{renderStars(product.rating)}</div>

        {/* In Stock Status - 2 column */}
        <div className="col-span-2 flex justify-center">
          <div className="flex flex-col items-center gap-1">
            <span
              className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                product.in_stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {product.in_stock ? 'In Stock' : 'Out of Stock'}
            </span>
            {!isSelected && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${
                  isCompatible ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}
                title={incompatibilityReasons?.join('; ')}
              >
                {isCompatible ? 'Compatible' : 'Not compatible'}
              </span>
            )}
          </div>
        </div>

        {/* Price - 12 columns */}
        <div className="col-span-1 text-center">
          <span className="text-lg font-semibold text-gray-900">{formatPrice(product.price)}</span>
        </div>

        {/* Action Button - 2 columns */}
        <div className="col-span-2 flex justify-end">
          <button
            onClick={handleActionClick}
            disabled={!isSelected && (!product.in_stock || !isCompatible)}
            title={!isSelected && !isCompatible ? incompatibilityReasons?.join('; ') : undefined}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              isSelected
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : product.in_stock && isCompatible
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSelected ? 'Remove' : 'Select'}
          </button>
        </div>
      </div>
    </div>
  );
};
