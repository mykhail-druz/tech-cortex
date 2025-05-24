'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Review } from '@/lib/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { updateReview, deleteReview } from '@/lib/supabase/db';
import { useToast } from '@/contexts/ToastContext';

interface ReviewItemProps {
  review: Review;
  onReviewUpdated?: () => void;
  onReviewDeleted?: () => void;
}

export default function ReviewItem({ review, onReviewUpdated, onReviewDeleted }: ReviewItemProps) {
  const { user } = useAuth();
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(review.title || '');
  const [editedContent, setEditedContent] = useState(review.content || '');
  const [editedRating, setEditedRating] = useState(review.rating);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if the current user is the author of the review
  const isAuthor = user?.id === review.user_id;

  // Format the date
  const formattedDate = review.created_at
    ? formatDistanceToNow(new Date(review.created_at), { addSuffix: true })
    : '';

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

  // Handle saving edited review
  const handleSaveEdit = async () => {
    try {
      const { error } = await updateReview(review.id, {
        title: editedTitle,
        content: editedContent,
        rating: editedRating,
      });

      if (error) {
        toast.error('Failed to update review');
        console.error('Error updating review:', error);
        return;
      }

      toast.success('Review updated successfully');
      setIsEditing(false);
      if (onReviewUpdated) onReviewUpdated();
    } catch (error) {
      toast.error('An error occurred');
      console.error('Error:', error);
    }
  };

  // Handle deleting review
  const handleDelete = async () => {
    if (!isDeleting) return;

    try {
      const { error } = await deleteReview(review.id);

      if (error) {
        toast.error('Failed to delete review');
        console.error('Error deleting review:', error);
        return;
      }

      toast.success('Review deleted successfully');
      if (onReviewDeleted) onReviewDeleted();
    } catch (error) {
      toast.error('An error occurred');
      console.error('Error:', error);
    }
  };

  // Render edit form
  if (isEditing) {
    return (
      <div className="border-b border-gray-200 pb-6">
        <div className="mb-4">
          <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-1">
            Rating
          </label>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setEditedRating(star)}
                className="focus:outline-none"
              >
                <svg
                  className={`h-6 w-6 ${
                    star <= editedRating ? 'text-yellow-500' : 'text-gray-300'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Review
          </label>
          <textarea
            id="content"
            rows={4}
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
          />
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleSaveEdit}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Save
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Render delete confirmation
  if (isDeleting) {
    return (
      <div className="border-b border-gray-200 pb-6">
        <p className="mb-4 text-gray-700">Are you sure you want to delete this review?</p>
        <div className="flex space-x-2">
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete
          </button>
          <button
            onClick={() => setIsDeleting(false)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Render normal review
  return (
    <div className="border border-gray-200 rounded-lg p-6 mb-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg mr-3">
            {review.user?.first_name ? review.user.first_name[0].toUpperCase() : 'A'}
          </div>
          <div>
            <h3 className="font-bold text-gray-900">
              {review.user?.first_name || 'Anonymous'} {review.user?.last_name || ''}
            </h3>
            <div className="flex items-center">
              <div className="flex mr-2">{renderRating(review.rating)}</div>
              <span className="text-gray-500 text-sm">{formattedDate}</span>
            </div>
          </div>
        </div>
        {review.is_verified_purchase && (
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Verified Purchase
          </span>
        )}
      </div>

      {review.title && (
        <h4 className="font-medium text-lg mb-2 text-gray-900">{review.title}</h4>
      )}

      {review.content && (
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <p className="text-gray-700 whitespace-pre-line">{review.content}</p>
        </div>
      )}

      <div className="flex justify-between items-center mt-2">
        <div className="flex items-center text-gray-500 text-sm">
          <span>Was this review helpful?</span>
          <button className="ml-2 px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700">
            Yes
          </button>
          <button className="ml-2 px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700">
            No
          </button>
        </div>

        {isAuthor && (
          <div className="flex space-x-2">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center text-sm text-primary hover:text-primary/80"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            <button
              onClick={() => setIsDeleting(true)}
              className="flex items-center text-sm text-red-600 hover:text-red-800"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
