import { useState, useEffect } from 'react';

export default function LoadingSpinner({ isLoading, delay = 250, children, className = '', overlay = false }) {
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShowSpinner(false);
      return;
    }

    // Show spinner after delay (220-320ms range)
    const timer = setTimeout(() => {
      setShowSpinner(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [isLoading, delay]);

  if (!isLoading || !showSpinner) {
    return children || null;
  }

  const spinnerContent = (
    <div className="flex items-center justify-center">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-[#0c9361] rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 border-t-[#0c9361] rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
        </div>
      </div>
    </div>
  );

  if (overlay) {
    return (
      <div className={`relative ${className}`}>
        {children}
        <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
          {spinnerContent}
        </div>
      </div>
    );
  }

  return spinnerContent;
}
