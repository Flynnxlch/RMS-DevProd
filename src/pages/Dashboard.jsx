import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { OtherRequest, UpdatePeraturanTerbaru, UserList, UserRequest } from '../components/adm';
import CategoryDistributionChart from '../components/charts/CategoryDistributionChart';
import DonutChart from '../components/charts/DonutChart';
import PieChart from '../components/charts/PieChart';
import RiskStatusTrendChart from '../components/charts/RiskStatusTrendChart';
import RiskTrendChart from '../components/charts/RiskTrendChart';
import RiskCardExpandable from '../components/risk/RiskCardExpandable';
import RiskMatrix from '../components/risk/RiskMatrix';
import ContentHeader from '../components/ui/ContentHeader';
import StatusBar from '../components/ui/StatusBar';
import { Card, SmallBox } from '../components/widgets';
import { useAuth } from '../context/AuthContext';
import { useRisks } from '../context/RiskContext';
import { getCabangLabel } from '../utils/cabang';
import {
  getRiskSummary,
  RISK_LEVELS,
  sortRisksByScoreDesc,
} from '../utils/risk';
import { getRiskStatus, RISK_STATUS_CONFIG, RISK_STATUS_ORDER } from '../utils/riskStatus';

const STATUS_COLORS = {
  'risiko-baru':       '#adb5bd',
  'identifikasi-ulang':'#dc3545',
  'perlu-pengukuran':  '#6f42c1',
  analyzed:            '#0d6efd',
  planned:             '#ffc107',
  monitor:             '#20c997',
  mitigate:            '#fd7e14',
  'need-improvement':  '#e83e8c',
};

export default function Dashboard() {
  const { risks, isLoading: risksLoading, error: risksError } = useRisks();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get('mode') || 'risk';

  // RiskMatrix score mode: 'inherent' | 'current' | 'residual'
  const [matrixScoreMode, setMatrixScoreMode] = useState('inherent');

  // StatusBar filter state — date-range mode (max 6 months), persisted in localStorage
  const [startMonth, setStartMonth] = useState(() => {
    try {
      const saved = localStorage.getItem('dashboard_startMonth');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [endMonth, setEndMonth] = useState(() => {
    try {
      const saved = localStorage.getItem('dashboard_endMonth');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  useEffect(() => { localStorage.setItem('dashboard_startMonth', JSON.stringify(startMonth)); }, [startMonth]);
  useEffect(() => { localStorage.setItem('dashboard_endMonth', JSON.stringify(endMonth)); }, [endMonth]);
  const [branchFilter, setBranchFilter] = useState('all');

  // Risk Status chart — default Mitigate + Monitor, max 3 selected
  const [selectedStatuses, setSelectedStatuses] = useState(['mitigate', 'monitor']);
  const toggleStatusChart = (key) => {
    setSelectedStatuses((prev) => {
      if (prev.includes(key)) return prev.length <= 1 ? prev : prev.filter((k) => k !== key);
      return prev.length >= 3 ? prev : [...prev, key];
    });
  };

  // Derive periodMonths so charts still work (1 = daily view, >1 = monthly buckets)
  const periodMonths = (endMonth.year - startMonth.year) * 12 + (endMonth.month - startMonth.month) + 1;

  // Check if user is Risk Assessment (only Risk Assessment can access User mode)
  const isAdminPusat = user?.userRole === 'RISK_ASSESSMENT';

  // All hooks must be called before any conditional returns

  // Available branches derived from all risks (unfiltered)
  const branchOptions = useMemo(() => {
    const labels = new Set();
    for (const r of risks) {
      if (r.regionCode) {
        const label = getCabangLabel(r.regionCode) || r.regionCode;
        labels.add(label);
      }
    }
    return Array.from(labels).sort();
  }, [risks]);

  // Risks filtered by the StatusBar date range + branch selections
  const filteredRisks = useMemo(() => {
    const start = new Date(startMonth.year, startMonth.month, 1);
    start.setHours(0, 0, 0, 0);
    // Last day of endMonth
    const end = new Date(endMonth.year, endMonth.month + 1, 0);
    end.setHours(23, 59, 59, 999);

    return risks.filter((r) => {
      const created = new Date(r.riskDate || r.createdAt);
      if (isNaN(created.getTime())) return true;
      if (created < start || created > end) return false;
      if (isAdminPusat && branchFilter !== 'all') {
        const label = getCabangLabel(r.regionCode) || r.regionCode;
        if (label !== branchFilter) return false;
      }
      return true;
    });
  }, [risks, startMonth, endMonth, isAdminPusat, branchFilter]);

  const summary = useMemo(() => getRiskSummary(filteredRisks), [filteredRisks]);

  // Get top risks: filter out Open Risk (score = 0 or null), then sort by score descending, take top 4
  const topRisks = useMemo(() => {
    const risksWithScore = filteredRisks.filter((r) => {
      const score = r.score || r.inherentScore || r.currentScore || r.residualScore || r.residualScoreFinal || 0;
      return score > 0;
    });
    return sortRisksByScoreDesc(risksWithScore).slice(0, 4);
  }, [filteredRisks]);

  // Hitung risiko yang sudah mengajukan evaluasi keberhasilan
  const dueThisMonth = useMemo(() => {
    return filteredRisks.filter((r) => r.evaluationRequested === true).length;
  }, [filteredRisks]);

  // Persentase risiko yang sudah memiliki mitigasi
  const mitigationCoverage = useMemo(() => {
    if (!filteredRisks.length) return 0;
    const withMitigation = filteredRisks.filter((r) => (r.mitigation || '').trim().length > 0).length;
    return Math.round((withMitigation / filteredRisks.length) * 100);
  }, [filteredRisks]);

  const statusSummary = useMemo(() => {
    const order = RISK_STATUS_ORDER;
    const counts = new Map(order.map((k) => [k, 0]));
    for (const r of filteredRisks) {
      const s = getRiskStatus(r);
      counts.set(s, (counts.get(s) || 0) + 1);
    }
    return order.map((key) => ({
      key,
      label: RISK_STATUS_CONFIG[key]?.label || key,
      count: counts.get(key) || 0,
      color: STATUS_COLORS[key] || '#6c757d',
    }));
  }, [filteredRisks]);

  const statusDonut = useMemo(() => {
    return {
      labels: statusSummary.map((x) => x.label),
      data: statusSummary.map((x) => x.count),
      colors: statusSummary.map((x) => x.color),
    };
  }, [statusSummary]);

  const selectedStatusData = useMemo(
    () => selectedStatuses.map((key) => ({
      key,
      label: RISK_STATUS_CONFIG[key]?.label || key,
      color: STATUS_COLORS[key] || '#6c757d',
    })),
    [selectedStatuses],
  );

  // Category distribution — all roles, reads from actual risk data
  const categorySummary = useMemo(() => {
    const counts = new Map();
    for (const r of filteredRisks) {
      const cat = r.category || 'N/A';
      counts.set(cat, (counts.get(cat) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredRisks]);

  const totalMitigationActual = useMemo(() => {
    return filteredRisks.reduce((sum, r) => {
      const actual = r.mitigationActual || 0;
      return sum + (typeof actual === 'number' ? actual : 0);
    }, 0);
  }, [filteredRisks]);

  const totalMitigationBudget = useMemo(() => {
    return filteredRisks.reduce((sum, r) => {
      const budget = r.mitigationBudget || 0;
      return sum + (typeof budget === 'number' ? budget : 0);
    }, 0);
  }, [filteredRisks]);

  const mitigationActualCount = useMemo(() => {
    return filteredRisks.filter(r => r.mitigationActual && r.mitigationActual > 0).length;
  }, [filteredRisks]);

  const mitigationBudgetCount = useMemo(() => {
    return filteredRisks.filter(r => r.mitigationBudget && r.mitigationBudget > 0).length;
  }, [filteredRisks]);

  // Calculate percentage for donut chart (Realisasi vs Anggaran)
  const mitigationPercentage = useMemo(() => {
    if (totalMitigationBudget === 0) return 0;
    return Math.min(100, Math.round((totalMitigationActual / totalMitigationBudget) * 100));
  }, [totalMitigationActual, totalMitigationBudget]);

  // Data untuk pie chart distribusi tingkat risiko
  const riskLevelPieData = useMemo(() => {
    const labels = RISK_LEVELS.map((lvl) => lvl.labelId || lvl.label);
    const data = RISK_LEVELS.map((lvl) => summary.counts[lvl.key] || 0);
    const colors = RISK_LEVELS.map((lvl) => lvl.mapColor);
    return { labels, data, colors };
  }, [summary]);

  // Prepare data for Risk Level Distribution Pie Chart
  // Redirect to risk mode if user tries to access user mode but is not Admin Pusat
  useEffect(() => {
    if (mode === 'user' && !isAdminPusat) {
      navigate('/');
    }
  }, [mode, isAdminPusat, navigate]);

  // Show loading state while risks are being fetched (after all hooks)
  if (risksLoading) {
    return (
      <>
        <ContentHeader
          title="Dasbor Risiko"
          breadcrumbs={[
            { label: 'Beranda', path: '/' },
          ]}
        />
        <div className="flex items-center justify-center h-64 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="text-center">
            <i className="bi bi-arrow-repeat animate-spin text-4xl text-[#0c9361] mb-4"></i>
            <p className="text-gray-600 dark:text-gray-400">Memuat data risiko...</p>
          </div>
        </div>
      </>
    );
  }
  
  // Show error state if there's an error fetching risks (after all hooks)
  if (risksError) {
    return (
      <>
        <ContentHeader
          title="Dasbor Risiko"
          breadcrumbs={[
            { label: 'Beranda', path: '/' },
          ]}
        />
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <i className="bi bi-exclamation-triangle-fill text-yellow-600 dark:text-yellow-400 text-lg mt-0.5"></i>
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">Peringatan</p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">{risksError}</p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-2">
                Pastikan backend server berjalan di <code className="bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded">Di Backend</code>
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Early return if redirecting
  if (mode === 'user' && !isAdminPusat) {
    return null;
  }

  // User Dashboard View
  if (mode === 'user') {
    return (
      <>
        <ContentHeader
          title="Dasbor Pengguna"
          breadcrumbs={[
            { label: 'Beranda', path: '/' },
            { label: 'Dasbor Pengguna' },
          ]}
        />

        <div className="space-y-4">
          <UserList />
          <UserRequest />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <OtherRequest />
            <UpdatePeraturanTerbaru />
          </div>
        </div>
      </>
    );
  }

  // Risk Dashboard View (default)
  return (
    <>
      <ContentHeader
        title="Dasbor Risiko"
        breadcrumbs={[
          { label: 'Beranda', path: '/' },
          { label: 'Dasbor Risiko' },
        ]}
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <SmallBox title="Total Risiko" value={String(summary.total)} icon="bi-clipboard-data" color="primary" link="/risks" linkText="Buka register" />
        <SmallBox title="High Risk" value={String(summary.highPlus)} icon="bi-exclamation-triangle-fill" color="danger" link="/risks" linkText="Tinjau prioritas" />
        <SmallBox title="Cakupan Mitigasi" value={String(mitigationCoverage)} suffix="%" icon="bi-shield-check" color="success" link="/mitigations" linkText="Lacak tindakan" />
        <SmallBox title="Evaluasi Keberhasilan" value={String(dueThisMonth)} icon="bi-calendar-check" color="warning" link="/evaluations" linkText="Rencanakan tinjauan" />
      </div>

      {/* Status Bar — date range and branch filters */}
      <StatusBar
        startMonth={startMonth}
        onStartMonthChange={setStartMonth}
        endMonth={endMonth}
        onEndMonthChange={setEndMonth}
        branchFilter={branchFilter}
        onBranchChange={setBranchFilter}
        branchOptions={branchOptions}
        showBranchFilter={isAdminPusat}
      />

      {/* Monthly Recap Report (Open vs Planned) + Distribusi Status Risiko */}
      <Card
        title="Rekapitulasi Risiko"
        collapsible
        headerExtra={
          <div className="hidden sm:flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
            {selectedStatusData.map((s) => (
              <span key={s.key} className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                {s.label}
              </span>
            ))}
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8">
            <p className="text-center text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
              Risk Status
            </p>
            <RiskStatusTrendChart risks={filteredRisks} height={220} periodMonths={periodMonths} startMonth={startMonth} selectedStatuses={selectedStatusData} />
          </div>
          <div className="lg:col-span-4">
            <p className="text-center text-sm font-semibold text-gray-700 dark:text-gray-200">
              Distribusi Status Risiko
            </p>
            <p className="text-center text-xs text-gray-500 dark:text-gray-400 mb-2">
              Total : {summary.total}
            </p>
            {summary.total > 0 ? (
              <DonutChart labels={statusDonut.labels} data={statusDonut.data} colors={statusDonut.colors} height={180} />
            ) : (
              <div className="flex items-center justify-center min-h-[200px] text-sm text-gray-400 dark:text-gray-500">Belum ada risiko.</div>
            )}
          </div>
        </div>

        {/* Bottom separator + status legend (clickable to toggle chart lines, max 3) */}
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-x-3 gap-y-2">
            {statusSummary.map((x) => {
              const isSelected = selectedStatuses.includes(x.key);
              const atMax = selectedStatuses.length >= 3 && !isSelected;
              return (
                <button
                  key={x.key}
                  type="button"
                  onClick={() => toggleStatusChart(x.key)}
                  className={`inline-flex items-center gap-1.5 text-xs rounded px-1.5 py-0.5 transition-colors select-none ${
                    isSelected
                      ? 'cursor-pointer bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-400 dark:ring-blue-500'
                      : atMax
                        ? 'cursor-not-allowed text-gray-400 dark:text-gray-500 opacity-50'
                        : 'cursor-pointer text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title={isSelected ? 'Klik untuk sembunyikan dari grafik' : atMax ? 'Maksimal 3 status' : 'Klik untuk tampilkan di grafik'}
                >
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: x.color }} />
                  <span>{x.label}</span>
                  <span className="font-semibold">({x.count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left */}
        <div className="lg:col-span-7 space-y-4">
          <Card
            title="Indeks Risiko Gapura"
            collapsible
            headerExtra={
              <div className="hidden sm:flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#0d6efd]" />
                  Skor rata-rata
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#dc3545]" />
                  Inherent Risk Ratio
                </span>
              </div>
            }
          >
            <RiskTrendChart risks={filteredRisks} height={300} periodMonths={periodMonths} startMonth={startMonth} />
          </Card>

          <Card title="Distribusi Risiko per Kategori" outline color="primary" collapsible>
            <p className="text-center text-xs text-gray-500 dark:text-gray-400 mb-2">
              Total : {summary.total}
            </p>
            {summary.total > 0 && categorySummary.length > 0 ? (
              <CategoryDistributionChart
                data={categorySummary}
                height={Math.max(240, 180 + categorySummary.length * 18)}
              />
            ) : (
              <div className="flex items-center justify-center py-12 text-sm text-gray-400 dark:text-gray-500">Belum ada risiko.</div>
            )}
          </Card>

          {/* Distribusi Tingkat Risiko & Skor Rata-rata (gabung jadi 1 section) */}
          <Card title="Distribusi Tingkat Risiko & Skor Rata-rata" collapsible>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {/* Left: Pie Chart distribusi tingkat risiko */}
              <div className="flex flex-col items-center justify-center">
                {summary.assessedTotal > 0 ? (
                  <>
                    <PieChart
                      labels={riskLevelPieData.labels}
                      data={riskLevelPieData.data}
                      colors={riskLevelPieData.colors}
                      height={200}
                    />
                    <div className="mt-2 flex flex-wrap justify-center gap-2 text-xs">
                      {RISK_LEVELS.map((lvl) => {
                        const count = summary.counts[lvl.key] || 0;
                        if (count === 0) return null;
                        return (
                          <div key={lvl.key} className="flex items-center gap-1">
                            <span
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: lvl.mapColor }}
                            />
                            <span className="text-gray-600 dark:text-gray-400">{lvl.labelId || lvl.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center py-12 text-sm text-gray-400 dark:text-gray-500">Belum ada risiko.</div>
                )}
              </div>

              {/* Right: Skor Risiko Rata-rata */}
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-semibold text-gray-700 dark:text-gray-200">{summary.avgScore}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Skor rata-rata dari semua risiko</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Akumulasi Harga Mitigasi */}
          <Card title="Akumulasi Harga Mitigasi" collapsible>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Data Section */}
              <div className="lg:col-span-2 space-y-4">
                {/* Realisasi Biaya */}
                <div>
                  <div className="text-2xl sm:text-3xl font-semibold text-gray-700 dark:text-gray-200">
                    {totalMitigationActual > 0 
                      ? new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(totalMitigationActual)
                      : 'Rp 0'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Total realisasi biaya mitigasi dari {mitigationActualCount} risiko
                  </div>
                </div>

                {/* Anggaran Biaya */}
                <div>
                  <div className="text-2xl sm:text-3xl font-semibold text-gray-700 dark:text-gray-200">
                    {totalMitigationBudget > 0 
                      ? new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(totalMitigationBudget)
                      : 'Rp 0'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Total akumulasi anggaran mitigasi dari {mitigationBudgetCount} risiko
                  </div>
                </div>
              </div>

              {/* Right: Donut Chart */}
              <div className="lg:col-span-1 flex items-center justify-center">
                <div className="relative w-full max-w-[140px]">
                  <DonutChart
                    labels={['Realisasi', 'Sisa Anggaran']}
                    data={[
                      totalMitigationActual || 0, 
                      Math.max(0, (totalMitigationBudget || 0) - (totalMitigationActual || 0))
                    ]}
                    colors={['#20c997', '#e5e7eb']}
                    height={140}
                    cutout="70%"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-700 dark:text-gray-200">
                        {mitigationPercentage}%
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Realisasi
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right */}
        <div className="lg:col-span-5 space-y-4">
          <Card
            title="Matriks Risiko"
            collapsible
            color="primary"
            gradient
            headerExtra={
              <div className="flex items-center gap-1 rounded-lg bg-black/10 dark:bg-black/20 p-0.5 text-xs font-semibold">
                {[
                  { key: 'inherent', label: 'Inherent' },
                  { key: 'current', label: 'Current' },
                  { key: 'residual', label: 'Residual' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMatrixScoreMode(key)}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      matrixScoreMode === key
                        ? 'bg-white text-[#0d6efd] shadow-sm'
                        : 'text-gray-800 dark:text-white/80 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            }
            footer={
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-900 dark:text-white/90">
                <span className="font-semibold">Legenda:</span>
                {RISK_LEVELS.map((lvl) => (
                  <span key={lvl.key} className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: lvl.mapColor }} />
                    {lvl.label} ({lvl.min}-{lvl.max})
                  </span>
                ))}
              </div>
            }
          >
            <div className="h-[260px] bg-white/10 dark:bg-gray-800/20 rounded-lg overflow-hidden border border-white/20 dark:border-gray-700/30 relative">
              <RiskMatrix risks={filteredRisks} scoreMode={matrixScoreMode} />
            </div>
          </Card>

          <Card title="Daftar Risiko" collapsible>
            <div className="space-y-3">
              {topRisks.map((r) => (
                <RiskCardExpandable
                  key={r.id}
                  risk={r}
                  showRiskLevel={false}
                  showScoreBar={false}
                  showLocation={true}
                  showEvaluationMonth={true}
                  clickable={true}
                />
              ))}
              {!topRisks.length && (
                <div className="flex items-center justify-center py-8 text-sm text-gray-400 dark:text-gray-500 text-center">Belum ada risiko. Tambahkan menggunakan "Entri Risiko Baru".</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

