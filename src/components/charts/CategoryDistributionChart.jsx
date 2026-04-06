import Chart from 'chart.js/auto';
import { useEffect, useRef } from 'react';

const CATEGORY_COLORS = [
  '#0d6efd', '#20c997', '#ffc107', '#d63384', '#6f42c1',
  '#adb5bd', '#dc3545', '#0dcaf0', '#fd7e14', '#198754',
  '#6c757d', '#e83e8c', '#17a2b8', '#343a40', '#f8f9fa',
];

export default function CategoryDistributionChart({ data = [], height = 220 }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const labels = data.map((d) => d.label);
  const counts = data.map((d) => d.count);
  const colors = data.map((_, i) => CATEGORY_COLORS[i % CATEGORY_COLORS.length]);
  const total  = counts.reduce((s, c) => s + c, 0);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    chartRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: counts,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: 'transparent',
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        animation: { duration: 450 },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(33, 37, 41, 0.92)',
            padding: 10,
            displayColors: true,
            callbacks: {
              label: (item) => ` ${item.raw} risiko`,
            },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <div className="flex items-center" style={{ height }}>
      {/* Donut chart — half width */}
      <div className="w-1/2 shrink-0" style={{ height }}>
        <canvas ref={canvasRef} />
      </div>

      {/* Separator */}
      <div className="self-stretch w-px bg-gray-200 dark:bg-gray-700 mx-4" />

      {/* Scrollable legend — max 5 rows visible */}
      <div className="w-1/2 min-w-0 overflow-y-auto" style={{ maxHeight: 5 * 36 }}>
        <ul className="space-y-1">
          {labels.map((label, i) => (
            <li key={label} className="flex items-center gap-2.5 px-1 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
              <span
                className="shrink-0 h-3 w-3 rounded-sm"
                style={{ backgroundColor: colors[i] }}
              />
              <span className="flex-1 min-w-0 text-xs text-gray-700 dark:text-gray-300" title={label}>
                {label.length > 40 ? `${label.slice(0, 40)}...` : label}
              </span>
              <span className="shrink-0 text-xs font-semibold text-gray-500 dark:text-gray-400">
                {counts[i]}
                <span className="font-normal text-gray-400 dark:text-gray-500 ml-0.5">
                  ({total > 0 ? Math.round((counts[i] / total) * 100) : 0}%)
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
