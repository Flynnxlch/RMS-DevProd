const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildMonthOptions() {
  const options = [];
  const now = new Date();
  let year = 2025;
  let month = 0; // Jan 2025

  while (year < now.getFullYear() || (year === now.getFullYear() && month <= now.getMonth())) {
    options.push({
      value: `${year}-${month}`,
      label: `${MONTH_NAMES[month]} '${String(year).slice(2)}`,
      year,
      month,
    });
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  return options;
}

const MONTH_OPTIONS = buildMonthOptions();

const selectClass =
  'rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0c9361] dark:focus:ring-[#0c9361] transition-colors';

export default function StatusBar({
  periodMonths,
  onPeriodChange,
  startMonth,
  onStartMonthChange,
  branchFilter,
  onBranchChange,
  branchOptions = [],
  showBranchFilter = false,
}) {
  const currentMonthValue = `${startMonth.year}-${startMonth.month}`;

  function handleStartMonthChange(e) {
    const opt = MONTH_OPTIONS.find((o) => o.value === e.target.value);
    if (opt) onStartMonthChange({ year: opt.year, month: opt.month });
  }

  return (
    <div className="mb-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        {/* Period filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap" htmlFor="status-bar-period">
            Periode
          </label>
          <select
            id="status-bar-period"
            value={periodMonths}
            onChange={(e) => onPeriodChange(Number(e.target.value))}
            className={selectClass}
          >
            <option value={1}>1 Bulan</option>
            <option value={4}>4 Bulan</option>
            <option value={6}>6 Bulan</option>
          </select>
        </div>

        {/* Start month */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap" htmlFor="status-bar-start">
            Mulai
          </label>
          <select
            id="status-bar-start"
            value={currentMonthValue}
            onChange={handleStartMonthChange}
            className={selectClass}
          >
            {MONTH_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Branch filter — Risk Assessment only */}
        {showBranchFilter && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap" htmlFor="status-bar-branch">
              Cabang
            </label>
            <select
              id="status-bar-branch"
              value={branchFilter}
              onChange={(e) => onBranchChange(e.target.value)}
              className={selectClass}
            >
              <option value="all">Semua Cabang</option>
              {branchOptions.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Info label showing active range */}
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
          {periodMonths === 1
            ? `${MONTH_NAMES[startMonth.month]} '${String(startMonth.year).slice(2)}`
            : (() => {
                const endMonth = (startMonth.month + periodMonths - 1) % 12;
                const endYear = startMonth.year + Math.floor((startMonth.month + periodMonths - 1) / 12);
                return `${MONTH_NAMES[startMonth.month]} '${String(startMonth.year).slice(2)} – ${MONTH_NAMES[endMonth]} '${String(endYear).slice(2)}`;
              })()}
        </span>
      </div>
    </div>
  );
}
