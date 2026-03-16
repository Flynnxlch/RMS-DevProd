import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRequest, API_ENDPOINTS } from '../../config/api';

const STORAGE_KEY_PREFIX = 'minlt:buletin:lastRead:';
const NOTIFIED_ROLES = ['RISK_OFFICER', 'RISK_CHAMPION'];

function getStorageKey(userId) {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

function getLastRead(userId) {
  try {
    return localStorage.getItem(getStorageKey(userId)) || null;
  } catch {
    return null;
  }
}

export function markBuletinAsRead(userId, latestPublishedAt) {
  try {
    if (userId && latestPublishedAt) {
      localStorage.setItem(getStorageKey(userId), latestPublishedAt);
    }
  } catch {
    // ignore
  }
}

export default function BuletinNotification() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestPublishedAt, setLatestPublishedAt] = useState(null);

  const checkUnread = useCallback(async () => {
    if (!isAuthenticated || !user?.id || !NOTIFIED_ROLES.includes(user?.userRole)) return;

    try {
      const data = await apiRequest(API_ENDPOINTS.regulations.getAll);
      const updates = data.updates || [];
      if (updates.length === 0) return;

      // Backend returns sorted newest first
      const latest = updates[0];
      const latestDate = latest.publishedAt;
      setLatestPublishedAt(latestDate);

      const lastRead = getLastRead(user.id);

      // Show popup if user has never read, or if there's something newer than what they last read
      if (!lastRead || new Date(latestDate) > new Date(lastRead)) {
        // Count items newer than lastRead
        const count = lastRead
          ? updates.filter((u) => new Date(u.publishedAt) > new Date(lastRead)).length
          : updates.length;
        setUnreadCount(count);
        setIsOpen(true);
      }
    } catch {
      // Silently ignore — notification is non-critical
    }
  }, [isAuthenticated, user?.id, user?.userRole]);

  useEffect(() => {
    checkUnread();
  }, [checkUnread]);

  const handleGoToBuletin = () => {
    if (user?.id && latestPublishedAt) {
      markBuletinAsRead(user.id, latestPublishedAt);
    }
    setIsOpen(false);
    navigate('/guide');
  };

  const handleDismiss = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 backdrop-blur-sm" />

      {/* Popup */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
              <i className="bi bi-journal-richtext text-green-600 dark:text-green-400 text-3xl" />
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Buletin Baru!
            </h3>

            {/* Count badge */}
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Ada{' '}
              <span className="font-semibold text-green-600 dark:text-green-400">
                {unreadCount} buletin baru
              </span>{' '}
              dari Risk Assessment yang belum kamu baca.
            </p>

            <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
              Buka buletin untuk melihat pedoman, update kriteria, dan pemberitahuan terbaru.
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleGoToBuletin}
                className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-[#0c9361] hover:bg-[#0a7a4f] rounded-lg transition-colors"
              >
                <i className="bi bi-book mr-2" />
                Lihat Buletin
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="w-full px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 rounded-lg transition-colors"
              >
                Nanti Saja
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
