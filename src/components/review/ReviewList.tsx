'use client';

import { useState, useEffect } from 'react';
import { Review } from '@/lib/supabase/types';
import { getProductReviews } from '@/lib/supabase/db';
import ReviewItem from './ReviewItem';

interface ReviewListProps {
  productId: string;
  initialReviews?: Review[];
  limit?: number;
}

export default function ReviewList({ productId, initialReviews, limit = 5 }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews || []);
  const [isLoading, setIsLoading] = useState(!initialReviews);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Fetch reviews if not provided initially
  useEffect(() => {
    if (!initialReviews) {
      fetchReviews();
    } else {
      setReviews(initialReviews);
      setHasMore(initialReviews.length >= limit);
    }
  }, [productId, initialReviews, limit]);

  // Fetch reviews from the database
  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await getProductReviews(productId);
      
      if (error) {
        console.error('Error fetching reviews:', error);
        return;
      }
      
      if (data) {
        setReviews(data);
        setHasMore(data.length >= limit);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle review updates
  const handleReviewUpdated = () => {
    fetchReviews();
  };

  // Handle review deletion
  const handleReviewDeleted = () => {
    fetchReviews();
  };

  // Load more reviews
  const loadMore = () => {
    setPage(page + 1);
    // In a real implementation, you would fetch more reviews with pagination
    // For now, we'll just simulate it by setting hasMore to false
    setHasMore(false);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="border-b border-gray-200 pb-6 animate-pulse">
            <div className="flex justify-between mb-2">
              <div className="h-5 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            </div>
            <div className="flex mb-2 space-x-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-5 w-5 bg-gray-200 rounded-full"></div>
              ))}
            </div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-16 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  // Show empty state
  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
        <p className="text-gray-500">Be the first to review this product</p>
      </div>
    );
  }

  // Show reviews
  return (
    <div>
      <div className="space-y-6">
        {reviews.map((review) => (
          <ReviewItem
            key={review.id}
            review={review}
            onReviewUpdated={handleReviewUpdated}
            onReviewDeleted={handleReviewDeleted}
          />
        ))}
      </div>

      {hasMore && (
        <button
          onClick={loadMore}
          className="mt-6 w-full py-3 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          Load More Reviews
        </button>
      )}
    </div>
  );
}