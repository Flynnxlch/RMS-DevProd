import { useState } from 'react';
import ContentHeader from '../components/ui/ContentHeader';
import UserIcon from '../components/ui/UserIcon';
import { Card } from '../components/widgets';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    password: '',
    confirmPassword: '',
    profilePicture: user?.avatar || null,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, profilePicture: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nama wajib diisi';
    }

    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Kata sandi minimal 6 karakter';
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Kata sandi tidak cocok';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In real app, update user profile via API
    console.log('Profile updated:', formData);

    setIsLoading(false);
    setShowProfilePopup(false);
    // Reset password fields
    setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }));
  };

  const inputBase =
    'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0c9361] dark:focus:ring-[#0c9361] transition-colors';

  return (
    <>
      <ContentHeader
        title="Profil"
        breadcrumbs={[
          { label: 'Beranda', path: '/' },
          { label: 'Profil' },
        ]}
      />

      <Card title="Profil Pengguna">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
          <div className="relative shrink-0">
            {formData.profilePicture ? (
            <img
                src={formData.profilePicture}
              alt={user?.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600"
            />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-4 border-gray-200 dark:border-gray-600">
                <UserIcon className="w-14 h-14 text-gray-600 dark:text-gray-300" fill="currentColor" />
              </div>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{user?.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">{user?.email}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Cabang: {user?.cabang || 'N/A'}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">NIP: {user?.nip || 'N/A'}</p>
            <button
              type="button"
              onClick={() => setShowProfilePopup(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0c9361] hover:bg-[#0a7a4f] text-white font-semibold rounded-lg transition-colors shadow-sm"
            >
              <i className="bi bi-pencil"></i>
              <span>Edit Profil</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Profile Edit Popup */}
      {showProfilePopup && (
        <>
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 transition-opacity" onClick={() => setShowProfilePopup(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-14 pointer-events-none">
            <div
              className="w-full max-w-xl bg-white dark:bg-(--color-card-bg-dark) rounded-lg shadow-2xl border border-gray-200 dark:border-(--color-card-border-dark) pointer-events-auto max-h-[calc(100vh-7rem)] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Popup Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-(--color-card-border-dark)">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Profil</h3>
                <button
                  type="button"
                  onClick={() => setShowProfilePopup(false)}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <i className="bi bi-x-lg text-lg"></i>
                </button>
              </div>

              {/* Popup Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Profile Picture */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Foto Profil
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {formData.profilePicture ? (
                    <img
                      src={formData.profilePicture}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 shrink-0"
                    />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-200 dark:border-gray-600 shrink-0">
                        <UserIcon className="w-12 h-12 text-gray-600 dark:text-gray-300" fill="currentColor" />
                      </div>
                    )}
                    <div className="w-full sm:w-auto text-center sm:text-left">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#0c9361] file:text-white hover:file:bg-[#0a7a4f] file:cursor-pointer"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">JPG, PNG or GIF. Max size 2MB.</p>
                    </div>
                  </div>
                </div>

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

                {/* Cabang (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cabang
                  </label>
                  <input
                    type="text"
                    value={user?.cabang || 'N/A'}
                    disabled
                    className={`${inputBase} bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed border-gray-300 dark:border-gray-600`}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Cabang tidak dapat diubah</p>
                </div>

                {/* NIP (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    NIP
                  </label>
                  <input
                    type="text"
                    value={user?.nip || 'N/A'}
                    disabled
                    className={`${inputBase} bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed border-gray-300 dark:border-gray-600`}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">NIP tidak dapat diubah</p>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kata Sandi Baru (kosongkan untuk mempertahankan kata sandi saat ini)
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      className={`${inputBase} pr-12 ${errors.password ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                      placeholder="Masukkan kata sandi baru"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                {formData.password && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Konfirmasi Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`${inputBase} pr-12 ${errors.confirmPassword ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                        placeholder="Konfirmasi kata sandi baru"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <i className={`bi ${showConfirmPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.confirmPassword}</p>}
                  </div>
                )}

                {/* Submit Buttons */}
                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-4 border-t border-gray-200 dark:border-(--color-card-border-dark)">
                  <button
                    type="button"
                    onClick={() => setShowProfilePopup(false)}
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
        </>
      )}
    </>
  );
}

