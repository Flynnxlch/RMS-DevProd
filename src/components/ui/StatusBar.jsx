const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MAX_RANGE_MONTHS = 6; // inclusive span (Jan–Jun = 6)

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

/** Add `n` months to a {year, month} object */
function addMonths(ym, n) {
  const total = ym.year * 12 + ym.month + n;
  return { year: Math.floor(total / 12), month: total % 12 };
}

/** Compare two {year, month} — returns negative / 0 / positive */
function cmpMonths(a, b) {
  return (a.year * 12 + a.month) - (b.year * 12 + b.month);
}

const ALL_MONTH_OPTIONS = buildMonthOptions();

const selectClass =
  'rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0c9361] dark:focus:ring-[#0c9361] transition-colors';

export default function StatusBar({
  startMonth,
  onStartMonthChange,
  endMonth,
  onEndMonthChange,
  branchFilter,
  onBranchChange,
  branchOptions = [],
  showBranchFilter = false,
}) {
  const now = new Date();
  const currentMonth = { year: now.getFullYear(), month: now.getMonth() };

  // Max allowed end = start + (MAX_RANGE_MONTHS - 1), clamped to current month
  const rawMax = addMonths(startMonth, MAX_RANGE_MONTHS - 1);
  const maxEnd = cmpMonths(rawMax, currentMonth) > 0 ? currentMonth : rawMax;

  // Options for Akhir: startMonth ≤ option ≤ maxEnd
  const endOptions = ALL_MONTH_OPTIONS.filter(
    (o) => cmpMonths(o, startMonth) >= 0 && cmpMonths(o, maxEnd) <= 0
  );

  function handleStartChange(e) {
    const opt = ALL_MONTH_OPTIONS.find((o) => o.value === e.target.value);
    if (!opt) return;
    const newStart = { year: opt.year, month: opt.month };
    onStartMonthChange(newStart);

    // Clamp endMonth into [newStart, newStart+5] ∩ [*, currentMonth]
    const newRawMax = addMonths(newStart, MAX_RANGE_MONTHS - 1);
    const newMax = cmpMonths(newRawMax, currentMonth) > 0 ? currentMonth : newRawMax;
    if (cmpMonths(endMonth, newStart) < 0) {
      onEndMonthChange(newStart);
    } else if (cmpMonths(endMonth, newMax) > 0) {
      onEndMonthChange(newMax);
    }
  }

  function handleEndChange(e) {
    const opt = ALL_MONTH_OPTIONS.find((o) => o.value === e.target.value);
    if (opt) onEndMonthChange({ year: opt.year, month: opt.month });
  }

  const startValue = `${startMonth.year}-${startMonth.month}`;
  const endValue   = `${endMonth.year}-${endMonth.month}`;

  const rangeLabel =
    startValue === endValue
      ? `${MONTH_NAMES[startMonth.month]} '${String(startMonth.year).slice(2)}`
      : `${MONTH_NAMES[startMonth.month]} '${String(startMonth.year).slice(2)} – ${MONTH_NAMES[endMonth.month]} '${String(endMonth.year).slice(2)}`;

  return (
    <div className="mb-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        {/* Mulai */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap" htmlFor="status-bar-start">
            Mulai
          </label>
          <select
            id="status-bar-start"
            value={startValue}
            onChange={handleStartChange}
            className={selectClass}
          >
            {ALL_MONTH_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Akhir */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap" htmlFor="status-bar-end">
            Akhir
          </label>
          <select
            id="status-bar-end"
            value={endValue}
            onChange={handleEndChange}
            className={selectClass}
          >
            {endOptions.map((opt) => (
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

        {/* Active range label */}
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
          {rangeLabel}
        </span>
      </div>
    </div>
  );
}
