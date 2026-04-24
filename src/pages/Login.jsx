import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CabangDropdown from '../components/ui/CabangDropdown';
import ErrorModal from '../components/ui/ErrorModal';
import { useAuth } from '../context/AuthContext';

// Import images
import bg1 from '../assets/background/bg1.jpeg';
import bg2 from '../assets/background/bg2.jpeg';
import bg3 from '../assets/background/bg3.JPG';
import bg4 from '../assets/background/bg4.jpg';
import bg5 from '../assets/background/bg5.jpg';


export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [deviceWarning, setDeviceWarning] = useState(null);
  
  // Register form state
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    cabang: 'KPS',
    nip: '',
    password: '',
    confirmPassword: '',
  });
  const [registerErrors, setRegisterErrors] = useState({});
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  
  // Forgot password state
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [showForgotPasswordSuccess, setShowForgotPasswordSuccess] = useState(false);

  // Carousel state
  const images = [bg1, bg2, bg3, bg4, bg5];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Auto-rotate carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, [images.length]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setDeviceWarning(null);
    setIsLoading(true);

    const result = await login(email, password, rememberMe);

    if (result.success) {
      // Check for device warning
      if (result.warning) {
        setDeviceWarning({
          message: result.warning,
          deviceCount: result.deviceCount,
        });
      }
      navigate('/');
    } else {
      const errorMessage = result.error || 'Invalid email or password';
      setError(errorMessage);
      setShowErrorModal(true);
    }

    setIsLoading(false);
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (registerErrors[name]) {
      setRegisterErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateRegister = () => {
    const newErrors = {};

    if (!formData.nama.trim()) {
      newErrors.nama = 'Nama wajib diisi';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    if (!formData.cabang) {
      newErrors.cabang = 'Cabang wajib diisi';
    }

    if (!formData.nip.trim()) {
      newErrors.nip = 'NIP wajib diisi';
    }

    if (!formData.password) {
      newErrors.password = 'Kata sandi wajib diisi';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Kata sandi minimal 6 karakter';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Silakan konfirmasi kata sandi Anda';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Kata sandi tidak cocok';
    }

    setRegisterErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    // Prevent double submission
    if (isLoading) {
      return;
    }

    if (!validateRegister()) {
      return;
    }

    setIsLoading(true);
    setRegisterErrors({});

    try {
      const { API_ENDPOINTS } = await import('../config/api');
      
      const response = await fetch(API_ENDPOINTS.auth.register, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.nama,
          email: formData.email,
          cabang: formData.cabang,
          nip: formData.nip,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setRegisterErrors({ submit: data.error || 'Registration failed. Please try again.' });
        setIsLoading(false);
        return;
      }

      // Success - show popup
      setShowSuccessPopup(true);
      
      // Reset form
      setFormData({
        nama: '',
        email: '',
        cabang: 'KPS',
        nip: '',
        password: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Registration error:', error);
      setRegisterErrors({ submit: error.message || 'Gagal mengirim registrasi. Silakan coba lagi.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClosePopup = () => {
    setShowSuccessPopup(false);
    // Reset form and switch back to login
    setFormData({
      nama: '',
      email: '',
      cabang: 'KPS',
      nip: '',
      password: '',
      confirmPassword: '',
    });
    setIsRegisterMode(false);
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotPasswordError('');

    if (!forgotPasswordEmail.trim()) {
      setForgotPasswordError('Alamat email wajib diisi');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotPasswordEmail)) {
      setForgotPasswordError('Format email tidak valid');
      return;
    }

    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Store forgot password request
    const forgotPasswordRequest = {
      email: forgotPasswordEmail,
      requestedAt: new Date().toISOString(),
      status: 'pending',
    };
    const existingRequests = JSON.parse(localStorage.getItem('minlt:forgot-password-requests') || '[]');
    existingRequests.push(forgotPasswordRequest);
    localStorage.setItem('minlt:forgot-password-requests', JSON.stringify(existingRequests));

    setIsLoading(false);
    setShowForgotPasswordModal(false);
    setShowForgotPasswordSuccess(true);
    setForgotPasswordEmail('');
  };

  const handleCloseForgotPasswordModal = () => {
    setShowForgotPasswordModal(false);
    setForgotPasswordEmail('');
    setForgotPasswordError('');
  };

  const handleCloseForgotPasswordSuccess = () => {
    setShowForgotPasswordSuccess(false);
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setError('');
    setRegisterErrors({});
  };

  const inputBase =
    'w-full pl-4 pr-10 py-2.5 border rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#0c9361] dark:focus:ring-[#0c9361] focus:border-[#0c9361] dark:focus:border-[#0c9361] transition-colors box-border';

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Carousel Background with Quote Overlay */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Carousel Background */}
        {images.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <img
              src={img}
              alt={`Slide ${index + 1}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        
        {/* Dark Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40 dark:bg-black/60"></div>
        
        {/* Quote and Portal Name Overlay */}
        <div className="relative z-10 flex flex-col justify-end p-12 h-full">
          <div className="max-w-md">
            <blockquote className="text-white dark:text-gray-200 text-xl font-medium mb-6 leading-relaxed">
              "Design is not just what it looks like and feels like. Design is how it works."
            </blockquote>
            <div className="h-px bg-white/30 dark:bg-gray-400 mb-4"></div>
            <p className="text-white dark:text-gray-200 text-lg font-semibold">
              Risk Management System
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8 bg-white dark:bg-gray-900">
        <div className="w-full max-w-md">
          {/* Login/Register Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {isRegisterMode ? 'Buat Akun' : 'Selamat datang kembali'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isRegisterMode ? 'Daftar untuk memulai' : 'Silakan masukkan detail Anda untuk mengakses akun Anda.'}
              </p>
            </div>

            {/* Form Container with Transition */}
            <div className="relative overflow-hidden">
              {/* Login Form */}
              <div
                className={`transition-all duration-500 ease-in-out ${
                  isRegisterMode
                    ? 'opacity-0 absolute inset-0 translate-x-[-100%] pointer-events-none'
                    : 'opacity-100 relative translate-x-0 pointer-events-auto'
                }`}
              >
                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <i className="bi bi-exclamation-circle text-red-500 dark:text-red-400"></i>
                      <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* Email Input */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Alamat Email
                    </label>
                    <div className="relative">
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#0c9361] dark:focus:ring-[#0c9361] focus:border-[#0c9361] dark:focus:border-[#0c9361] transition-colors box-border"
                        placeholder="name@company.com"
                        required
                        autoComplete="email"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <i className="bi bi-envelope text-gray-400 dark:text-gray-500"></i>
                      </div>
                    </div>
                  </div>

                  {/* Password Input */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Kata Sandi
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-4 pr-12 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#0c9361] dark:focus:ring-[#0c9361] focus:border-[#0c9361] dark:focus:border-[#0c9361] transition-colors box-border"
                        placeholder="••••••••"
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                      </button>
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 text-[#0c9361] border-gray-300 dark:border-gray-600 rounded focus:ring-[#0c9361] cursor-pointer"
                      />
                      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Ingat selama 7 hari</span>
                    </label>
                    <a
                      href="#"
                      className="text-sm text-[#0c9361] dark:text-[#0c9361] hover:underline font-medium"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowForgotPasswordModal(true);
                      }}
                    >
                      Lupa kata sandi?
                    </a>
                  </div>

                  {/* Device Warning Alert */}
                  {deviceWarning && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
                      <div className="flex items-start gap-2">
                        <i className="bi bi-exclamation-triangle-fill text-yellow-600 dark:text-yellow-400 text-lg mt-0.5"></i>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">Peringatan Keamanan</p>
                          <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">{deviceWarning.message}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-[#0c9361] hover:bg-[#0a7a4f] text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <i className="bi bi-arrow-repeat animate-spin"></i>
                        <span>Masuk...</span>
                      </>
                    ) : (
                      <>
                        <span>Masuk</span>
                        <i className="bi bi-arrow-right"></i>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Register Form */}
              <div
                className={`transition-all duration-500 ease-in-out ${
                  isRegisterMode
                    ? 'opacity-100 relative translate-x-0 pointer-events-auto'
                    : 'opacity-0 absolute inset-0 translate-x-[100%] pointer-events-none'
                }`}
              >
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  {/* Nama Input */}
                  <div>
                    <label htmlFor="nama" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nama
                    </label>
                    <div className="relative">
                      <input
                        id="nama"
                        name="nama"
                        type="text"
                        value={formData.nama}
                        onChange={handleRegisterChange}
                        className={`${inputBase} ${registerErrors.nama ? 'border-red-500 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'} box-border`}
                        placeholder="Masukkan nama Anda"
                        required
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <i className="bi bi-person text-gray-400 dark:text-gray-500"></i>
                      </div>
                    </div>
                    {registerErrors.nama && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{registerErrors.nama}</p>}
                  </div>

                  {/* Email Input */}
                  <div>
                    <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <input
                        id="reg-email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleRegisterChange}
                        className={`${inputBase} ${registerErrors.email ? 'border-red-500 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'} box-border`}
                        placeholder="name@company.com"
                        required
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <i className="bi bi-envelope text-gray-400 dark:text-gray-500"></i>
                      </div>
                    </div>
                    {registerErrors.email && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{registerErrors.email}</p>}
                  </div>

                  {/* Cabang Input */}
                  <div>
                    <label htmlFor="cabang" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cabang
                    </label>
                    <CabangDropdown
                        value={formData.cabang}
                      onChange={(value) => {
                        setFormData((prev) => ({ ...prev, cabang: value }));
                        if (registerErrors.cabang) {
                          setRegisterErrors((prev) => ({ ...prev, cabang: '' }));
                        }
                      }}
                      error={!!registerErrors.cabang}
                    />
                    {registerErrors.cabang && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{registerErrors.cabang}</p>}
                  </div>

                  {/* NIP Input */}
                  <div>
                    <label htmlFor="nip" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      NIP
                    </label>
                    <div className="relative">
                      <input
                        id="nip"
                        name="nip"
                        type="text"
                        value={formData.nip}
                        onChange={handleRegisterChange}
                        className={`${inputBase} ${registerErrors.nip ? 'border-red-500 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'} box-border`}
                        placeholder="Enter your NIP"
                        required
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <i className="bi bi-card-text text-gray-400 dark:text-gray-500"></i>
                      </div>
                    </div>
                    {registerErrors.nip && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{registerErrors.nip}</p>}
                  </div>

                  {/* Password Input */}
                  <div>
                    <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="reg-password"
                        name="password"
                        type={showRegisterPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleRegisterChange}
                        className={`${inputBase} pr-12 ${registerErrors.password ? 'border-red-500 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'} box-border`}
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        <i className={`bi ${showRegisterPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                      </button>
                    </div>
                    {registerErrors.password && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{registerErrors.password}</p>}
                  </div>

                  {/* Confirm Password Input */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Konfirmasi Kata Sandi
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={handleRegisterChange}
                        className={`${inputBase} pr-12 ${registerErrors.confirmPassword ? 'border-red-500 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'} box-border`}
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        <i className={`bi ${showConfirmPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i>
                      </button>
                    </div>
                    {registerErrors.confirmPassword && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{registerErrors.confirmPassword}</p>}
                  </div>

                  {/* Error Message */}
                  {registerErrors.submit && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center gap-2">
                        <i className="bi bi-exclamation-circle text-red-500 dark:text-red-400"></i>
                        <span className="text-sm text-red-700 dark:text-red-300">{registerErrors.submit}</span>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-[#0c9361] hover:bg-[#0a7a4f] text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <i className="bi bi-arrow-repeat animate-spin"></i>
                        <span>Mengirim...</span>
                      </>
                    ) : (
                      <>
                        <span>Kirim</span>
                        <i className="bi bi-check-circle"></i>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isRegisterMode ? (
                  <>
                    Sudah punya akun?{' '}
                    <button
                      type="button"
                      onClick={toggleMode}
                      className="text-[#0c9361] dark:text-[#0c9361] hover:underline font-medium"
                    >
                      Masuk
                    </button>
                  </>
                ) : (
                  <>
                    Belum punya akun?{' '}
                    <button
                      type="button"
                      onClick={toggleMode}
                      className="text-[#0c9361] dark:text-[#0c9361] hover:underline font-medium"
                    >
                      Daftar
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Popup - Registration */}
      {showSuccessPopup && (
        <>
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 transition-opacity" onClick={handleClosePopup} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="w-full max-w-md bg-white dark:bg-[var(--color-card-bg-dark)] rounded-lg shadow-2xl border border-gray-200 dark:border-[var(--color-card-border-dark)] pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                  <i className="bi bi-check-circle text-green-600 dark:text-green-400 text-3xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Registrasi Dikirim</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                  Terima kasih sudah melakukan registrasi, Mohon tunggu persetujuan pembuatan akun.
                </p>
                <button
                  type="button"
                  onClick={handleClosePopup}
                  className="w-full px-4 py-2 bg-[#0c9361] hover:bg-[#0a7a4f] text-white font-semibold rounded-lg transition-colors"
                >
                  Oke
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <>
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 transition-opacity backdrop-blur-sm" onClick={handleCloseForgotPasswordModal} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 pointer-events-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={handleCloseForgotPasswordModal}
                className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
              >
                <i className="bi bi-x-lg text-xl"></i>
              </button>

              <div className="p-6">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/20">
                    <i className="bi bi-lock-fill text-green-600 dark:text-green-400 text-2xl relative z-10"></i>
                    <i className="bi bi-arrow-repeat absolute text-green-600 dark:text-green-400 text-xl opacity-80"></i>
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                  Lupa kata sandi Anda?
                </h2>

                {/* Description */}
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                  Jangan khawatir, hal ini bisa terjadi. Silakan masukkan alamat email yang terkait dengan akun Anda.
                </p>

                {/* Form */}
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  {/* Email Input */}
                  <div>
                    <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Alamat Email
                    </label>
                    <div className="relative">
                      <input
                        id="forgot-email"
                        type="email"
                        value={forgotPasswordEmail}
                        onChange={(e) => {
                          setForgotPasswordEmail(e.target.value);
                          setForgotPasswordError('');
                        }}
                        className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-[#0c9361] dark:focus:ring-[#0c9361] focus:border-[#0c9361] transition-all ${
                          forgotPasswordEmail ? 'bg-white dark:bg-gray-700/50 border-gray-200 dark:border-gray-600' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                        } ${forgotPasswordError ? 'border-red-500 dark:border-red-500' : ''}`}
                        placeholder="name@company.com"
                        required
                        autoComplete="email"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i className="bi bi-envelope text-gray-400 dark:text-gray-500"></i>
                      </div>
                    </div>
                    {forgotPasswordError && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">{forgotPasswordError}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-[#0c9361] hover:bg-[#0a7a4f] text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <i className="bi bi-arrow-repeat animate-spin"></i>
                        <span>Mengirim...</span>
                      </>
                    ) : (
                      <>
                        <span>Kirim Tautan Reset</span>
                        <i className="bi bi-arrow-right"></i>
                      </>
                    )}
                  </button>
                </form>

                {/* Back to Login Link */}
                <div className="mt-4 text-center">
                  <a
                    href="#"
                    className="inline-flex items-center gap-2 text-sm text-[#0c9361] dark:text-[#0c9361] hover:underline font-medium"
                    onClick={(e) => {
                      e.preventDefault();
                      handleCloseForgotPasswordModal();
                    }}
                  >
                    <i className="bi bi-arrow-left"></i>
                    <span>Kembali ke Masuk</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Success Popup - Forgot Password */}
      {showForgotPasswordSuccess && (
        <>
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 transition-opacity" onClick={handleCloseForgotPasswordSuccess} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="w-full max-w-md bg-white dark:bg-[var(--color-card-bg-dark)] rounded-lg shadow-2xl border border-gray-200 dark:border-[var(--color-card-border-dark)] pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                  <i className="bi bi-check-circle text-green-600 dark:text-green-400 text-3xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Permintaan Reset Kata Sandi Dikirim</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                  Terima kasih sudah melakukan permintaan reset kata sandi, Mohon tunggu persetujuan dari Risk Assessment.
                </p>
                <button
                  type="button"
                  onClick={handleCloseForgotPasswordSuccess}
                  className="w-full px-4 py-2 bg-[#0c9361] hover:bg-[#0a7a4f] text-white font-semibold rounded-lg transition-colors"
                >
                  Oke
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Error Modal for Login Errors */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Gagal Masuk"
        message={error || 'Email atau kata sandi tidak valid. Silakan coba lagi.'}
        type="error"
      />
    </div>
  );
}

