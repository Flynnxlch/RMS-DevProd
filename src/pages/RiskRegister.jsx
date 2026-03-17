import { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import RiskCardExpandable from '../components/risk/RiskCardExpandable';
import { useAuth } from '../context/AuthContext';
import ContentHeader from '../components/ui/ContentHeader';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Card } from '../components/widgets';
import { useRisks } from '../context/RiskContext';
import { RISK_LEVELS, getRiskLevel } from '../utils/risk';

const RISKS_PER_PAGE = 6;

export default function RiskRegister() {
  const { risks, removeRisk, fetchRisks, isLoading: risksLoading } = useRisks();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('highest-risk'); // Default: Highest Risk
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Get levelKey from URL params (from sidebar filter)
  const levelKey = useMemo(() => {
    const lvl = searchParams.get('level');
    if (!lvl || lvl === 'all') return null;
    if (RISK_LEVELS.some((x) => x.key === lvl)) return lvl;
    return null;
  }, [searchParams]);

  // Fetch risks when sortBy changes (sorting done in backend)
  // Always force-refresh to ensure browser cache never serves stale data
  useEffect(() => {
    fetchRisks(true, sortBy);
  }, [sortBy, fetchRisks]);

  // Reset to page 1 when filter/search/sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [query, levelKey, sortBy]);

  const filteredRisks = useMemo(() => {
    const q = query.trim().toLowerCase();

    return risks.filter((r) => {
      // Filter by level if levelKey is set (from sidebar)
      if (levelKey) {
        const lvl = getRiskLevel(r.score);
        const matchesLevel = lvl ? lvl.key === levelKey : false;
        if (!matchesLevel) return false;
      }

      // Filter by search query
      if (!q) return true;
      const hay = `${r.id} ${r.title || r.riskEvent || ''} ${r.category || ''} ${r.owner || ''} ${r.location || ''} ${r.regionCode || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [risks, query, levelKey]);

  // Calculate pagination
  const totalPages = useMemo(() => {
    return Math.ceil(filteredRisks.length / RISKS_PER_PAGE);
  }, [filteredRisks.length]);

  // Get paginated risks (6 per page)
  const paginatedRisks = useMemo(() => {
    const startIndex = (currentPage - 1) * RISKS_PER_PAGE;
    const endIndex = startIndex + RISKS_PER_PAGE;
    return filteredRisks.slice(startIndex, endIndex);
  }, [filteredRisks, currentPage]);

  // Ensure currentPage is valid when filtered results change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);


  const handleRemoveRisk = async (riskId) => {
    setIsLoading(true);
    try {
      await removeRisk(riskId);
    } finally {
      setIsLoading(false);
    }
  };

  const inputBase =
    'w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors';

  return (
    <>
      <ContentHeader
        title="Risiko"
        breadcrumbs={[
          { label: 'Beranda', path: '/' },
          { label: 'Register Risiko' },
        ]}
      />

      <Card
        title="Semua Risiko"
        headerExtra={
          user?.userRole === 'RISK_OFFICER' ? (
            <Link
              to="/risks/new"
              className="inline-flex items-center rounded-lg bg-[#0d6efd] px-3 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
            >
              <i className="bi bi-plus-circle mr-2" />
              Risiko Baru
            </Link>
          ) : null
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4">
          <div className="sm:col-span-8">
            <input
              className={inputBase}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari berdasarkan id, judul, kategori, pemilik, lokasi..."
            />
          </div>
          <div className="sm:col-span-4">
            <select
              className={inputBase}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="highest-risk">Urutkan Berdasarkan Risk Tertinggi</option>
              <option value="lowest-risk">Urutkan Berdasarkan Risk Terendah</option>
              <option value="a-to-z">Urutkan Berdasarkan Nama A - Z</option>
              <option value="z-to-a">Urutkan Berdasarkan Nama Z - A</option>
            </select>
          </div>
        </div>

        <LoadingSpinner isLoading={isLoading || risksLoading} delay={250} overlay={true}>
          <div className="space-y-3">
            {paginatedRisks.map((r) => (
              <RiskCardExpandable
                key={r.id}
                risk={r}
                showRiskLevel={true}
                showScoreBar={true}
                showRemoveButton={user?.userRole === 'RISK_ASSESSMENT'}
                showActionButtons={user?.userRole !== 'RISK_ASSESSMENT'}
                showEvaluateButton={false}
                showRiskLevelText={false}
                showLocation={true}
                showEvaluationMonth={true}
                clickable={true}
                onRemove={handleRemoveRisk}
              />
            ))}

            {!filteredRisks.length && !risksLoading && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Tidak ada risiko ditemukan.{user?.userRole === 'RISK_OFFICER' && (
                  <> <Link className="text-blue-600 dark:text-blue-400 hover:underline transition-colors" to="/risks/new">Buat risiko baru</Link>.</>
                )}
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {filteredRisks.length > 0 && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2 border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center gap-2">
                {/* Previous Button */}
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <i className="bi bi-chevron-left mr-1" />
                  Sebelumnya
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current
                    const showPage = 
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1);
                    
                    if (!showPage) {
                      // Show ellipsis
                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <span key={page} className="px-2 text-gray-500 dark:text-gray-400">
                            ...
                          </span>
                        );
                      }
                      return null;
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Selanjutnya
                  <i className="bi bi-chevron-right ml-1" />
                </button>
              </div>
            </div>
          )}
        </LoadingSpinner>
      </Card>
    </>
  );
}


