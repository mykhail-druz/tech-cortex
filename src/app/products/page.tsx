import { Suspense } from 'react';
import ProductsContent from '@/components/product/ProductsContent';
import { Spinner } from '@/components/ui/Spinner';

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Product Catalog</h1>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-80 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
        <div className="flex-grow">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Spinner size="large" color="primary" text="Loading products..." centered={true} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function ProductsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ProductsContent />
    </Suspense>
  );
}
