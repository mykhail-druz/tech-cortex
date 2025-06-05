'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('message') || 'Unknown authentication error';

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-8 border border-gray-200">
        <h1 className="text-2xl font-bold text-center mb-6 text-red-600">Authentication Error</h1>

        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
          {error}
        </div>

        <div className="text-center">
          <Link
            href="/auth/login"
            className="inline-block bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors"
          >
            Try Again
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  );
}