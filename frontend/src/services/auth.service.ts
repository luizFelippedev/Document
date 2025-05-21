// src/services/auth.service.ts
import { api } from "@/lib/axios";
import { saveToStorage, removeFromStorage } from "@/utils/storage";
import { socketService } from "@/lib/socket";

export const authService = {
  /**
   * Login user
   */
  async login(email: string, password: string, rememberMe: boolean = false) {
    const response = await api.post("/auth/login", {
      email,
      password,
      rememberMe,
    });

    // Set token in storage based on remember me preference
    if (response.data.token) {
      const storageMethod = rememberMe
        ? saveToStorage
        : (key: string, value: string) => sessionStorage.setItem(key, value);
      storageMethod("@App:token", response.data.token);

      // Reconnect socket with new token
      socketService.reconnectWithToken(response.data.token);
    }

    return response.data;
  },

  /**
   * Register a new user
   */
  async register(userData: { name: string; email: string; password: string }) {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },

  /**
   * Get current user data
   */
  async getCurrentUser() {
    const response = await api.get("/auth/me");
    return response.data.user;
  },

  /**
   * Logout user
   */
  async logout() {
    try {
      const response = await api.post("/auth/logout");

      // Clean up regardless of API response
      removeFromStorage("@App:token");
      sessionStorage.removeItem("@App:token");

      // Disconnect socket
      socketService.disconnect();

      return response.data;
    } catch (error) {
      // Clean up even on error
      removeFromStorage("@App:token");
      sessionStorage.removeItem("@App:token");
      socketService.disconnect();
      console.error("Logout error:", error);
      throw error;
    }
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
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
  },

  /**
   * Reset password with token
   */
  async resetPassword(password: string, token: string) {
    const response = await api.post("/auth/reset-password", {
      password,
      token,
    });
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
    const response = await api.put("/auth/password", {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  /**
   * Verify two-factor authentication code
   */
  async verifyTwoFactorCode(code: string) {
    const response = await api.post("/auth/verify-2fa", { code });

    // Update token if verification was successful
    if (response.data.token) {
      const currentToken = sessionStorage.getItem("@App:token");
      const storageMethod = currentToken
        ? sessionStorage.setItem
        : saveToStorage;
      storageMethod("@App:token", response.data.token);

      // Reconnect socket with new token
      socketService.reconnectWithToken(response.data.token);
    }

    return response.data;
  },

  /**
   * Setup two-factor authentication
   */
  async setupTwoFactor(enabled: boolean) {
    const response = await api.post("/auth/2fa/setup", { enabled });
    return response.data;
  },

  /**
   * Resend verification code
   */
  async resendVerificationCode() {
    const response = await api.post("/auth/resend-verification");
    return response.data;
  },
};
