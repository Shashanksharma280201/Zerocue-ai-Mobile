import { supabase } from '../supabase';
import { createCart, addCartItem, processPayment, generateReceipt } from './cart';
import { generateQRToken, type QRTokenPayload } from './qr';

/**
 * Create an order from cart items
 * This is the main checkout function that:
 * 1. Creates a cart in Supabase
 * 2. Adds all items to the cart
 * 3. Processes payment
 * 4. Generates QR receipt
 */
export async function createOrder(params: {
  userId: string;
  storeId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    taxRate: number;
  }>;
  paymentMethod: 'upi' | 'card' | 'cash';
  paymentRef?: string;
}) {
  const { userId, storeId, items, paymentMethod, paymentRef } = params;

  try {
    // 1. Create cart
    const cart = await createCart(userId, storeId);

    // 2. Add all items to cart
    for (const item of items) {
      const tax = (item.price * item.taxRate) / 100;
      await addCartItem(
        cart.id,
        item.productId,
        item.quantity,
        item.price,
        tax
      );
    }

    // 3. Fetch updated cart with totals
    const { data: updatedCart, error: cartError } = await supabase
      .from('carts')
      .select('*')
      .eq('id', cart.id)
      .single();

    if (cartError || !updatedCart) {
      throw new Error('Failed to fetch updated cart');
    }

    // 4. Process payment
    const payment = await processPayment(
      cart.id,
      paymentMethod,
      updatedCart.total,
      paymentRef
    );

    // 5. Generate QR token for receipt verification
    const qrTokenPayload: Omit<QRTokenPayload, 'timestamp' | 'nonce'> = {
      cart_id: cart.id,
      store_id: storeId,
      user_id: userId,
      amount: updatedCart.total,
    };

    const qrToken = generateQRToken(qrTokenPayload);

    // 6. Create receipt with QR token
    const receipt = await generateReceipt(cart.id, qrToken);

    return {
      success: true,
      orderId: cart.id,
      receiptId: receipt.id,
      qrToken,
      total: updatedCart.total,
    };
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

/**
 * Fetch user's order history
 */
export async function fetchUserOrders(userId: string, limit: number = 20) {
  const { data, error } = await supabase
    .from('carts')
    .select(`
      *,
      cart_items (
        *,
        product:products (*)
      ),
      store:stores (name, address),
      receipt:receipts (*)
    `)
    .eq('user_id', userId)
    .eq('status', 'paid')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }

  return data;
}

/**
 * Fetch a single order by ID
 */
export async function fetchOrderById(orderId: string) {
  const { data, error } = await supabase
    .from('carts')
    .select(`
      *,
      cart_items (
        *,
        product:products (*)
      ),
      store:stores (*),
      receipt:receipts (*)
    `)
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('Error fetching order:', error);
    throw error;
  }

  return data;
}

/**
 * Fetch receipt by QR token
 */
export async function fetchReceiptByToken(qrToken: string) {
  const { data, error } = await supabase
    .from('receipts')
    .select(`
      *,
      cart:carts (
        *,
        cart_items (
          *,
          product:products (*)
        ),
        store:stores (*)
      )
    `)
    .eq('qr_token', qrToken)
    .single();

  if (error) {
    console.error('Error fetching receipt:', error);
    throw error;
  }

  return data;
}
