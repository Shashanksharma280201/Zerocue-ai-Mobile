/**
 * QR Token Generation for Mobile App
 * Note: In production, token generation should happen on the backend for security.
 * This is a simplified version for the mobile app.
 */

export interface QRTokenPayload {
  cart_id: string;
  store_id: string;
  user_id: string;
  amount: number;
  timestamp: number;
  nonce: string;
}

/**
 * Generate a QR token (simplified for mobile)
 * In production, this should be done on the backend via API
 * @param payload - Order information
 * @returns Token string
 */
export function generateQRToken(
  payload: Omit<QRTokenPayload, 'timestamp' | 'nonce'>
): string {
  const tokenPayload: QRTokenPayload = {
    ...payload,
    timestamp: Date.now(),
    nonce: Math.random().toString(36).substring(2, 15),
  };

  // In production, this would be a signed JWT from the backend
  // For now, we use base64 encoding
  const tokenString = JSON.stringify(tokenPayload);
  return Buffer.from(tokenString).toString('base64');
}

/**
 * Decode a QR token
 * @param token - Token string to decode
 * @returns Decoded payload or null
 */
export function decodeQRToken(token: string): QRTokenPayload | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    return JSON.parse(decoded) as QRTokenPayload;
  } catch (error) {
    console.error('Error decoding QR token:', error);
    return null;
  }
}

/**
 * Check if token is older than threshold
 * @param payload - Decoded token payload
 * @param thresholdMinutes - Age threshold in minutes
 * @returns true if token is older than threshold
 */
export function isTokenOld(payload: QRTokenPayload, thresholdMinutes: number = 10): boolean {
  const thresholdMs = thresholdMinutes * 60 * 1000;
  return Date.now() - payload.timestamp > thresholdMs;
}

/**
 * Get token age in human-readable format
 * @param payload - Decoded token payload
 * @returns Age string like "5 minutes ago"
 */
export function getTokenAge(payload: QRTokenPayload): string {
  const ageMs = Date.now() - payload.timestamp;
  const ageMinutes = Math.floor(ageMs / (60 * 1000));
  const ageHours = Math.floor(ageMinutes / 60);

  if (ageHours > 0) {
    return `${ageHours} hour${ageHours > 1 ? 's' : ''} ago`;
  } else if (ageMinutes > 0) {
    return `${ageMinutes} minute${ageMinutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}
