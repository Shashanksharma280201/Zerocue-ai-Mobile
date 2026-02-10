// Database types matching zentro-pos backend

// Brand/Tenant
export interface Brand {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  category: string;
  rating?: number;
  created_at: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  sku: string;
  barcode: string;
  name: string;
  description?: string;
  mrp: number;
  tax_rate: number;
  category?: string;
  attributes?: Record<string, any>;
  media?: string[];
  image?: string;
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  tenant_id: string;
  brand_name?: string;
  brand_logo?: string;
  name: string;
  address?: string;
  geo?: {
    lat: number;
    lng: number;
  };
  distance?: number; // in km
  open_hours?: Record<string, any>;
  is_open?: boolean;
  phone?: string;
  rating?: number;
  created_at: string;
}

export interface StoreInventory {
  id: string;
  store_id: string;
  product_id: string;
  qty_on_hand: number;
  reorder_point?: number;
  product?: Product;
}

export type CartStatus = 'pending' | 'paid' | 'cleared' | 'cancelled';

export interface Cart {
  id: string;
  user_id: string;
  store_id: string;
  status: CartStatus;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  created_at: string;
  updated_at: string;
  cart_items?: CartItem[];
  store?: Store;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  qty: number;
  unit_price: number;
  tax: number;
  subtotal: number;
  product?: Product;
}

export type PaymentMethod = 'upi' | 'card' | 'cash';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  cart_id: string;
  method: PaymentMethod;
  txn_ref?: string;
  amount: number;
  status: PaymentStatus;
  meta?: Record<string, any>;
  created_at: string;
}

export type ReceiptStatus = 'valid' | 'used' | 'expired';

export interface Receipt {
  id: string;
  cart_id: string;
  qr_token: string;
  status: ReceiptStatus;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  cart?: Cart;
}

// Cart item for local state
export interface LocalCartItem {
  product: Product;
  qty: number;
  unit_price: number;
  tax: number;
  subtotal: number;
}

// User profile
export interface UserProfile {
  id: string;
  phone: string;
  name: string;
  email?: string;
  created_at: string;
}

// Booking System
export type BookingStatus = 'active' | 'expired' | 'picked_up' | 'cancelled';

export interface BookingItem {
  id: string;
  product: Product;
  qty: number;
  unit_price: number;
}

export interface Booking {
  id: string;
  user_id: string;
  store_id: string;
  store?: Store;
  items: BookingItem[];
  total: number;
  status: BookingStatus;
  expires_at: string; // ISO timestamp - 6 hours from creation
  created_at: string;
  picked_up_at?: string;
}
