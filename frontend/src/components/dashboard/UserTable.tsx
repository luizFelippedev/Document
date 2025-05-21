// frontend/src/components/dashboard/UserTable.tsx
'use client';

import { useState, useEffect } from 'react';
import { userService } from '@/services/user.service';
import { User } from '@/types/user';
import { Table } from '@/components/ui/Table';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/Modal';
import { formatDate } from '@/utils/date';
import { useNotification } from '@/hooks/useNotification';
import { Edit, Trash2, UserX, Shield, User as UserIcon } from 'lucide-react';

export const UserTable = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { showToast } = useNotification();

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const result = await userService.getAllUsers(page, 10);
      setUsers(result.users);
      setTotalPages(Math.ceil(result.total / result.limit));
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('error', 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (userId: string) => {
    setUserToDelete(userId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      await userService.deleteUser(userToDelete);
      setUsers(users.filter((user) => user.id !== userToDelete));
      showToast('success', 'User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('error', 'Failed to delete user');
    } finally {
      setUserToDelete(null);
      setShowDeleteModal(false);
    }
  };

  const columns = [
    {
      id: 'user',
      header: 'User',
      cell: (row: User) => (
        <div className="flex items-center">
          <Avatar
            src={row.avatar}
            alt={row.name}
            size="sm"
            fallbackIcon={<UserIcon size={14} />}
          />
          <div className="ml-3">
            <div className="font-medium">{row.name}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {row.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'role',
      header: 'Role',
      cell: (row: User) => (
        <Badge
          text={row.role === 'admin' ? 'Admin' : 'User'}
          variant={row.role === 'admin' ? 'primary' : 'default'}
          icon={row.role === 'admin' ? <Shield size={12} /> : undefined}
        />
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row: User) => (
        <Badge
          text={row.isVerified ? 'Verified' : 'Unverified'}
          variant={row.isVerified ? 'success' : 'warning'}
        />
      ),
    },
    {
      id: 'twoFactor',
      header: '2FA',
      cell: (row: User) => (
        <Badge
          text={row.twoFactorEnabled ? 'Enabled' : 'Disabled'}
          variant={row.twoFactorEnabled ? 'success' : 'default'}
        />
      ),
    },
    {
      id: 'createdAt',
      header: 'Created At',
      cell: (row: User) => formatDate(row.createdAt),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row: User) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              /* View user details */
            }}
          >
            <UserIcon size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              /* Edit user */
            }}
          >
            <Edit size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteClick(row.id)}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Table
        data={users}
        columns={columns}
        loading={loading}
        pagination
        itemsPerPage={10}
        searchable
        searchPlaceholder="Search users..."
        striped
        hoverable
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        icon={<UserX size={24} className="text-red-500" />}
      />
    </>
  );
};
