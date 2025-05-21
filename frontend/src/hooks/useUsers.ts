// frontend/src/hooks/useUsers.ts
'use client';

import { useState, useCallback } from 'react';
import { userService } from '@/services/user.service';
import { useNotification } from './useNotification';
import { User } from '@/types/user';

interface UseUsersResult {
  users: User[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  getAllUsers: (page?: number, limit?: number) => Promise<void>;
  getUserById: (id: string) => Promise<User | null>;
  updateUser: (id: string, userData: Partial<User>) => Promise<User | null>;
  deleteUser: (id: string) => Promise<boolean>;
  searchUsers: (query: string) => Promise<User[]>;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
}

export const useUsers = (): UseUsersResult => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const { showToast } = useNotification();

  const getAllUsers = useCallback(
    async (currentPage = page, currentLimit = limit) => {
      try {
        setLoading(true);
        setError(null);

        const data = await userService.getAllUsers(currentPage, currentLimit);
        setUsers(data.users);
        setTotal(data.total);
        setPage(currentPage);
        setLimit(currentLimit);

        return data.users;
      } catch (err: unknown) {
        const errorMessage =
          err.response?.data?.message || 'Failed to fetch users';
        setError(errorMessage);
        showToast('error', errorMessage);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [page, limit, showToast],
  );

  const getUserById = useCallback(
    async (id: string): Promise<User | null> => {
      try {
        setLoading(true);
        setError(null);

        const user = await userService.getUserById(id);
        return user;
      } catch (err: unknown) {
        const errorMessage =
          err.response?.data?.message || 'Failed to fetch user details';
        setError(errorMessage);
        showToast('error', errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  const updateUser = useCallback(
    async (id: string, userData: Partial<User>): Promise<User | null> => {
      try {
        setLoading(true);
        setError(null);

        const updatedUser = await userService.updateUser(id, userData);

        // Update user in the list if it exists
        setUsers((prev) =>
          prev.map((user) => (user.id === id ? updatedUser : user)),
        );

        showToast('success', 'User updated successfully');
        return updatedUser;
      } catch (err: unknown) {
        const errorMessage =
          err.response?.data?.message || 'Failed to update user';
        setError(errorMessage);
        showToast('error', errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  const deleteUser = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        await userService.deleteUser(id);

        // Remove user from the list
        setUsers((prev) => prev.filter((user) => user.id !== id));
        setTotal((prev) => prev - 1);

        showToast('success', 'User deleted successfully');
        return true;
      } catch (err: unknown) {
        const errorMessage =
          err.response?.data?.message || 'Failed to delete user';
        setError(errorMessage);
        showToast('error', errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [showToast],
  );

  const searchUsers = useCallback(
    async (query: string): Promise<User[]> => {
      if (!query.trim()) {
        return users;
      }

      const lowerQuery = query.toLowerCase();
      return users.filter(
        (user) =>
          user.name.toLowerCase().includes(lowerQuery) ||
          user.email.toLowerCase().includes(lowerQuery),
      );
    },
    [users],
  );

  return {
    users,
    loading,
    error,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    searchUsers,
    setPage,
    setLimit,
  };
};
