import { useEffect } from 'react';

/**
 * Reusable Notification Popup Component
 * Supports: success, error, warning, info, confirm
 */
export default function NotificationPopup({
  isOpen,
  onClose,
  onConfirm,
  type = 'info', // 'success', 'error', 'warning', 'info', 'confirm'
  title,
  message,
  confirmText = 'Ya',
  cancelText = 'Tidak',
  autoClose = false,
  autoCloseDelay = 3000,
}) {
  useEffect(() => {
    if (isOpen && autoClose && type !== 'confirm') {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, type, onClose]);

  if (!isOpen) return null;

  // Icon configuration based on type
  const getIconConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'bi-check-circle',
          iconColor: 'text-green-600 dark:text-green-400',
          iconBg: 'bg-green-100 dark:bg-green-900/30',
        };
      case 'error':
        return {
          icon: 'bi-x-circle',
          iconColor: 'text-red-600 dark:text-red-400',
          iconBg: 'bg-red-100 dark:bg-red-900/30',
        };
      case 'warning':
        return {
          icon: 'bi-exclamation-triangle',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
        };
      case 'confirm':
        return {
          icon: 'bi-question-circle',
          iconColor: 'text-blue-600 dark:text-blue-400',
          iconBg: 'bg-blue-100 dark:bg-blue-900/30',
        };
      default: // info
        return {
          icon: 'bi-info-circle',
          iconColor: 'text-blue-600 dark:text-blue-400',
          iconBg: 'bg-blue-100 dark:bg-blue-900/30',
        };
    }
  };

  // Button color configuration
  const getButtonConfig = () => {
    switch (type) {
      case 'success':
        return 'bg-[#0c9361] hover:bg-[#0a7a4f]';
      case 'error':
        return 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600';
      case 'confirm':
        return 'bg-[#0d6efd] hover:bg-blue-600';
      default: // info
        return 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600';
    }
  };

  const iconConfig = getIconConfig();
  const buttonClass = getButtonConfig();

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 transition-opacity backdrop-blur-sm"
        onClick={type === 'confirm' ? undefined : onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-md bg-white dark:bg-(--color-card-bg-dark) rounded-lg shadow-2xl border border-gray-200 dark:border-(--color-card-border-dark) pointer-events-auto animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 text-center">
            {/* Icon */}
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${iconConfig.iconBg} mb-4`}>
              <i className={`bi ${iconConfig.icon} ${iconConfig.iconColor} text-3xl`}></i>
            </div>

            {/* Title */}
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {title}
              </h3>
            )}

            {/* Message */}
            {message && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                {message}
              </p>
            )}

            {/* Buttons */}
            <div className={`flex gap-3 ${type === 'confirm' ? 'justify-center' : 'justify-center'}`}>
              {type === 'confirm' ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    {cancelText}
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className={`px-6 py-2 text-sm font-semibold text-white rounded-lg transition-colors ${buttonClass}`}
                  >
                    {confirmText}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-6 py-2 text-sm font-semibold text-white rounded-lg transition-colors ${buttonClass}`}
                >
                  Oke
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
