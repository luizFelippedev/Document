import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import logger from '../config/logger';

/**
 * Generate a new TOTP secret and QR code
 * @param email User's email address
 * @param issuer Name of the issuing service
 * @returns Object containing the secret and QR code URL
 */
export const generateTOTP = (
  email: string,
  issuer: string = 'Your App'
): { secret: string; qrCodeUrl: string } => {
  try {
    // Generate a secret
    const secretResult = speakeasy.generateSecret({
      length: 20,
      name: `${issuer}:${email}`,
      issuer,
    });

    if (!secretResult.base32) {
      throw new Error('Failed to generate TOTP secret');
    }

    // Generate QR code
    let qrCodeUrl = '';
    QRCode.toDataURL(secretResult.otpauth_url || '', (err, data_url) => {
      if (err) {
        logger.error(`Error generating QR code: ${err}`);
        throw err;
      }
      qrCodeUrl = data_url;
    });

    return {
      secret: secretResult.base32,
      qrCodeUrl,
    };
  } catch (error) {
    logger.error(`Error in generateTOTP: ${error}`);
    throw error;
  }
};

/**
 * Verify a TOTP token
 * @param secret The TOTP secret
 * @param token The token to verify
 * @param window Time window for valid tokens
 * @returns Boolean indicating if the token is valid
 */
export const verifyTOTP = (
  secret: string,
  token: string,
  window: number = 1
): boolean => {
  try {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window, // Allow tokens from 1 step before and after (30 seconds each)
    });
  } catch (error) {
    logger.error(`Error in verifyTOTP: ${error}`);
    return false;
  }
};

/**
 * Generate a TOTP token for a given secret
 * For testing or backup codes
 * @param secret The TOTP secret
 * @returns The generated token
 */
export const generateTOTPToken = (secret: string): string => {
  try {
    return speakeasy.totp({
      secret,
      encoding: 'base32',
    });
  } catch (error) {
    logger.error(`Error in generateTOTPToken: ${error}`);
    throw error;
  }
};

/**
 * Generate recovery codes for TOTP
 * @param count Number of recovery codes to generate
 * @returns Array of recovery codes
 */
export const generateRecoveryCodes = (count: number = 10): string[] => {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generate a 10-character alphanumeric code
    const code = Math.random().toString(36).substring(2, 12).toUpperCase();
    codes.push(code);
  }
  
  return codes;
};

/**
 * Hash recovery codes for secure storage
 * @param codes Array of recovery codes
 * @returns Array of hashed recovery codes
 */
export const hashRecoveryCodes = (codes: string[]): string[] => {
  const crypto = require('crypto');
  
  return codes.map(code => 
    crypto.createHash('sha256').update(code).digest('hex')
  );
};

/**
 * Verify a recovery code against a list of hashed codes
 * @param code The recovery code to verify
 * @param hashedCodes Array of hashed recovery codes
 * @returns The index of the matched code or -1 if not found
 */
export const verifyRecoveryCode = (
  code: string,
  hashedCodes: string[]
): number => {
  const crypto = require('crypto');
  const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
  
  return hashedCodes.indexOf(hashedCode);
};

export default {
  generateTOTP,
  verifyTOTP,
  generateTOTPToken,
  generateRecoveryCodes,
  hashRecoveryCodes,
  verifyRecoveryCode,
};