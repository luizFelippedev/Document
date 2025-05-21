// src/services/user.service.ts
import { api } from "@/lib/axios";
import { User } from "@/types/user";

export const userService = {
  /**
   * Get user profile
   */
  async getProfile() {
    const response = await api.get("/users/profile");
    return response.data.user;
  },

  /**
   * Update user profile
   */
  async updateProfile(userData: Partial<User>) {
    const response = await api.put("/users/profile", userData);
    return response.data.user;
  },

  /**
   * Upload profile avatar
   */
  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await api.post("/users/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Remove profile avatar
   */
  async removeAvatar() {
    const response = await api.delete("/users/avatar");
    return response.data;
  },

  /**
   * Get user settings
   */
  async getSettings() {
    const response = await api.get("/users/settings");
    return response.data.settings;
  },

  /**
   * Update user settings
   */
  async updateSettings(settings: any) {
    const response = await api.put("/users/settings", settings);
    return response.data.settings;
  },

  /**
   * Get user statistics
   */
  async getStatistics() {
    const response = await api.get("/users/statistics");
    return response.data.statistics;
  },

  /**
   * Admin: Get all users
   */
  async getAllUsers(page = 1, limit = 10) {
    const response = await api.get("/admin/users", {
      params: { page, limit },
    });
    return response.data;
  },

  /**
   * Admin: Get user by ID
   */
  async getUserById(id: string) {
    const response = await api.get(`/admin/users/${id}`);
    return response.data.user;
  },

  /**
   * Admin: Update user
   */
  async updateUser(id: string, userData: Partial<User>) {
    const response = await api.put(`/admin/users/${id}`, userData);
    return response.data.user;
  },

  /**
   * Admin: Delete user
   */
  async deleteUser(id: string) {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },
};
