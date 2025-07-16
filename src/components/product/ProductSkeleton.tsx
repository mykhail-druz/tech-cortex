'use client';

import { cn } from '@/lib/utils/utils';

interface ProductSkeletonProps {
  layout?: 'grid' | 'list';
}

export default function ProductSkeleton({ layout = 'grid' }: ProductSkeletonProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden animate-pulse',
        layout === 'grid' ? 'flex flex-col h-[420px]' : 'flex flex-row h-[220px]'
      )}
    >
      {/* Image skeleton */}
      <div
        className={cn(
          'relative bg-gray-200',
          layout === 'grid' ? 'h-52 w-full' : 'h-full w-[220px] flex-shrink-0'
        )}
      >
        {/* Badge placeholders */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <div className="bg-gray-300 h-6 w-16 rounded-full"></div>
        </div>

        {/* Action buttons placeholders */}
        <div className="absolute top-3 right-3 flex flex-col gap-2.5">
          <div className="bg-gray-300 h-8 w-8 rounded-full"></div>
          <div className="bg-gray-300 h-8 w-8 rounded-full"></div>
        </div>
      </div>

      {/* Content skeleton */}
      <div
        className={cn('flex flex-col flex-grow', layout === 'grid' ? 'p-5' : 'p-5 justify-between')}
      >
        <div>
          {/* Brand placeholder */}
          <div className="bg-gray-200 h-4 w-20 mb-2 rounded"></div>

          {/* Title placeholder */}
          <div className="bg-gray-300 h-6 w-full mb-2 rounded"></div>
          <div className="bg-gray-300 h-6 w-3/4 mb-3 rounded"></div>

          {/* Rating placeholder */}
          <div className="flex items-center bg-gray-200 h-6 w-28 rounded-lg mb-3"></div>
        </div>

        <div className={layout === 'list' ? 'flex items-center justify-between' : ''}>
          {/* Price placeholder */}
          <div className="flex flex-col mb-4">
            <div className="bg-gray-300 h-6 w-24 rounded mb-1"></div>
            <div className="bg-gray-200 h-4 w-20 rounded"></div>
          </div>

          {/* Button placeholder */}
          <div className="bg-gray-300 h-10 w-full rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}