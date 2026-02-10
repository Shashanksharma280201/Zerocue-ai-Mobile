import RazorpayCheckout from 'react-native-razorpay';

export interface PaymentOptions {
  amount: number; // in rupees
  orderId?: string;
  description: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  signature?: string;
  error?: string;
}

/**
 * Initiate Razorpay payment
 */
export async function initiatePayment(options: PaymentOptions): Promise<PaymentResult> {
  const { amount, orderId, description, userName, userEmail, userPhone } = options;

  const razorpayKey = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID;

  if (!razorpayKey) {
    return {
      success: false,
      error: 'Razorpay not configured. Please add EXPO_PUBLIC_RAZORPAY_KEY_ID to .env',
    };
  }

  const paymentOptions = {
    description: description,
    image: 'https://your-logo-url.com/logo.png', // Add your logo URL
    currency: 'INR',
    key: razorpayKey,
    amount: amount * 100, // Convert to paise (Razorpay uses smallest currency unit)
    name: 'ZeroCue',
    order_id: orderId, // Optional - create order on backend first
    prefill: {
      email: userEmail || '',
      contact: userPhone || '',
      name: userName || '',
    },
    theme: {
      color: '#9CAF88', // ZeroCue brand color (accent-sage)
    },
  };

  try {
    const data = await RazorpayCheckout.open(paymentOptions);

    // Payment successful
    return {
      success: true,
      paymentId: data.razorpay_payment_id,
      orderId: data.razorpay_order_id,
      signature: data.razorpay_signature,
    };
  } catch (error: any) {
    console.error('Payment error:', error);

    // Payment failed or cancelled
    return {
      success: false,
      error: error.description || error.error?.description || 'Payment failed',
    };
  }
}

/**
 * Quick UPI payment (skips Razorpay UI for faster checkout)
 */
export async function quickUPIPayment(
  amount: number,
  description: string
): Promise<PaymentResult> {
  // This would integrate with UPI deep linking for instant payment
  // For now, use the standard Razorpay flow
  return initiatePayment({ amount, description });
}

/**
 * Verify payment on backend (call this after successful payment)
 * NOTE: This should ideally be done on a secure backend
 */
export async function verifyPayment(
  paymentId: string,
  orderId: string,
  signature: string
): Promise<boolean> {
  // In production, send to your backend to verify the signature
  // Backend will use Razorpay secret to validate

  // For now, we'll trust the client-side response
  // TODO: Implement backend verification
  return true;
}
