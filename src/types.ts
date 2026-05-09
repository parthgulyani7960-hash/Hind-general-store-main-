import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Permission = 
  | 'view_dashboard' 
  | 'manage_orders' 
  | 'manage_products' 
  | 'manage_users' 
  | 'view_analytics'
  | 'manage_settings';

export interface RoleDefinition {
  name: string;
  permissions: Permission[];
}

export interface User {
  id: number;
  phone: string;
  username?: string;
  name: string;
  email?: string;
  shop_name?: string;
  pin_code?: string;
  role: 'customer' | 'admin' | 'retailer' | 'wholesaler';
  permissions?: Permission[]; // Added permissions field
  wallet_balance: number;
  khata_enabled: boolean;
  khata_limit: number;
  khata_balance: number;
  khata_due_date?: string;
  segment: 'Regular' | 'Irregular';
  profile_photo?: string;
  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  wholesale_price?: number;
  retail_price?: number;
  discount?: number;
  discount_price?: number;
  category: string;
  stock: number;
  reorder_point?: number;
  max_qty?: number;
  weight_kg?: number;
  consumable_days?: number;
  supplier_id?: number;
  lead_time_days?: number;
  is_listed: boolean;
  unit: string;
  image_url: string;
  images?: string[];
  specifications?: { [key: string]: string };
  variants?: ProductVariant[];
  avg_rating?: number;
  review_count?: number;
  created_at?: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  name: string;
  price: number;
  stock: number;
  unit_quantity: number;
  is_default: boolean;
}

export interface CartItem extends Product {
  quantity: number;
  selectedVariant?: ProductVariant;
}

export interface Order {
  id: number;
  user_id: number;
  user_name?: string;
  user_phone?: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'failed';
  address: string;
  payment_method: string;
  payment_id?: string;
  payment_screenshot?: string;
  rejection_reason?: string;
  delivery_type: 'home' | 'pickup';
  notes?: string;
  admin_notes?: string;
  created_at: string;
  items?: any[];
}

export interface Review {
  id: number;
  product_id: number;
  user_id: number;
  user_name: string;
  rating: number;
  comment: string;
  is_verified?: boolean | number;
  created_at: string;
  response?: string;
}

export interface Recommendation {
  product_id: number;
  related_product_id: number;
  score: number;
}

export interface WaitlistEntry {
  id: number;
  product_id: number;
  user_id?: number;
  email: string;
  created_at: string;
  notified_at?: string;
}

export interface UserAddress {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  pin_code: string;
  delivery_area: string;
  is_default: boolean;
  created_at?: string;
}

export interface Coupon {
  id: number;
  code: string;
  type: 'flat' | 'percentage';
  value: number;
  min_order: number;
  active: boolean;
  conditions?: {
    segment?: 'Regular' | 'Irregular';
    category?: string;
    start_time?: string;
    end_time?: string;
  };
}

export interface PromotionRule {
  id: number;
  name: string;
  description?: string;
  type: 'bogo' | 'percentage' | 'fixed';
  value: number; // Percentage value, or fixed amount, or free quantity for BOGO
  min_qty?: number; // Minimum quantity for discount/BOGO
  target_type: 'all' | 'category' | 'product';
  target_id?: string | number; // ID for category or product
  active: boolean;
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
}
