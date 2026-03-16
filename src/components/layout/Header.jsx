import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import { useTheme } from '../../context/ThemeContext';
import LogoutConfirmModal from '../ui/LogoutConfirmModal';
import UserIcon from '../ui/UserIcon';

export default function Header() {
  const { toggleSidebar } = useSidebar();
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Determine active mode
  const currentMode = searchParams.get('mode') || 'risk';
  const isRiskActive = currentMode === 'risk' || (!searchParams.get('mode') && location.pathname === '/');
  const isUserActive = currentMode === 'user';
  
  // Check if user is Risk Assessment (only Risk Assessment can access User menu)
  const isAdminPusat = user?.userRole === 'RISK_ASSESSMENT';

  const handleLogout = () => {
    logout();
    navigate('/login');
    setUserMenuOpen(false);
    setShowLogoutConfirm(false);
  };

  const handleLogoutClick = () => {
    setUserMenuOpen(false);
    setShowLogoutConfirm(true);
  };

  // Keep icon/state in sync even if user exits fullscreen via ESC
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFsChange);
    handleFsChange();
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const closeAllDropdowns = () => {
    setUserMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 flex items-center h-16 px-4 lg:px-6 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 shadow-sm transition-all duration-200">
      {/* Left side nav items */}
      <nav className="flex items-center gap-2 lg:gap-3">
        {/* Sidebar toggle button */}
        <button
          onClick={toggleSidebar}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 active:scale-95"
          aria-label="Toggle sidebar"
        >
          <i className="bi bi-list text-xl"></i>
        </button>

        {/* Navigation links - only visible for Admin Pusat */}
        {isAdminPusat && (
          <>
            <button
              onClick={() => navigate('/')}
              className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isRiskActive
                  ? 'bg-[#0c9361] text-white shadow-md shadow-[#0c9361]/20'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <i className="bi bi-shield-exclamation"></i>
              <span>Risk</span>
            </button>
            <button
              onClick={() => navigate('/?mode=user')}
              className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isUserActive
                  ? 'bg-[#0c9361] text-white shadow-md shadow-[#0c9361]/20'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <i className="bi bi-people"></i>
              <span>User</span>
            </button>
          </>
        )}
      </nav>

      {/* Right side nav items */}
      <nav className="flex items-center gap-1 lg:gap-2 ml-auto">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 active:scale-95"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
        >
          <i className={`bi text-lg ${isDark ? 'bi-sun-fill' : 'bi-moon-fill'}`}></i>
        </button>

        {/* Fullscreen toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-2.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 active:scale-95"
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          title={isFullscreen ? 'Keluar dari fullscreen' : 'Masuk ke fullscreen'}
        >
          <i className={`bi text-lg ${isFullscreen ? 'bi-fullscreen-exit' : 'bi-arrows-fullscreen'}`}></i>
        </button>

        {/* User menu dropdown */}
        {user && (
          <div className="relative">
            <button
              onClick={() => {
                closeAllDropdowns();
                setUserMenuOpen(!userMenuOpen);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 active:scale-95"
              aria-label="User menu"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0c9361] to-[#0a7a4f] flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-sm">
                <UserIcon className="w-5 h-5 text-white" fill="currentColor" />
              </div>
              <span className="hidden lg:block text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-[140px]" title={user.name}>
                {user.name && user.name.length > 18 ? `${user.name.substring(0, 18)}...` : user.name}
              </span>
              <i className={`bi bi-chevron-down text-xs transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}></i>
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 z-50 overflow-hidden backdrop-blur-sm">
                  {/* User header */}
                  <div className="bg-gradient-to-br from-[#0c9361] via-[#0a7a4f] to-[#087a4f] text-white p-6">
                    <div className="relative inline-block mb-4">
                      <div className="w-20 h-20 rounded-full mx-auto shadow-xl border-4 border-white/30 bg-white/20 flex items-center justify-center backdrop-blur-sm">
                        <UserIcon className="w-12 h-12 text-white" fill="currentColor" />
                      </div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-400 border-3 border-white rounded-full shadow-lg"></div>
                    </div>
                    <div className="text-left space-y-2">
                      <p className="font-semibold text-lg truncate" title={user.name}>
                        {user.name}
                      </p>
                      <p className="text-sm opacity-95 flex items-center">
                        <i className="bi bi-geo-alt w-5 text-center"></i>
                        <span className="flex-1">{user.regionCabang || user.cabang || 'N/A'}</span>
                      </p>
                      <p className="text-xs opacity-80 truncate flex items-center" title={user.email}>
                        <i className="bi bi-envelope w-5 text-center"></i>
                        <span className="flex-1">{user.email}</span>
                      </p>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        navigate('/settings');
                      }}
                      className="w-full flex items-center gap-3 px-5 py-3 text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-[#0c9361] group-hover:text-white transition-colors">
                        <i className="bi bi-gear text-lg"></i>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Pengaturan</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Kelola preferensi Anda</p>
                      </div>
                      <i className="bi bi-chevron-right text-gray-400 group-hover:text-[#0c9361] dark:group-hover:text-white transition-colors"></i>
                    </button>

                    <div className="border-t border-gray-200 dark:border-gray-800 my-1"></div>

                    <button
                      onClick={handleLogoutClick}
                      className="w-full flex items-center gap-3 px-5 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
                        <i className="bi bi-box-arrow-right text-lg"></i>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Keluar</p>
                        <p className="text-xs text-red-500 dark:text-red-400">Logout dari akun Anda</p>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </nav>

      <LogoutConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
      />
    </header>
  );
}

