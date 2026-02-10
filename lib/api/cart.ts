import { supabase } from '../supabase';
import { Cart, CartItem, Payment, Receipt } from '../types';

/**
 * Create a new cart for the user
 */
export async function createCart(userId: string, storeId: string) {
  const { data, error } = await supabase
    .from('carts')
    .insert({
      user_id: userId,
      store_id: storeId,
      status: 'pending',
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating cart:', error);
    throw error;
  }

  return data as Cart;
}

/**
 * Add item to cart
 */
export async function addCartItem(
  cartId: string,
  productId: string,
  qty: number,
  unitPrice: number,
  tax: number
) {
  const subtotal = (unitPrice + tax) * qty;

  const { data, error } = await supabase
    .from('cart_items')
    .insert({
      cart_id: cartId,
      product_id: productId,
      qty,
      unit_price: unitPrice,
      tax,
      subtotal,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding cart item:', error);
    throw error;
  }

  // Update cart totals
  await updateCartTotals(cartId);

  return data as CartItem;
}

/**
 * Update cart item quantity
 */
export async function updateCartItem(cartItemId: string, qty: number) {
  const { data, error } = await supabase
    .from('cart_items')
    .update({ qty })
    .eq('id', cartItemId)
    .select()
    .single();

  if (error) {
    console.error('Error updating cart item:', error);
    throw error;
  }

  // Recalculate subtotal
  const subtotal = (data.unit_price + data.tax) * qty;
  await supabase
    .from('cart_items')
    .update({ subtotal })
    .eq('id', cartItemId);

  // Update cart totals
  await updateCartTotals(data.cart_id);

  return data as CartItem;
}

/**
 * Remove item from cart
 */
export async function removeCartItem(cartItemId: string, cartId: string) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', cartItemId);

  if (error) {
    console.error('Error removing cart item:', error);
    throw error;
  }

  // Update cart totals
  await updateCartTotals(cartId);
}

/**
 * Update cart totals (subtotal, tax, total)
 */
async function updateCartTotals(cartId: string) {
  const { data: items } = await supabase
    .from('cart_items')
    .select('qty, unit_price, tax')
    .eq('cart_id', cartId);

  if (!items) return;

  const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.qty, 0);
  const totalTax = items.reduce((sum, item) => sum + item.tax * item.qty, 0);
  const total = subtotal + totalTax;

  await supabase
    .from('carts')
    .update({ subtotal, tax: totalTax, total })
    .eq('id', cartId);
}

/**
 * Fetch cart with items
 */
export async function fetchCartById(cartId: string) {
  const { data, error } = await supabase
    .from('carts')
    .select(`
      *,
      cart_items:cart_items (
        *,
        product:products (*)
      ),
      store:stores (*)
    `)
    .eq('id', cartId)
    .single();

  if (error) {
    console.error('Error fetching cart:', error);
    throw error;
  }

  return data as Cart;
}

/**
 * Process payment and update cart status
 */
export async function processPayment(
  cartId: string,
  method: 'upi' | 'card' | 'cash',
  amount: number,
  txnRef?: string
) {
  // Create payment record
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      cart_id: cartId,
      method,
      amount,
      txn_ref: txnRef,
      status: 'completed',
    })
    .select()
    .single();

  if (paymentError) {
    console.error('Error creating payment:', paymentError);
    throw paymentError;
  }

  // Update cart status to 'paid'
  await supabase
    .from('carts')
    .update({ status: 'paid' })
    .eq('id', cartId);

  return payment as Payment;
}

/**
 * Generate QR receipt after payment
 */
export async function generateReceipt(cartId: string, qrToken: string) {
  const { data, error } = await supabase
    .from('receipts')
    .insert({
      cart_id: cartId,
      qr_token: qrToken,
      status: 'valid',
    })
    .select()
    .single();

  if (error) {
    console.error('Error generating receipt:', error);
    throw error;
  }

  return data as Receipt;
}
