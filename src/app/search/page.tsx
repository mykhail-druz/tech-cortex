'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Component that uses useSearchParams
function SearchRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q');

  useEffect(() => {
    // Redirect to products page with the search query
    if (query) {
      router.replace(`/products?q=${encodeURIComponent(query)}`);
    } else {
      router.replace('/products');
    }
  }, [query, router]);

  return null;
}

// Fallback component to show while loading
function LoadingFallback() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Redirecting to Products...</h1>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <Suspense fallback={<LoadingFallback />}>
          <SearchRedirect />
          <LoadingFallback />
        </Suspense>
      </div>
    </div>
  );
}
