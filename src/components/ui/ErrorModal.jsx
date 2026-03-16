export default function ErrorModal({ isOpen, onClose, title = 'Kesalahan', message, type = 'error' }) {
  if (!isOpen) return null;

  const iconClass = type === 'error' 
    ? 'bi-exclamation-circle text-red-600 dark:text-red-400'
    : 'bi-info-circle text-blue-600 dark:text-blue-400';
  
  const iconBgClass = type === 'error'
    ? 'bg-red-100 dark:bg-red-900/30'
    : 'bg-blue-100 dark:bg-blue-900/30';

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 transition-opacity backdrop-blur-sm" 
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-md bg-white dark:bg-[var(--color-card-bg-dark)] rounded-lg shadow-2xl border border-gray-200 dark:border-[var(--color-card-border-dark)] pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${iconBgClass}`}>
                <i className={`bi ${iconClass} text-3xl`}></i>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
              {title}
            </h3>

            {/* Message */}
            <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-6">
              {message}
            </p>

            {/* Button */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={onClose}
                className={`px-6 py-2 text-sm font-semibold text-white rounded-lg transition-colors ${
                  type === 'error'
                    ? 'bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600'
                    : 'bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600'
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
