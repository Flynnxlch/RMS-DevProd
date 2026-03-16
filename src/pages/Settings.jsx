import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContentHeader from '../components/ui/ContentHeader';
import LogoutConfirmModal from '../components/ui/LogoutConfirmModal';
import UserIcon from '../components/ui/UserIcon';
import { Card } from '../components/widgets';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowLogoutConfirm(false);
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  return (
    <>
      <ContentHeader
        title="Pengaturan"
        breadcrumbs={[
          { label: 'Beranda', path: '/' },
          { label: 'Pengaturan' },
        ]}
      />

      <div className="space-y-4">
        <Card title="Tampilan">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Tema</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Beralih antara mode terang dan gelap
                </p>
              </div>
              <button
                onClick={toggleTheme}
                className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0c9361] focus:ring-offset-2"
                role="switch"
                aria-checked={isDark}
                aria-label="Toggle theme"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isDark ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <i className={`bi ${isDark ? 'bi-moon-fill' : 'bi-sun-fill'} text-lg`}></i>
              <span>Tema saat ini: <span className="font-semibold text-gray-900 dark:text-white">{theme === 'dark' ? 'Gelap' : 'Terang'}</span></span>
            </div>
          </div>
        </Card>

        <Card title="Akun">
          <div className="space-y-4">
            {user && (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-200 dark:border-gray-600">
                  <UserIcon className="w-10 h-10 text-gray-600 dark:text-gray-300" fill="currentColor" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card title="Tindakan">
          <div className="space-y-3">
            <button
              onClick={handleLogoutClick}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <i className="bi bi-box-arrow-right"></i>
              <span>Keluar</span>
            </button>
          </div>
        </Card>
      </div>

      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
      />
    </>
  );
}


