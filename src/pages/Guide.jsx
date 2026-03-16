import { useState, useEffect, useMemo } from 'react';
import ContentHeader from '../components/ui/ContentHeader';
import { Card } from '../components/widgets';
import { apiRequest, API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { markBuletinAsRead } from '../components/ui/BuletinNotification';

const CATEGORIES = [
  { key: 'all', label: 'Semua' },
  { key: 'Pedoman', label: 'Pedoman' },
  { key: 'Update Kriteria', label: 'Update Kriteria' },
  { key: 'Pemberitahuan', label: 'Pemberitahuan' },
];

const ITEMS_PER_PAGE = 10;

function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function categoryBadgeClass(category) {
  const c = String(category || '').toLowerCase();
  if (c.includes('pedoman')) return 'bg-green-100 text-green-800 ring-1 ring-inset ring-green-200 dark:bg-green-900/30 dark:text-green-300';
  if (c.includes('kriteria')) return 'bg-blue-100 text-blue-800 ring-1 ring-inset ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300';
  if (c.includes('pemberitahuan')) return 'bg-yellow-100 text-yellow-800 ring-1 ring-inset ring-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300';
  return 'bg-gray-100 text-gray-800 ring-1 ring-inset ring-gray-200 dark:bg-gray-800 dark:text-gray-200';
}

function categoryIcon(category) {
  const c = String(category || '').toLowerCase();
  if (c.includes('pedoman')) return 'bi-book';
  if (c.includes('kriteria')) return 'bi-bar-chart-line';
  if (c.includes('pemberitahuan')) return 'bi-bell';
  return 'bi-file-text';
}

export default function Guide() {
  const { user } = useAuth();
  const [updates, setUpdates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await apiRequest(API_ENDPOINTS.regulations.getAll);
        // Backend already sorts by publishedAt descending (newest first)
        const transformed = (data.updates || []).map((u) => ({
          id: u.id,
          title: u.title,
          category: u.category,
          type: u.contentType.toLowerCase(),
          content: u.content,
          publishedAt: u.publishedAt,
          link: u.link,
        }));
        setUpdates(transformed);

        // Mark as read — user has opened the Buletin page
        if (user?.id && transformed.length > 0) {
          markBuletinAsRead(user.id, transformed[0].publishedAt);
        }
      } catch (err) {
        console.error('Error loading buletin:', err);
        setError(err.message || 'Gagal memuat buletin');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user?.id]);

  // Reset to page 1 when category filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory]);

  const filteredUpdates = useMemo(() => {
    if (activeCategory === 'all') return updates;
    return updates.filter((u) => u.category === activeCategory);
  }, [updates, activeCategory]);

  const totalPages = useMemo(() => Math.ceil(filteredUpdates.length / ITEMS_PER_PAGE), [filteredUpdates.length]);

  const paginatedUpdates = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUpdates.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUpdates, currentPage]);

  return (
    <>
      <ContentHeader
        title="Buletin"
        breadcrumbs={[
          { label: 'Beranda', path: '/' },
          { label: 'Buletin' },
        ]}
      />

      <Card title="Apa Yang Terbaru">
        {/* Category filter tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {CATEGORIES.map((cat) => {
            const count = cat.key === 'all'
              ? updates.length
              : updates.filter((u) => u.category === cat.key).length;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeCategory === cat.key
                    ? 'bg-[#0c9361] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {cat.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  activeCategory === cat.key
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="py-12 text-center">
            <i className="bi bi-arrow-repeat text-3xl text-gray-300 dark:text-gray-600 mb-2 block animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Memuat buletin...</p>
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <i className="bi bi-exclamation-circle text-2xl text-red-400 mb-2 block" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : filteredUpdates.length === 0 ? (
          <div className="py-12 text-center">
            <i className="bi bi-journal-text text-3xl text-gray-300 dark:text-gray-600 mb-2 block" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {activeCategory === 'all'
                ? 'Belum ada buletin. Update akan muncul di sini setelah ditambahkan oleh Risk Assessment.'
                : `Belum ada buletin dengan kategori "${activeCategory}".`}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedUpdates.map((update) => (
                <div
                  key={update.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-white dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${categoryBadgeClass(update.category)}`}>
                      <i className={`bi ${categoryIcon(update.category)} text-[10px]`} />
                      {update.category}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      <i className="bi bi-calendar3 mr-1" />
                      {formatDate(update.publishedAt)}
                    </span>
                  </div>

                  <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                    {update.title}
                  </h4>

                  {update.type === 'text' ? (
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {update.content}
                    </p>
                  ) : (
                    <img
                      src={update.content}
                      alt={update.title}
                      className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                  )}

                  {update.link && update.link.trim() && (
                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <a
                        href={update.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        <i className="bi bi-link-45deg" />
                        Baca selengkapnya
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="bi bi-chevron-left" />
                  Sebelumnya
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Selanjutnya
                  <i className="bi bi-chevron-right" />
                </button>
              </div>
            )}
          </>
        )}
      </Card>
    </>
  );
}
