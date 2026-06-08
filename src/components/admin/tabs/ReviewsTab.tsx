import React from 'react';
import { motion } from 'motion/react';
import { Star, MessageSquare, MessageCircle, Trash2, Check, X } from 'lucide-react';
import { cn } from '@/types';

interface ReviewsTabProps {
  reviews: any[];
  setReviewResponseModal: (modal: { open: boolean; review: any }) => void;
  setReviewResponse: (res: string) => void;
  updateReviewStatus: (id: number, status: string) => void;
  deleteReview: (id: number) => void;
}

export default function ReviewsTab({
  reviews,
  setReviewResponseModal,
  setReviewResponse,
  updateReviewStatus,
  deleteReview,
}: ReviewsTabProps) {
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / reviews.length).toFixed(1) 
    : "0.0";

  return (
    <div className="h-full overflow-y-auto no-scrollbar space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans pb-10 pr-2">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 font-sans">
        <div className="space-y-1">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary rotate-6">
              <Star size={24} fill="currentColor" />
            </div>
            <h2 className="text-4xl font-black text-stone-900 tracking-tight text-left">Customer Reviews</h2>
          </div>
          <p className="text-stone-500 font-medium text-lg ml-1 text-left">Moderate customer feedback and review ratings.</p>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 flex items-center space-x-8">
           <div className="flex flex-col items-start">
             <span className="text-[10px] uppercase font-black text-stone-400 tracking-widest leading-none mb-1">Total Reviews</span>
             <span className="text-2xl font-black text-stone-900">{reviews.length} Total</span>
           </div>
           <div className="w-px h-10 bg-stone-100" />
           <div className="flex flex-col items-start">
             <span className="text-[10px] uppercase font-black text-stone-400 tracking-widest leading-none mb-1">Average Rating</span>
             <span className="text-2xl font-black text-primary">{averageRating} / 5.0</span>
           </div>
        </div>
      </header>

      <div className="bg-white rounded-[3rem] shadow-sm border border-stone-100 overflow-hidden font-sans">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left font-sans">
            <thead className="bg-stone-50/50 text-stone-400 text-[10px] uppercase font-black tracking-[0.25em]">
              <tr>
                <th className="px-10 py-8">Product</th>
                <th className="px-6 py-8">Customer</th>
                <th className="px-6 py-8">Rating</th>
                <th className="px-6 py-8">Comment</th>
                <th className="px-6 py-8">Status</th>
                <th className="px-6 py-8">Date</th>
                <th className="px-10 py-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50 font-sans">
              {reviews.map((review, idx) => (
                <motion.tr 
                  key={review.id} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="group hover:bg-stone-50/80 transition-all animate-in"
                >
                  <td className="px-10 py-6">
                    <p className="font-black text-stone-900 tracking-tighter truncate max-w-[180px] text-left" title={review.product_name}>{review.product_name}</p>
                  </td>
                  <td className="px-6 py-6">
                    <p className="text-xs font-bold text-stone-600 uppercase tracking-widest text-left">{review.user_name}</p>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex space-x-0.5 text-amber-400 text-left justify-start">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "drop-shadow-[0_0_8px_rgba(251,191,36,0.3)] shrink-0" : "shrink-0"} />
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-6 font-sans">
                    <div className="max-w-[280px] flex flex-col items-start">
                      <p className="text-sm text-stone-600 italic font-medium leading-relaxed mb-1 line-clamp-2 text-left" title={review.comment}>"{review.comment}"</p>
                      {review.response && (
                        <div className="flex items-center space-x-2 text-[10px] text-primary font-black uppercase tracking-widest bg-primary/5 px-2 py-1 rounded-lg border border-primary/10 w-fit">
                          <MessageSquare size={10} />
                          <span>Response Logged</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className={cn(
                        "text-[9px] font-black px-3 py-1.5 rounded-2xl uppercase tracking-widest border",
                        review.status === 'approved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                        review.status === 'rejected' ? "bg-red-50 text-red-600 border-red-100" :
                        "bg-amber-50 text-amber-600 border-amber-100"
                    )}>{review.status}</span>
                  </td>
                  <td className="px-6 py-6 whitespace-nowrap">
                     <div className="flex flex-col items-start">
                       <span className="text-xs font-black text-stone-800 tracking-tight text-left">
                         {review.created_at ? new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}
                       </span>
                       <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-0.5 text-left">
                         {review.created_at ? new Date(review.created_at).getFullYear() : ''}
                       </span>
                     </div>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex items-center justify-end space-x-3">
                      {review.status === 'pending' && (
                        <div className="flex space-x-2 mr-2">
                          <button 
                            onClick={() => updateReviewStatus(review.id, 'approved')} 
                            className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm border border-emerald-100 inline-flex items-center"
                            title="Approve"
                          >
                            <Check size={16} />
                          </button>
                          <button 
                            onClick={() => updateReviewStatus(review.id, 'rejected')} 
                            className="p-3 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-all shadow-sm border border-red-100 inline-flex items-center"
                            title="Reject"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                      <button 
                        onClick={() => {
                          setReviewResponseModal({ open: true, review });
                          setReviewResponse(review.response || '');
                        }}
                        className="p-3 bg-stone-50 text-stone-400 hover:text-primary hover:bg-white hover:shadow-md rounded-xl transition-all border border-transparent hover:border-stone-100 inline-flex items-center"
                        title={review.response ? 'Edit Response' : 'Reply'}
                      >
                        <MessageCircle size={18} />
                      </button>
                      <button 
                        onClick={() => deleteReview(review.id)}
                        className="p-3 bg-stone-50 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent inline-flex items-center"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {reviews.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-10 py-32 text-center text-stone-400 font-bold italic bg-stone-50/50 rounded-[3rem]">No customer reviews found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
