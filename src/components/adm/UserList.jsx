import { useEffect, useState } from 'react';
import { API_ENDPOINTS, apiRequest } from '../../config/api';
import DeleteConfirmModal from '../ui/DeleteConfirmModal';
import NotificationPopup from '../ui/NotificationPopup';
import { Card } from '../widgets';
import EditUserModal from './EditUserModal';
import { logger } from '../../utils/logger';

// Helper function to truncate text
function truncateText(value, maxChars) {
  const s = String(value ?? '');
  if (!maxChars || maxChars <= 0) return s;
  if (s.length <= maxChars) return s;
  return `${s.slice(0, maxChars)}...`;
}

// Helper function to format user role for display
function formatUserRole(userRole) {
  const roleMap = {
    RISK_ASSESSMENT: 'Risk Assessment',
    RISK_CHAMPION: 'Risk Champion',
    RISK_OFFICER: 'Risk Officer',
  };
  return roleMap[userRole] || userRole;
}

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [notification, setNotification] = useState({ isOpen: false, type: 'error', title: '', message: '' });

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiRequest(API_ENDPOINTS.users.getAll);
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message || 'Gagal memuat pengguna');
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (user) => {
    setEditingUser(user);
  };

  const handleDelete = async () => {
    if (!deletingUser) return;

    try {
      await apiRequest(API_ENDPOINTS.users.delete(deletingUser.id), {
        method: 'DELETE',
      });
      setDeletingUser(null);
      fetchUsers(); // Refresh the list
    } catch (err) {
      logger.error('Error deleting user:', err);
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Gagal Menghapus',
        message: err.message || 'Gagal menghapus pengguna',
      });
    }
  };

  const handleEditSuccess = () => {
    fetchUsers(); // Refresh the list
  };

  if (isLoading) {
    return (
      <Card title="Manajemen Pengguna" collapsible>
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-gray-600 dark:text-gray-400">Memuat pengguna...</div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Manajemen Pengguna" collapsible>
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-red-600 dark:text-red-400">Kesalahan: {error}</div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card title="Manajemen Pengguna" collapsible>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[var(--color-card-border-dark)]">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Pengguna</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Email</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Wilayah/Cabang</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    Tidak ada pengguna ditemukan
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-100 dark:border-[var(--color-card-border-dark)] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium text-gray-900 dark:text-white" title={user.name}>
                        {truncateText(user.name, 20)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{user.email}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{user.regionCabang || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          user.userRole === 'RISK_ASSESSMENT'
                            ? 'bg-purple-100 text-purple-800 ring-1 ring-inset ring-purple-200 dark:bg-purple-900/30 dark:text-purple-300'
                            : user.userRole === 'RISK_CHAMPION'
                            ? 'bg-blue-100 text-blue-800 ring-1 ring-inset ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-gray-100 text-gray-800 ring-1 ring-inset ring-gray-200 dark:bg-gray-800 dark:text-gray-200'
                        }`}
                      >
                        <span className="h-2 w-2 rounded-full bg-current opacity-60"></span>
                        {formatUserRole(user.userRole)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                          title="Edit pengguna"
                        >
                          <i className="bi bi-pencil"></i>
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setDeletingUser(user)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                          title="Hapus pengguna"
                        >
                          <i className="bi bi-trash"></i>
                          <span>Hapus</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDelete}
        title="Hapus Pengguna"
        message={`Apakah Anda yakin ingin menghapus pengguna "${deletingUser?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        itemName={deletingUser?.name}
      />

      {/* Notification Popup */}
      <NotificationPopup
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
    </>
  );
}

