import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/StoreContext';
import { fetchWithHandling } from '@/lib/api';
import { getAuthHeaders } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Star } from 'lucide-react';

export default function ReviewPromptNotification() {
  const { user } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    // Only prompt for reviews when on the Profile page to keep product/catalog browsing quiet and distraction-free
    if (window.location.pathname !== '/profile') return;

    const checkDeliveredOrdersForReview = async () => {
      try {
        // Fetch user orders
        const orders = await fetchWithHandling<any[]>(`/api/orders/user/${user.id}`, { headers: getAuthHeaders() });
        if (!orders || !Array.isArray(orders)) return;

        // Get already prompted order IDs
        const promptedString = localStorage.getItem('hgs_orders_prompted_reviews') || '[]';
        let promptedList: string[] = [];
        try {
          promptedList = JSON.parse(promptedString);
        } catch {
          promptedList = [];
        }

        const markAsPrompted = (orderId: string) => {
          if (!promptedList.includes(orderId)) {
            promptedList.push(orderId);
            localStorage.setItem('hgs_orders_prompted_reviews', JSON.stringify(promptedList));
          }
        };

        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000; // 24 hours in ms
        const nowMs = Date.now();

        // Find the first order delivered more than 24 hours ago that hasn't been prompted yet
        const eligibleOrder = orders.find(order => {
          if (order.status !== 'delivered') return false;
          if (promptedList.includes(String(order.id))) return false;

          const deliveryTimeStr = order.delivered_at || order.updated_at || order.created_at;
          if (!deliveryTimeStr) return false;

          const deliveryMs = new Date(deliveryTimeStr).getTime();
          const ageMs = nowMs - deliveryMs;

          return ageMs >= TWENTY_FOUR_HOURS;
        });

        if (eligibleOrder) {
          const orderIdStr = String(eligibleOrder.id);
          const visibleId = eligibleOrder.order_id || eligibleOrder.id;

          // Trigger a beautiful react-hot-toast
          toast((t) => (
            <div className="flex flex-col gap-2 p-1 min-w-[280px]">
              <div className="flex items-center gap-2 font-bold text-stone-900 text-sm">
                <Star size={16} className="text-amber-500 fill-amber-500 animate-pulse animate-duration-1000" />
                <span>Rate your purchase!</span>
              </div>
              <p className="text-xs text-stone-500 leading-relaxed">
                Your order <span className="font-semibold text-stone-700">#{visibleId}</span> was delivered at least 24 hours ago. Let us know how we did!
              </p>
              <div className="flex gap-2 justify-end mt-1">
                <button 
                  onClick={() => {
                    toast.dismiss(t.id);
                    markAsPrompted(orderIdStr);
                  }}
                  className="px-2.5 py-1 text-xs text-stone-400 hover:text-stone-600 rounded-lg border border-stone-200 transition-colors font-bold"
                >
                  Dismiss
                </button>
                <button 
                  onClick={() => {
                    toast.dismiss(t.id);
                    markAsPrompted(orderIdStr);
                    navigate(`/profile?tab=history&reviewOrderId=${eligibleOrder.id}`);
                  }}
                  className="px-3 py-1 text-xs bg-stone-900 text-white font-black rounded-lg hover:bg-stone-800 transition-colors shadow-sm"
                >
                  Write Review
                </button>
              </div>
            </div>
          ), {
            duration: 15000,
            position: 'bottom-right'
          });
        }
      } catch (err) {
        console.error('[ReviewPromptNotification] Error checking reviews:', err);
      }
    };

    // Run check after initial load delay so loading screens and settle events occur first
    const alarm = setTimeout(() => {
      checkDeliveredOrdersForReview();
    }, 4000);

    return () => clearTimeout(alarm);
  }, [user, navigate]);

  return null;
}
