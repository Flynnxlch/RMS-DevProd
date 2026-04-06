const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth();

  // Single shared year — always taken from startMonth
  const sharedYear = startMonth.year;

  // Year options: 2025 to current year
  const years = [];
  for (let y = 2025; y <= currentYear; y++) years.push(y);

  // Max month index valid for the shared year
  const maxMonth = sharedYear === currentYear ? currentMonthIdx : 11;

  // Available months for Mulai: 0 to maxMonth
  const startMonths = Array.from({ length: maxMonth + 1 }, (_, i) => i);

  // Available months for Akhir: startMonth.month to maxMonth
  const endMonths = Array.from({ length: maxMonth - startMonth.month + 1 }, (_, i) => startMonth.month + i);

  function handleYearChange(e) {
    const y = parseInt(e.target.value, 10);
    const newMax = y === currentYear ? currentMonthIdx : 11;
    const newStartM = Math.min(startMonth.month, newMax);
    const newEndM = Math.min(Math.max(endMonth.month, newStartM), newMax);
    onStartMonthChange({ year: y, month: newStartM });
    onEndMonthChange({ year: y, month: newEndM });
  }

  function handleStartMonthChange(e) {
    const m = parseInt(e.target.value, 10);
    onStartMonthChange({ year: sharedYear, month: m });
    if (endMonth.month < m) onEndMonthChange({ year: sharedYear, month: m });
  }

  function handleEndMonthChange(e) {
    const m = parseInt(e.target.value, 10);
    onEndMonthChange({ year: sharedYear, month: m });
  }

  const rangeLabel =
    startMonth.month === endMonth.month
      ? `${MONTH_NAMES[startMonth.month]} ${sharedYear}`
      : `${MONTH_NAMES[startMonth.month]} – ${MONTH_NAMES[endMonth.month]} ${sharedYear}`;

  return (
    <div className="mb-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-start gap-3">

        {/* Tahun — shared for both Mulai and Akhir */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Tahun</label>
          <select value={sharedYear} onChange={handleYearChange} className={selectClass}>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Mulai */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Mulai</label>
          <select value={startMonth.month} onChange={handleStartMonthChange} className={selectClass}>
            {startMonths.map((m) => (
              <option key={m} value={m}>{MONTH_NAMES[m]}</option>
            ))}
          </select>
        </div>

        {/* Akhir */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Akhir</label>
          <select value={endMonth.month} onChange={handleEndMonthChange} className={selectClass}>
            {endMonths.map((m) => (
              <option key={m} value={m}>{MONTH_NAMES[m]}</option>
            ))}
          </select>
        </div>

        {/* Branch filter — Risk Assessment only */}
        {showBranchFilter && (
          <div className="flex flex-col gap-1">
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
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        )}

        {/* Active range label */}
        <span className="ml-auto self-end text-xs text-gray-400 dark:text-gray-500 hidden sm:block pb-1.5">
          {rangeLabel}
        </span>
      </div>
    </div>
  );
}
