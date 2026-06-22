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
  id: string | number;
  phone: string;
  username?: string;
  name: string;
  email?: string;
  shop_name?: string;
  pin_code?: string;
  role: 'customer' | 'admin' | 'retailer' | 'wholesaler' | 'runner' | 'delivery';
  permissions?: Permission[]; 
  wallet_balance: number;
  khata_enabled: boolean;
  khata_limit: number;
  khata_balance: number;
  khata_due_date?: string;
  khata_allowed?: boolean;
  khata_requested?: boolean;
  credit_limit?: number;
  segment: 'Regular' | 'Irregular';
  profile_photo?: string;
  street_address?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  notification_orders?: boolean;
  notification_promotions?: boolean;
  status?: 'active' | 'disabled';
  last_login_at?: string;
  loyalty_points?: number;
  total_orders?: number;
  total_spent?: number;
  is_new?: boolean;
}

export interface Product {
  id: number | string;
  name: string;
  description?: string;
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
  supplier_id?: number | string;
  lead_time_days?: number;
  is_listed?: boolean;
  is_deleted?: boolean;
  unit?: string;
  image_url: string;
  image?: string;
  images?: string[];
  specifications?: { [key: string]: string };
  variants?: ProductVariant[];
  avg_rating?: number;
  review_count?: number;
  sales_count?: number;
  created_at?: string;
}

export interface ProductVariant {
  id: number | string;
  product_id: number | string;
  name: string;
  price: number;
  stock: number;
  unit_quantity: number;
  is_default: boolean;
}

export interface CartItem extends Partial<Product> {
  id: number | string;
  name: string;
  price: number;
  quantity: number;
  variantId?: number | string;
  selectedVariant?: ProductVariant;
  image_url: string;
  category?: string;
  stock?: number;
}

export interface Order {
  id: number;
  user_id: number;
  user_name?: string;
  user_phone?: string;
  total: number;
  total_amount?: number;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'failed';
  payment_status?: 'paid' | 'pending' | 'failed' | 'refunded';
  address: string;
  payment_method: string;
  delivery_type?: 'delivery' | 'pickup' | 'standard';
  payment_id?: string;
  payment_screenshot?: string;
  rejection_reason?: string;
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
  house_number?: string;
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
  title: string;
  description?: string;
  type: 'bogo' | 'percentage' | 'fixed' | 'discount';
  discount_value: number; 
  value?: number;
  condition_qty?: number;
  min_qty?: number;
  reward_qty?: number;
  target_type: 'all' | 'category' | 'product';
  target_id?: string | number;
  category?: string;
  product_id?: number | string;
  active: boolean;
  start_date?: string;
  end_date?: string;
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  date: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'maintenance' | 'promo';
  priority: 'low' | 'medium' | 'high' | 'critical';
  is_dismissible: boolean | number;
  product_id?: number | string;
  link?: string;
}
