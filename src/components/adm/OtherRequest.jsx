import { useEffect, useState } from 'react';
import { Card } from '../widgets';

// Helper function to truncate text
function truncateText(value, maxChars) {
  const s = String(value ?? '');
  if (!maxChars || maxChars <= 0) return s;
  if (s.length <= maxChars) return s;
  return `${s.slice(0, maxChars)}...`;
}

const STORAGE_KEY = 'minlt:other-requests';

const SAMPLE_OTHER_REQUESTS = [
  {
    id: 'or-1',
    type: 'Admin Access',
    name: 'Dimas Pratama',
    email: 'dimas.pratama@example.com',
    detail: 'Request role upgrade to Admin to manage risk approvals.',
    requestedAt: '2026-01-10T09:05:00Z',
  },
  {
    id: 'or-2',
    type: 'Password Reset',
    name: 'Siti Aisyah',
    email: 'siti.aisyah@example.com',
    detail: 'Forgot password and requesting reset approval.',
    requestedAt: '2026-01-12T14:30:00Z',
  },
];

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

function typeBadgeClass(type) {
  const t = String(type || '').toLowerCase();
  if (t.includes('admin')) return 'bg-purple-100 text-purple-800 ring-1 ring-inset ring-purple-200 dark:bg-purple-900/30 dark:text-purple-300';
  if (t.includes('password')) return 'bg-blue-100 text-blue-800 ring-1 ring-inset ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300';
  return 'bg-gray-100 text-gray-800 ring-1 ring-inset ring-gray-200 dark:bg-gray-800 dark:text-gray-200';
}

export default function OtherRequest({ onApprove, onReject }) {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRequests(parsed);
          return;
        }
      } catch {
        // ignore
      }
    }

    // Seed demo data if no storage exists
    setRequests(SAMPLE_OTHER_REQUESTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_OTHER_REQUESTS));
  }, []);

  const handleApprove = (requestId) => {
    const updated = requests.filter((r) => r.id !== requestId);
    setRequests(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    onApprove?.(requestId);
  };

  const handleReject = (requestId) => {
    const updated = requests.filter((r) => r.id !== requestId);
    setRequests(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    onReject?.(requestId);
  };

  return (
    <Card title="Permintaan Lainnya">
      {requests.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
          Tidak ada permintaan yang tertunda.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-(--color-card-border-dark)">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Jenis</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Pengguna</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Detail</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Diminta Pada</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-200">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr
                  key={request.id}
                  className="border-b border-gray-100 dark:border-(--color-card-border-dark) hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${typeBadgeClass(request.type)}`}>
                      {request.type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white" title={request.name}>
                        {truncateText(request.name, 20)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{request.email}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{request.detail}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{formatDate(request.requestedAt)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(request.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#198754] rounded-lg hover:bg-[#157347] transition-colors shadow-sm"
                        title="Setujui Permintaan"
                      >
                        <i className="bi bi-check-circle"></i>
                        <span className="hidden sm:inline">Setujui</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(request.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#dc3545] rounded-lg hover:bg-[#bb2d3b] transition-colors shadow-sm"
                        title="Tolak Permintaan"
                      >
                        <i className="bi bi-x-circle"></i>
                        <span className="hidden sm:inline">Tolak</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}


