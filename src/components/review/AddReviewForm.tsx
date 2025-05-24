'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { addReview } from '@/lib/supabase/db';

interface AddReviewFormProps {
  productId: string;
  onReviewAdded?: () => void;
  isVerifiedPurchase?: boolean;
}

export default function AddReviewForm({ 
  productId, 
  onReviewAdded,
  isVerifiedPurchase = false 
}: AddReviewFormProps) {
  const { user } = useAuth();
  const toast = useToast();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('You must be logged in to submit a review');
      return;
    }

    if (rating < 1) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await addReview({
        product_id: productId,
        user_id: user.id,
        rating,
        title: title.trim() || null,
        content: content.trim() || null,
        is_verified_purchase: isVerifiedPurchase,
        is_approved: true, // Auto-approve for now, in a real app this might be false until moderated
      });

      if (error) {
        toast.error('Failed to submit review');
        console.error('Error submitting review:', error);
        return;
      }

      toast.success('Review submitted successfully');

      // Reset form
      setRating(5);
      setTitle('');
      setContent('');

      // Notify parent component
      if (onReviewAdded) {
        onReviewAdded();
      }
    } catch (error) {
      toast.error('An error occurred');
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If user is not logged in, show login prompt
  if (!user) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-lg border border-blue-200 text-center shadow-sm">
        <div className="mb-4 text-blue-500">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Share Your Experience</h3>
        <p className="text-gray-600 mb-6">Please sign in to write a review and help other shoppers make informed decisions</p>
        <button 
          className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 shadow-sm transition-all duration-200 transform hover:-translate-y-1"
          onClick={() => {
            // Redirect to login page or open login modal
            // This depends on your app's authentication flow
            toast.info('Please sign in to continue');
          }}
        >
          Sign In to Write a Review
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg mr-3">
          {user.email?.[0].toUpperCase() || user.id[0].toUpperCase()}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Write a Review</h3>
          <p className="text-gray-500 text-sm">Posting as {user.email || 'User'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-2">
            Overall Rating <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center">
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-all duration-150 transform hover:scale-110"
                >
                  <svg
                    className={`h-10 w-10 ${
                      star <= rating ? 'text-yellow-500' : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
            <span className="ml-4 text-gray-500">
              {rating === 5 ? 'Excellent' : 
               rating === 4 ? 'Very Good' : 
               rating === 3 ? 'Good' : 
               rating === 2 ? 'Fair' : 
               rating === 1 ? 'Poor' : ''}
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Review Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your experience in a short headline"
            className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary transition-colors"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Review Details
          </label>
          <textarea
            id="content"
            rows={6}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What did you like or dislike about this product? How was your experience using it? Would you recommend it to others?"
            className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary transition-colors"
          />
          <p className="mt-2 text-sm text-gray-500">
            Your review helps other shoppers make informed decisions and helps us improve our products.
          </p>
        </div>

        {isVerifiedPurchase && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-start">
            <svg className="w-5 h-5 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-green-800 font-medium">Verified Purchase</p>
              <p className="text-green-700 text-sm">Your review will be marked as a verified purchase</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={() => onReviewAdded && onReviewAdded()}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-1"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
            ) : (
              'Submit Review'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
