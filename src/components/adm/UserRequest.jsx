import { useState, useEffect } from 'react';
import { Card } from '../widgets';
import NotificationPopup from '../ui/NotificationPopup';
import { apiRequest, API_ENDPOINTS } from '../../config/api';

// Helper function to truncate text
function truncateText(value, maxChars) {
  const s = String(value ?? '');
  if (!maxChars || maxChars <= 0) return s;
  if (s.length <= maxChars) return s;
  return `${s.slice(0, maxChars)}...`;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function UserRequest({ onApprove, onReject }) {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [notification, setNotification] = useState({ isOpen: false, type: 'error', title: '', message: '' });

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiRequest(API_ENDPOINTS.requests.registration.getAll);
      // Filter to only show PENDING requests (backend should already filter, but this is a safety check)
      const pendingRequests = (data.requests || []).filter(
        req => !req.status || req.status.toLowerCase() === 'pending'
      );
      setRequests(pendingRequests);
    } catch (err) {
      setError(err.message || 'Gagal memuat permintaan registrasi');
      console.error('Error fetching registration requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (requestId) => {
    if (processingId) return; // Prevent double submission
    
    try {
      setProcessingId(requestId);
      await apiRequest(API_ENDPOINTS.requests.registration.approve(requestId), {
        method: 'POST',
      });
      await fetchRequests(); // Refresh list
      onApprove?.(requestId);
    } catch (err) {
      console.error('Error approving request:', err);
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Gagal Menyetujui',
        message: err.message || 'Gagal menyetujui permintaan',
      });
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    if (processingId) return; // Prevent double submission
    
    try {
      setProcessingId(requestId);
      await apiRequest(API_ENDPOINTS.requests.registration.reject(requestId), {
        method: 'POST',
      });
      await fetchRequests(); // Refresh list
      onReject?.(requestId);
    } catch (err) {
      console.error('Error rejecting request:', err);
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Gagal Menolak',
        message: err.message || 'Gagal menolak permintaan',
      });
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card title="Permintaan Registrasi Pengguna">
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
          Memuat permintaan registrasi...
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Permintaan Registrasi Pengguna">
        <div className="text-sm text-red-600 dark:text-red-400 text-center py-8">
          Kesalahan: {error}
        </div>
      </Card>
    );
  }

  return (
    <Card title="Permintaan Registrasi Pengguna" collapsible>
      {requests.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
          Tidak ada permintaan registrasi yang tertunda.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[var(--color-card-border-dark)]">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Nama</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Email</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Cabang</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">NIP</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Diminta Pada</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr
                  key={request.id}
                  className="border-b border-gray-100 dark:border-[var(--color-card-border-dark)] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white" title={request.name}>
                    {truncateText(request.name, 20)}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{request.email}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{request.cabang}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{request.nip}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{formatDate(request.requestedAt)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(request.id)}
                        disabled={processingId === request.id || (request.status && request.status.toLowerCase() !== 'pending')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#198754] rounded-lg hover:bg-[#157347] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Setujui Permintaan"
                      >
                        {processingId === request.id ? (
                          <>
                            <i className="bi bi-arrow-repeat animate-spin"></i>
                            <span className="hidden sm:inline">Memproses...</span>
                          </>
                        ) : (
                          <>
                            <i className="bi bi-check-circle"></i>
                            <span className="hidden sm:inline">Setujui</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(request.id)}
                        disabled={processingId === request.id || (request.status && request.status.toLowerCase() !== 'pending')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#dc3545] rounded-lg hover:bg-[#bb2d3b] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Tolak Permintaan"
                      >
                        {processingId === request.id ? (
                          <>
                            <i className="bi bi-arrow-repeat animate-spin"></i>
                            <span className="hidden sm:inline">Memproses...</span>
                          </>
                        ) : (
                          <>
                            <i className="bi bi-x-circle"></i>
                            <span className="hidden sm:inline">Tolak</span>
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Notification Popup */}
      <NotificationPopup
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
    </Card>
  );
}

