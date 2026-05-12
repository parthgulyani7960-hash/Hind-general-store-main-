import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('hgs_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

export function calculateBulkDiscount(product: any, quantity: number, bulkDiscounts: any[]) {
  if (!bulkDiscounts || bulkDiscounts.length === 0) return 0;

  // Filter relevant discounts
  const relevantDiscounts = bulkDiscounts.filter(bd => 
    bd.active && (
      (bd.entity_type === 'product' && bd.entity_id === product.id) ||
      (bd.entity_type === 'category' && bd.entity_name === product.category)
    )
  ).sort((a, b) => b.min_qty - a.min_qty); // Highest quantity first

  // Find the first discount that matches the quantity
  const applicableDiscount = relevantDiscounts.find(bd => quantity >= bd.min_qty);

  if (!applicableDiscount) return 0;

  const basePrice = product.discount_price || product.price;

  if (applicableDiscount.discount_type === 'percentage') {
    return (basePrice * applicableDiscount.discount_value) / 100;
  } else {
    return applicableDiscount.discount_value;
  }
}
