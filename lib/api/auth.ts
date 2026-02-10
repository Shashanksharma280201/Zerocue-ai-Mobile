import { supabase } from '../supabase';
import { isOnline } from '../offline/networkManager';

export interface AuthResponse {
  session: any;
  user: any;
}

export interface SendOTPResponse {
  success: boolean;
  message: string;
}

/**
 * Send OTP to phone number
 */
export async function sendOTP(phoneNumber: string): Promise<SendOTPResponse> {
  if (!isOnline()) {
    throw new Error('No internet connection. Please check your network and try again.');
  }

  try {
    // Format phone number for Indian numbers (+91)
    const formattedPhone = phoneNumber.startsWith('+91')
      ? phoneNumber
      : `+91${phoneNumber}`;

    console.log('Sending OTP to:', formattedPhone);

    // Use Supabase Auth with phone OTP
    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    });

    if (error) {
      console.error('OTP send error:', error);
      throw new Error(error.message || 'Failed to send OTP');
    }

    return {
      success: true,
      message: 'OTP sent successfully',
    };
  } catch (error: any) {
    console.error('Send OTP exception:', error);
    throw new Error(error.message || 'Failed to send OTP');
  }
}

/**
 * Verify OTP and sign in
 */
export async function verifyOTP(
  phoneNumber: string,
  otp: string
): Promise<AuthResponse> {
  if (!isOnline()) {
    throw new Error('No internet connection. Please check your network and try again.');
  }

  try {
    // Format phone number
    const formattedPhone = phoneNumber.startsWith('+91')
      ? phoneNumber
      : `+91${phoneNumber}`;

    console.log('Verifying OTP for:', formattedPhone);

    // Verify OTP with Supabase
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: 'sms',
    });

    if (error) {
      console.error('OTP verification error:', error);
      throw new Error(error.message || 'Invalid OTP');
    }

    if (!data.session || !data.user) {
      throw new Error('Authentication failed');
    }

    // Check if user profile exists
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    // If no profile exists, create one
    if (profileError || !profile) {
      console.log('Creating new user profile');

      const newProfile = {
        id: data.user.id,
        phone: formattedPhone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from('users')
        .insert([newProfile]);

      if (insertError) {
        console.error('Profile creation error:', insertError);
        // Don't fail auth if profile creation fails, user can complete later
      }
    }

    return {
      session: data.session,
      user: profile || {
        id: data.user.id,
        phone: formattedPhone,
      },
    };
  } catch (error: any) {
    console.error('Verify OTP exception:', error);
    throw new Error(error.message || 'Failed to verify OTP');
  }
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  } catch (error: any) {
    console.error('Sign out exception:', error);
    throw error;
  }
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Get session error:', error);
      return null;
    }

    return data.session;
  } catch (error) {
    console.error('Get session exception:', error);
    return null;
  }
}

/**
 * Refresh session
 */
export async function refreshSession() {
  try {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error('Refresh session error:', error);
      return null;
    }

    return data.session;
  } catch (error) {
    console.error('Refresh session exception:', error);
    return null;
  }
}
