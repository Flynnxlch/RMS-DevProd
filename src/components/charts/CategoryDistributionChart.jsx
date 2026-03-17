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
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              color: '#6c757d',
              font: { size: 11 },
              padding: 10,
              boxWidth: 12,
              boxHeight: 12,
            },
          },
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
  }, [data]);

  return (
    <div className="relative w-full" style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
