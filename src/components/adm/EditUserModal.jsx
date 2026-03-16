import { useEffect, useMemo, useState } from 'react';
import { API_ENDPOINTS, apiRequest } from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import CabangDropdown from '../ui/CabangDropdown';
import DivisionDropdown, { getDivisionOptions } from '../ui/DivisionDropdown';

// Division options are now handled by DivisionDropdown component

const USER_ROLE_OPTIONS = [
  { value: 'RISK_OFFICER', label: 'Risk Officer' },
  { value: 'RISK_CHAMPION', label: 'Risk Champion' },
  { value: 'RISK_ASSESSMENT', label: 'Risk Assessment' },
];

export default function EditUserModal({ isOpen, onClose, user, onSuccess }) {
  const { user: currentUser } = useAuth();
  const { isSidebarCollapsed, isMobile } = useSidebar();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    nip: '',
    userRole: 'RISK_OFFICER',
    regionCabang: 'KPS',
    department: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const divisionOptions = useMemo(
    () => getDivisionOptions(formData.regionCabang),
    [formData.regionCabang]
  );

  useEffect(() => {
    if (formData.department && !divisionOptions.includes(formData.department)) {
      setFormData((prev) => ({ ...prev, department: '' }));
    }
  }, [divisionOptions, formData.department]);
  
  const canChangeRole = currentUser?.userRole === 'RISK_ASSESSMENT';

  useEffect(() => {
    if (user && isOpen) {
      // Validate user.id exists
      if (!user.id) {
        console.error('User object missing id:', user);
        setErrors({ submit: 'User ID is missing. Please refresh and try again.' });
        return;
      }

      setFormData({
        name: user.name || '',
        email: user.email || '',
        nip: user.nip || '',
        userRole: user.userRole || 'USER_BIASA',
        regionCabang: user.regionCabang || 'KPS',
        department: user.department || '',
        password: '',
      });
      setErrors({});
      setShowPasswordField(false);
      setIsChangingPassword(false);
    }
  }, [user, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama wajib diisi';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    // Only validate password if user is changing password
    if (isChangingPassword) {
      if (!formData.password.trim()) {
        newErrors.password = 'Kata sandi wajib diisi saat mengubah kata sandi';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Kata sandi minimal 6 karakter';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTogglePasswordChange = () => {
    if (isChangingPassword) {
      // Cancel password change
      setShowPasswordField(false);
      setIsChangingPassword(false);
      setFormData((prev) => ({ ...prev, password: '' }));
      if (errors.password) {
        setErrors((prev) => ({ ...prev, password: '' }));
      }
    } else {
      // Start password change
      setShowPasswordField(true);
      setIsChangingPassword(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    // Validate user and user.id before proceeding
    if (!user) {
      setErrors({ submit: 'Data pengguna tidak ditemukan. Silakan refresh dan coba lagi.' });
      return;
    }

    if (!user.id) {
      console.error('User object:', user);
      setErrors({ submit: 'ID pengguna tidak ditemukan. Silakan refresh dan coba lagi.' });
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        name: formData.name?.trim() || '',
        email: formData.email?.trim() || '',
        nip: formData.nip?.trim() || null,
        userRole: formData.userRole || 'RISK_OFFICER',
        regionCabang: formData.regionCabang || 'KPS',
        department: formData.department?.trim() || null,
      };

      // Only include password if user is actively changing it
      if (isChangingPassword && formData.password?.trim()) {
        payload.password = formData.password.trim();
      }

      const userId = String(user.id); // Ensure it's a string for URL
      console.log('Updating user:', {
        userId,
        userIdType: typeof userId,
        userObject: user,
        payload,
        endpoint: API_ENDPOINTS.users.update(userId),
      });

      const response = await apiRequest(API_ENDPOINTS.users.update(userId), {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      console.log('Update successful:', response);

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error updating user:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
      setErrors({ submit: error.message || 'Gagal memperbarui pengguna' });
    } finally {
      setIsLoading(false);
    }
  };

  const inputBase =
    'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0c9361] dark:focus:ring-[#0c9361] transition-colors';

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        .edit-user-modal-content::-webkit-scrollbar {
          display: none;
        }
        .edit-user-modal-content {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 pb-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <div 
          className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full flex flex-col transition-all duration-300 max-w-2xl max-h-[calc(100vh-6rem)] ${
            isMobile 
              ? 'mx-4'
              : !isSidebarCollapsed 
                ? 'ml-[calc(var(--sidebar-width)+1rem)] mr-4'
                : 'ml-[calc(var(--sidebar-mini-width)+1rem)] mr-4'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-lg">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Edit Pengguna
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <i className="bi bi-x-lg text-xl"></i>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-6 edit-user-modal-content">
            <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nama
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className={`${inputBase} ${errors.name ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                required
              />
              {errors.name && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`${inputBase} ${errors.email ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                required
              />
              {errors.email && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>}
            </div>

            {/* NIP */}
            <div>
              <label htmlFor="nip" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                NIP
              </label>
              <input
                id="nip"
                name="nip"
                type="text"
                value={formData.nip}
                onChange={handleChange}
                className={`${inputBase} border-gray-300 dark:border-gray-600`}
                placeholder="Masukkan NIP"
              />
            </div>

            {/* User Role */}
            <div>
              <label htmlFor="userRole" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Peran Pengguna
              </label>
              <select
                id="userRole"
                name="userRole"
                value={formData.userRole}
                onChange={handleChange}
                disabled={!canChangeRole}
                className={`${inputBase} ${!canChangeRole ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed' : ''} border-gray-300 dark:border-gray-600`}
              >
                {USER_ROLE_OPTIONS.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              {!canChangeRole && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Hanya Risk Assessment yang dapat mengubah peran pengguna</p>
              )}
            </div>

            {/* Region/Cabang */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Wilayah/Cabang
              </label>
              <CabangDropdown
                value={formData.regionCabang}
                onChange={(value) => {
                  setFormData((prev) => ({ ...prev, regionCabang: value }));
                }}
                openUpward={true}
              />
            </div>

            {/* Division */}
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Divisi
              </label>
              <DivisionDropdown
                value={formData.department}
                onChange={(value) => {
                  setFormData((prev) => ({ ...prev, department: value }));
                }}
                regionCode={formData.regionCabang}
                placeholder="Pilih Divisi"
              />
            </div>

            {/* Password Change Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Kata Sandi
                </label>
                <button
                  type="button"
                  onClick={handleTogglePasswordChange}
                  className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    isChangingPassword
                      ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30'
                      : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                  }`}
                >
                  {isChangingPassword ? (
                    <>
                      <i className="bi bi-x-circle mr-1.5"></i>
                      Batal
                    </>
                  ) : (
                    <>
                      <i className="bi bi-key mr-1.5"></i>
                      Ubah Kata Sandi
                    </>
                  )}
                </button>
              </div>
              {showPasswordField && (
                <div className="mt-2">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`${inputBase} ${errors.password ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                    placeholder="Masukkan kata sandi baru"
                    required={isChangingPassword}
                  />
                  {errors.password && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password}</p>}
                </div>
              )}
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
              </div>
            )}

              {/* Submit Buttons */}
              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-white bg-[#0c9361] rounded-lg hover:bg-[#0a7a4f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
