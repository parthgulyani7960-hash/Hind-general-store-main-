import React from 'react';
import { Star, ThumbsUp } from 'lucide-react';
import { Review } from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ReviewSectionProps {
  reviews: Review[];
  productId: number;
  onReviewSubmit: (e: React.FormEvent) => void;
  rating: number;
  setRating: (rating: number) => void;
  comment: string;
  setComment: (comment: string) => void;
}

export const ReviewSection: React.FC<ReviewSectionProps> = ({ 
  reviews, productId, onReviewSubmit, rating, setRating, comment, setComment 
}) => {
  return (
    <div className="mt-20 space-y-8" id="reviews">
      <h2 className="text-3xl font-bold text-stone-900 border-b border-stone-100 pb-4">Customer Reviews</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Review Form */}
        <div className="lg:col-span-1 bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
          <h3 className="text-xl font-bold mb-6">Write a Review</h3>
          <form onSubmit={onReviewSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Rating</label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={cn(
                      "p-1 transition-transform hover:scale-110",
                      rating >= star ? "text-amber-500" : "text-stone-300"
                    )}
                  >
                    <Star size={24} fill={rating >= star ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Comment</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-4 rounded-xl border border-stone-200 focus:border-primary outline-none"
                rows={4}
                required
              />
            </div>
            <button type="submit" className="w-full btn-primary py-4">Submit Review</button>
          </form>
        </div>

        {/* Existing Reviews */}
        <div className="lg:col-span-2 space-y-6">
          {reviews.length === 0 ? (
            <p className="text-stone-500">No reviews yet. Be the first to review!</p>
          ) : (
            reviews.map((review: any) => (
              <div key={review.id} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                      {review.user_name?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <p className="font-bold text-stone-900">{review.user_name}</p>
                      <p className="text-xs text-stone-400">{review.created_at ? format(new Date(review.created_at), 'PPP') : ''}</p>
                    </div>
                  </div>
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} />
                    ))}
                  </div>
                </div>
                <p className="text-stone-600">{review.comment}</p>
                {review.is_verified && (
                    <div className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
                        <ThumbsUp size={12} />
                        <span>Verified Purchase</span>
                    </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
