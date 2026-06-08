import React from 'react';
import { cn } from '@/lib/utils';

interface OrderSummaryProps {
  cartItems: any[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  couponDiscount: number;
  tax?: number;
}

export const OrderSummary = ({
  cartItems,
  subtotal,
  deliveryFee,
  total,
  couponDiscount,
  tax = 0
}: OrderSummaryProps) => {
  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-stone-100 space-y-6">
      <h3 className="text-xl font-bold">Order Summary</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
            {cartItems.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm text-stone-600">
                    <span>{item.name} x {item.quantity}</span>
                    <span>₹{(item.finalPrice * item.quantity).toFixed(2)}</span>
                </div>
            ))}
        </div>
        <div className="border-t border-stone-100 pt-4 space-y-2 text-stone-600">
            <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
            </div>
            {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                    <span>Coupon Discount</span>
                    <span>-₹{couponDiscount.toFixed(2)}</span>
                </div>
            )}
            <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>₹{deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
                <span>Taxes</span>
                <span>₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-stone-900 border-t pt-2">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
            </div>
        </div>
      </div>
    </div>
  );
};
