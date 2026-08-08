import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, Check, Sparkles, MessageSquare, ThumbsUp, Heart, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchWithHandling } from '@/lib/api';

interface PostOrderFeedbackProps {
  orderId: string;
  phone: string;
  existingFeedback?: {
    rating: number;
    comment: string;
    aspects: string[];
    created_at?: string;
  };
  onFeedbackSubmitted: (feedback: any) => void;
}

export function PostOrderFeedback({
  orderId,
  phone,
  existingFeedback,
  onFeedbackSubmitted,
}: PostOrderFeedbackProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [selectedAspects, setSelectedAspects] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const positiveAspects = [
    '⚡ Fast Delivery',
    '📦 Secure Packaging',
    '🍎 Fresh Items',
    '🏃 Polite Runner',
    '📱 Easy to Use App',
    '💰 Great Prices',
  ];

  const negativeAspects = [
    '🐢 Late Delivery',
    '⚠️ Damaged Items',
    '❌ Missing Products',
    '👎 Unfriendly Runner',
    '🧩 App Glitch',
    '📞 Poor Support',
  ];

  const activeAspects = rating >= 4 ? positiveAspects : rating > 0 ? negativeAspects : [];

  const handleAspectToggle = (aspect: string) => {
    setSelectedAspects((prev) =>
      prev.includes(aspect) ? prev.filter((a) => a !== aspect) : [...prev, aspect]
    );
  };

  const handleRatingSelect = (newRating: number) => {
    setRating(newRating);
    // Reset selected aspects when shifting from positive to negative rating scales
    setSelectedAspects([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a rating to submit feedback.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetchWithHandling<any>(`/api/public/orders/${encodeURIComponent(orderId)}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          rating,
          comment,
          aspects: selectedAspects,
        }),
      });

      if (response && response.success) {
        toast.success('Thank you! Your feedback has been logged.');
        onFeedbackSubmitted(response.feedback);
      } else {
        toast.error(response?.message || 'Failed to submit feedback.');
      }
    } catch (err: any) {
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If feedback is already submitted, show a beautiful summary card
  if (existingFeedback) {
    const isPositive = existingFeedback.rating >= 4;

    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-emerald-50/40 p-8 rounded-[2.5rem] border border-emerald-100/60 shadow-xl shadow-stone-100/30 flex flex-col items-center text-center space-y-6"
      >
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
          <Check size={28} className="stroke-[3]" />
        </div>

        <div className="space-y-2">
          <h4 className="text-2xl font-black text-stone-900 tracking-tight">Feedback Logged Successfully</h4>
          <p className="text-stone-500 font-medium text-sm max-w-md mx-auto">
            Your review helps us refine our deliveries and provide the absolute best retail experience.
          </p>
        </div>

        {/* Rating Display */}
        <div className="space-y-2">
          <div className="flex justify-center space-x-1.5 text-amber-400">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={22}
                fill={i < existingFeedback.rating ? 'currentColor' : 'none'}
                className={i < existingFeedback.rating ? 'drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]' : 'text-stone-200'}
              />
            ))}
          </div>
          <span className="text-[11px] uppercase font-black tracking-widest text-stone-400">
            {existingFeedback.rating} / 5.0 Rating
          </span>
        </div>

        {/* Aspects display */}
        {existingFeedback.aspects && existingFeedback.aspects.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 max-w-lg">
            {existingFeedback.aspects.map((aspect) => (
              <span
                key={aspect}
                className="px-4 py-2 bg-white border border-emerald-100 rounded-full text-xs font-bold text-emerald-700 shadow-sm"
              >
                {aspect}
              </span>
            ))}
          </div>
        )}

        {/* Comment blockquote */}
        {existingFeedback.comment && (
          <div className="relative max-w-lg bg-white/70 p-5 rounded-2xl border border-stone-100 shadow-sm mt-2">
            <span className="absolute -top-3 left-6 px-2 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest border border-emerald-100/40 rounded-md">
              Your Comments
            </span>
            <p className="text-sm italic font-medium text-stone-600 leading-relaxed text-left">
              "{existingFeedback.comment}"
            </p>
          </div>
        )}

        {existingFeedback.created_at && (
          <span className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
            Submitted on {new Date(existingFeedback.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-stone-200/50 border border-stone-100"
    >
      <div className="flex flex-col md:flex-row items-center justify-between border-b border-stone-100 pb-6 mb-8 gap-4">
        <div className="text-center md:text-left space-y-1">
          <h4 className="text-2xl font-black text-stone-900 tracking-tight flex items-center justify-center md:justify-start gap-2">
            <Sparkles className="text-primary animate-pulse" size={22} />
            Rate Your Experience
          </h4>
          <p className="text-stone-500 text-sm font-medium">
            How was your shopping, support, and delivery experience today?
          </p>
        </div>
        <div className="px-4 py-2 bg-primary/5 border border-primary/10 rounded-2xl flex items-center gap-2 text-primary font-black uppercase tracking-widest text-xs">
          <ThumbsUp size={14} />
          Post-Delivery Review
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Rating Stars Input */}
        <div className="flex flex-col items-center justify-center space-y-3 p-6 bg-stone-50 rounded-3xl border border-stone-100/50">
          <span className="text-xs font-black uppercase tracking-widest text-stone-400">
            {rating === 0 ? 'Select Stars' : `${rating} Star${rating > 1 ? 's' : ''} - ${
              rating === 5 ? 'Excellent' : rating === 4 ? 'Very Good' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'
            }`}
          </span>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const isActive = (hoveredRating || rating) >= star;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingSelect(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 hover:scale-125 active:scale-95 transition-all outline-none duration-150"
                >
                  <Star
                    size={40}
                    className="transition-all"
                    fill={isActive ? 'currentColor' : 'none'}
                    color={isActive ? '#F59E0B' : '#D1D5DB'}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Aspects Checkbox Display */}
        <AnimatePresence mode="wait">
          {rating > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 overflow-hidden"
            >
              <label className="block text-xs font-black text-stone-400 uppercase tracking-widest text-left">
                {rating >= 4 ? 'What did you love most?' : 'What can we improve?'}
              </label>
              <div className="flex flex-wrap gap-2.5">
                {activeAspects.map((aspect) => {
                  const isSelected = selectedAspects.includes(aspect);
                  return (
                    <button
                      key={aspect}
                      type="button"
                      onClick={() => handleAspectToggle(aspect)}
                      className={`px-5 py-3 rounded-full text-xs font-bold transition-all border flex items-center gap-2 ${
                        isSelected
                          ? rating >= 4
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm scale-102'
                            : 'bg-red-50 border-red-200 text-red-700 shadow-sm scale-102'
                          : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-300'
                      }`}
                    >
                      {aspect}
                      {isSelected && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-white ${
                            rating >= 4 ? 'bg-emerald-600' : 'bg-red-600'
                          }`}
                        >
                          <Check size={10} className="stroke-[3]" />
                        </motion.span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Written Feedback Input */}
        <div className="space-y-2">
          <label className="block text-xs font-black text-stone-400 uppercase tracking-widest text-left">
            Additional comments (Optional)
          </label>
          <div className="relative">
            <MessageSquare className="absolute left-4 top-4 text-stone-300" size={18} />
            <textarea
              placeholder="Tell us more about your overall experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-stone-50 border border-stone-100 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all font-medium text-stone-700 resize-none"
              rows={3}
              maxLength={500}
            />
          </div>
          <div className="text-right text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            {comment.length} / 500 characters
          </div>
        </div>

        {/* Submit Action */}
        <button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className={`w-full py-4 rounded-2xl font-black uppercase tracking-wider text-sm transition-all active:scale-95 flex items-center justify-center gap-2 ${
            rating === 0
              ? 'bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-100'
              : 'bg-primary text-white hover:bg-primary/90 shadow-xl shadow-primary/20 hover:scale-[1.01]'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Submitting Feedback...</span>
            </>
          ) : (
            <span>Submit Experience Rating</span>
          )}
        </button>
      </form>
    </motion.div>
  );
}
