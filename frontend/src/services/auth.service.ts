// frontend/src/services/auth.service.ts
import { api } from '@/lib/axios';

export const authService = {
  /**
   * Login user
   */
  async login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  /**
   * Register a new user
   */
  async register(userData: { name: string; email: string; password: string }) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  /**
   * Get current user data
   */
  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data.user;
  },
  
  /**
   * Logout user
   */
  async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  
  /**
   * Verify email with token
   */
  async verifyEmail(token: string) {
    const response = await api.post(`/auth/verify-email/${token}`);
    return response.data;
  },
  
  /**
   * Forgot password request
   */
  async forgotPassword(email: string) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
  
  /**
   * Reset password with token
   */
  async resetPassword(password: string, token: string) {
    const response = await api.post('/auth/reset-password', { password, token });
    return response.data;
  },
  
  /**
   * Verify reset token validity
   */
  async verifyResetToken(token: string) {
    const response = await api.get(`/auth/verify-reset-token/${token}`);
    return response.data;
  },
  
  /**
   * Update password for authenticated user
   */
  async updatePassword(currentPassword: string, newPassword: string) {
    const response = await api.put('/auth/password', { currentPassword, newPassword });
    return response.data;
  },
  
  /**
   * Verify two-factor authentication code
   */
  async verifyTwoFactorCode(code: string) {
    const response = await api.post('/auth/verify-2fa', { code });
    return response.data;
  },
  
  /**
   * Setup two-factor authentication
   */
  async setupTwoFactor(enabled: boolean) {
    const response = await api.post('/auth/2fa/setup', { enabled });
    return response.data;
  },
  
  /**
   * Resend verification code
   */
  async resendVerificationCode() {
    const response = await api.post('/auth/resend-verification');
    return response.data;
  }
};