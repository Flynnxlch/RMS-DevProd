import Chart from 'chart.js/auto';
import { useEffect, useRef } from 'react';

const CATEGORY_COLORS = [
  '#0d6efd', '#20c997', '#ffc107', '#d63384', '#6f42c1',
  '#adb5bd', '#dc3545', '#0dcaf0', '#fd7e14', '#198754',
  '#6c757d', '#e83e8c', '#0dcaf0', '#17a2b8', '#343a40',
];

export default function CategoryDistributionChart({ data = [], height = 220 }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const labels = data.map((d) => d.label);
    const counts = data.map((d) => d.count);
    const colors = data.map((_, i) => CATEGORY_COLORS[i % CATEGORY_COLORS.length]);

    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            data: counts,
            backgroundColor: colors,
            borderRadius: 4,
            borderWidth: 0,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
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
        scales: {
          x: {
            beginAtZero: true,
            ticks: { color: '#6c757d', precision: 0 },
            grid: { color: 'rgba(0,0,0,0.08)' },
          },
          y: {
            ticks: {
              color: '#6c757d',
              font: { size: 11 },
            },
            grid: { display: false },
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
  }, [data]);

  return (
    <div className="relative w-full" style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
