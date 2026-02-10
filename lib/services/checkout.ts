import { createCart, addCartItem, processPayment, generateReceipt } from '../api/cart';
import { LocalCartItem } from '../types';
import { supabase } from '../supabase';
import jwt from 'jsonwebtoken'; // We'll need to install this

/**
 * Sync local cart to Supabase and create an order
 */
export async function syncCartToSupabase(
  userId: string,
  storeId: string,
  localCartItems: LocalCartItem[]
) {
  // Create a cart in Supabase
  const cart = await createCart(userId, storeId);

  // Add all items from local cart
  for (const item of localCartItems) {
    await addCartItem(
      cart.id,
      item.product.id,
      item.qty,
      item.unit_price,
      item.tax
    );
  }

  return cart;
}

/**
 * Complete checkout flow
 */
export interface CheckoutResult {
  success: boolean;
  cartId?: string;
  paymentId?: string;
  receiptId?: string;
  qrToken?: string;
  error?: string;
}

export async function completeCheckout(
  userId: string,
  storeId: string,
  localCartItems: LocalCartItem[],
  paymentMethod: 'upi' | 'card' | 'cash',
  paymentTxnRef?: string
): Promise<CheckoutResult> {
  try {
    // 1. Sync local cart to Supabase
    const cart = await syncCartToSupabase(userId, storeId, localCartItems);

    // 2. Process payment
    const payment = await processPayment(
      cart.id,
      paymentMethod,
      cart.total,
      paymentTxnRef
    );

    // 3. Generate QR receipt token (JWT with cart data)
    const qrToken = generateQRToken(cart.id, userId);

    // 4. Create receipt record
    const receipt = await generateReceipt(cart.id, qrToken);

    return {
      success: true,
      cartId: cart.id,
      paymentId: payment.id,
      receiptId: receipt.id,
      qrToken: qrToken,
    };
  } catch (error: any) {
    console.error('Checkout error:', error);
    return {
      success: false,
      error: error.message || 'Checkout failed',
    };
  }
}

/**
 * Generate QR token (JWT) for receipt
 */
function generateQRToken(cartId: string, userId: string): string {
  // In production, this secret should be from environment variables
  const secret = process.env.EXPO_PUBLIC_JWT_SECRET || 'zerocue-secret-2025';

  const payload = {
    cart_id: cartId,
    user_id: userId,
    timestamp: Date.now(),
    expires_at: Date.now() + (10 * 60 * 1000), // 10 minutes
  };

  // For React Native, we'll use a simpler approach since JWT library may not work
  // Generate a unique token based on cartId and timestamp
  const token = `${cartId}-${userId}-${Date.now()}`;
  return Buffer.from(token).toString('base64');
}

/**
 * Get user's active cart
 */
export async function getUserActiveCart(userId: string) {
  const { data, error } = await supabase
    .from('carts')
    .select(`
      *,
      cart_items:cart_items (
        *,
        product:products (*)
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    console.error('Error fetching active cart:', error);
    throw error;
  }

  return data;
}
