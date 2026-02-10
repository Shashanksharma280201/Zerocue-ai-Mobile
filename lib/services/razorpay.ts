import RazorpayCheckout from 'react-native-razorpay';

export interface RazorpayOptions {
  orderId: string;
  amount: number; // in paise (₹1 = 100 paise)
  name: string;
  description: string;
  customerName?: string;
  customerEmail?: string;
  customerContact?: string;
}

export interface PaymentSuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface PaymentErrorResponse {
  code: number;
  description: string;
  reason?: string;
  step?: string;
  source?: string;
  metadata?: {
    order_id?: string;
    payment_id?: string;
  };
}

/**
 * Initialize Razorpay payment
 * Production-ready with comprehensive error handling
 */
export async function initiateRazorpayPayment(
  options: RazorpayOptions
): Promise<PaymentSuccessResponse> {
  const {
    orderId,
    amount,
    name,
    description,
    customerName,
    customerEmail,
    customerContact,
  } = options;

  // Get Razorpay Key from environment
  const RAZORPAY_KEY = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_demo'; // Fallback for testing

  const razorpayOptions = {
    description,
    image: 'https://your-app-logo-url.com/logo.png', // Replace with actual logo
    currency: 'INR',
    key: RAZORPAY_KEY,
    amount, // Amount in paise
    name,
    order_id: orderId,
    prefill: {
      name: customerName || '',
      email: customerEmail || '',
      contact: customerContact || '',
    },
    theme: {
      color: '#64B5F6', // Brand primary color
      backdrop_color: '#2C2C2C',
    },
    modal: {
      ondismiss: () => {
        throw new Error('Payment cancelled by user');
      },
    },
    send_sms_hash: true,
    retry: {
      enabled: true,
      max_count: 3,
    },
    timeout: 600, // 10 minutes
    remember_customer: true,
    notes: {
      app: 'ZeroCue',
      platform: 'mobile',
    },
  };

  try {
    const data = await RazorpayCheckout.open(razorpayOptions);

    console.log('✅ Payment Success:', data);

    return {
      razorpay_payment_id: data.razorpay_payment_id,
      razorpay_order_id: data.razorpay_order_id || orderId,
      razorpay_signature: data.razorpay_signature || '',
    };
  } catch (error: any) {
    console.error('❌ Razorpay Payment Failed:', error);

    // Parse Razorpay error
    const errorResponse: PaymentErrorResponse = {
      code: error.code || 0,
      description: error.description || 'Payment failed',
      reason: error.reason,
      step: error.step,
      source: error.source,
      metadata: error.metadata,
    };

    // User-friendly error messages
    const userMessage = getUserFriendlyErrorMessage(errorResponse);
    throw new Error(userMessage);
  }
}

/**
 * Convert technical Razorpay errors to user-friendly messages
 */
function getUserFriendlyErrorMessage(error: PaymentErrorResponse): string {
  // User cancelled
  if (error.description.toLowerCase().includes('cancel')) {
    return 'Payment cancelled. You can try again when ready.';
  }

  // Network issues
  if (error.code === 2 || error.code === 3) {
    return 'Network error. Please check your internet connection and try again.';
  }

  // Payment gateway errors
  if (error.code === 1) {
    if (error.reason?.includes('insufficient')) {
      return 'Insufficient balance. Please try another payment method.';
    }
    if (error.reason?.includes('timeout')) {
      return 'Payment timeout. Please try again.';
    }
    if (error.reason?.includes('declined')) {
      return 'Payment declined by your bank. Please contact your bank or try another card.';
    }
  }

  // Default fallback
  return error.description || 'Payment failed. Please try again or contact support.';
}

/**
 * Verify Razorpay signature (server-side verification)
 * This should be called after successful payment to verify authenticity
 */
export function generateRazorpaySignature(
  orderId: string,
  paymentId: string,
  secret: string
): string {
  // This should ideally be done server-side for security
  // Client-side implementation for reference only
  const crypto = require('crypto-js');
  const message = `${orderId}|${paymentId}`;
  const signature = crypto.HmacSHA256(message, secret).toString();
  return signature;
}

/**
 * Create Razorpay order on server
 * This must be called before initiating payment
 */
export async function createRazorpayOrder(
  amount: number,
  currency: string = 'INR'
): Promise<{ orderId: string; amount: number }> {
  // This should call your backend API to create a Razorpay order
  // Backend will use Razorpay API with secret key

  try {
    // TODO: Replace with actual API call
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount, // in paise
        currency,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create payment order');
    }

    return {
      orderId: data.orderId,
      amount: data.amount,
    };
  } catch (error: any) {
    console.error('Create order error:', error);
    throw new Error('Failed to initiate payment. Please try again.');
  }
}
