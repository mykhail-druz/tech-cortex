'use client';

import { useState, useEffect } from 'react';
import { Review } from '@/lib/supabase/types';
import { getProductReviews } from '@/lib/supabase/db';
import ReviewList from './ReviewList';
import AddReviewForm from './AddReviewForm';
import { FaSort, FaFilter } from 'react-icons/fa';

interface ReviewSectionProps {
  productId: string;
  initialReviews?: Review[];
  reviewCount?: number;
  averageRating?: number;
}

export default function ReviewSection({
  productId,
  initialReviews,
  reviewCount = 0,
  averageRating = 0,
}: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews || []);
  const [isLoading, setIsLoading] = useState(!initialReviews);
  const [showAddReview, setShowAddReview] = useState(false);
  const [stats, setStats] = useState({
    count: reviewCount,
    average: averageRating,
  });
  const [sortOption, setSortOption] = useState<'newest' | 'highest' | 'lowest'>('newest');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch reviews if not provided initially
  useEffect(() => {
    if (!initialReviews) {
      fetchReviews();
    } else {
      setReviews(initialReviews);
      calculateStats(initialReviews);
    }
  }, [productId, initialReviews]);

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
        calculateStats(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate review statistics
  const calculateStats = (reviewData: Review[]) => {
    const count = reviewData.length;

    if (count === 0) {
      setStats({ count: 0, average: 0 });
      return;
    }

    const sum = reviewData.reduce((acc, review) => acc + review.rating, 0);
    const average = sum / count;

    setStats({
      count,
      average,
    });
  };

  // Handle new review added
  const handleReviewAdded = () => {
    fetchReviews();
    setShowAddReview(false);
  };

  // Sort reviews based on selected option
  const sortReviews = (reviewsToSort: Review[]): Review[] => {
    switch (sortOption) {
      case 'newest':
        return [...reviewsToSort].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case 'highest':
        return [...reviewsToSort].sort((a, b) => b.rating - a.rating);
      case 'lowest':
        return [...reviewsToSort].sort((a, b) => a.rating - b.rating);
      default:
        return reviewsToSort;
    }
  };

  // Filter reviews based on selected rating
  const filterReviews = (reviewsToFilter: Review[]): Review[] => {
    if (filterRating === null) return reviewsToFilter;
    return reviewsToFilter.filter(review => review.rating === filterRating);
  };

  // Get sorted and filtered reviews
  const getSortedAndFilteredReviews = (): Review[] => {
    return sortReviews(filterReviews(reviews));
  };

  // Render stars for the rating
  const renderRating = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <svg
          key={i}
          className={`h-5 w-5 ${i <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
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
    <div>
      {/* Review summary */}
      <div className="flex items-center mb-6">
        <div className="flex mr-4">{renderRating(stats.average)}</div>
        <span className="text-2xl font-bold">{stats.average.toFixed(1)}</span>
        <span className="text-gray-500 ml-2">based on {stats.count} reviews</span>
      </div>

      {/* Add review button or form */}
      {showAddReview ? (
        <div className="mb-8">
          <AddReviewForm
            productId={productId}
            onReviewAdded={handleReviewAdded}
          />
        </div>
      ) : (
        <div className="mb-8">
          <button
            onClick={() => setShowAddReview(true)}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Write a Review
          </button>
        </div>
      )}

      {/* Sorting and filtering controls */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex items-center">
          <div className="relative">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
            >
              <FaFilter className="text-gray-500" />
              <span>Filter</span>
            </button>

            {showFilters && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10 p-3">
                <h4 className="font-medium text-gray-700 mb-2">Filter by Rating</h4>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map(rating => (
                    <button
                      key={rating}
                      onClick={() => setFilterRating(filterRating === rating ? null : rating)}
                      className={`flex items-center w-full px-2 py-1 rounded ${
                        filterRating === rating ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex mr-2">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`h-4 w-4 ${i < rating ? 'text-yellow-500' : 'text-gray-300'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span>{rating} {rating === 1 ? 'Star' : 'Stars'}</span>
                    </button>
                  ))}
                  {filterRating !== null && (
                    <button
                      onClick={() => setFilterRating(null)}
                      className="text-primary text-sm hover:underline mt-2 w-full text-left"
                    >
                      Clear filter
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="relative">
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as 'newest' | 'highest' | 'lowest')}
            className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-primary focus:border-primary"
          >
            <option value="newest">Newest First</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
            <FaSort />
          </div>
        </div>

        {filterRating !== null && (
          <div className="flex items-center bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
            <span>Showing {filterRating}-star reviews</span>
            <button 
              onClick={() => setFilterRating(null)}
              className="ml-2 focus:outline-none"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Reviews list */}
      <ReviewList
        productId={productId}
        initialReviews={getSortedAndFilteredReviews()}
      />
    </div>
  );
}
