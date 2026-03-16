import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function LogoutConfirmModal({ isOpen, onClose, onConfirm }) {
  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <>
      <div 
        className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 transition-opacity backdrop-blur-sm" 
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-md bg-white dark:bg-[var(--color-card-bg-dark)] rounded-lg shadow-2xl border border-gray-200 dark:border-[var(--color-card-border-dark)] pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-modal-title"
          aria-describedby="logout-modal-description"
        >
          <div className="p-6">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30">
                <i className="bi bi-box-arrow-right text-red-600 dark:text-red-400 text-3xl"></i>
              </div>
            </div>

            {/* Title */}
            <h3 id="logout-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
              Konfirmasi Keluar
            </h3>

            {/* Description */}
            <p id="logout-modal-description" className="text-sm text-gray-600 dark:text-gray-300 text-center mb-6">
              Apakah Anda yakin ingin keluar? Anda perlu masuk lagi untuk mengakses akun Anda.
            </p>

            {/* Buttons */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-white bg-red-600 dark:bg-red-500 rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Use portal to render modal at body level, avoiding any parent positioning issues
  return createPortal(modalContent, document.body);
}
