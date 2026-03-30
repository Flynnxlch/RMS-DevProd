import Chart from 'chart.js/auto';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getRiskStatus } from '../../utils/riskStatus';

function monthEnd(startDate) {
  const d = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}

function fmtMonthTick(dateObj) {
  const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
  if (Number.isNaN(d.getTime())) return String(dateObj);
  const month = new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(d);
  const year = new Intl.DateTimeFormat('en-GB', { year: '2-digit' }).format(d);
  return `${month} '${year}`;
}

function fmtDateTitle(dateObj) {
  const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
  if (Number.isNaN(d.getTime())) return String(dateObj);
  return new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' }).format(d);
}

function fmtDateTick(dateObj) {
  const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
  if (Number.isNaN(d.getTime())) return String(dateObj);
  return `${d.getDate()} ${new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(d)}`;
}

export default function RiskStatusTrendChart({
  risks = [],
  height = 220,
  periodMonths = 1,
  startMonth = (() => { const n = new Date(); return { year: n.getFullYear(), month: n.getMonth() }; })(),
}) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const isDaily = periodMonths === 1;

  // Clock tick — only meaningful when the selected window includes today
  const [clockKey, setClockKey] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  });

  useEffect(() => {
    const interval = isDaily ? 60_000 : 30_000;
    const id = setInterval(() => {
      const d = new Date();
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      setClockKey((prev) => (prev === key ? prev : key));
    }, interval);
    return () => clearInterval(id);
  }, [isDaily]);

  const { labels, analyzedCount, plannedCount } = useMemo(() => {
    const now = new Date();
    const selYear = startMonth.year;
    const selMonth = startMonth.month;
    const isCurrentMonth =
      selYear === now.getFullYear() && selMonth === now.getMonth();

    let labelsLocal = [];

    if (isDaily) {
      // Daily buckets: day 1 → last day of month (or today if current month)
      const lastDay = isCurrentMonth
        ? now.getDate()
        : new Date(selYear, selMonth + 1, 0).getDate();
      labelsLocal = Array.from({ length: lastDay }, (_, i) => {
        const d = new Date(selYear, selMonth, i + 1);
        d.setHours(0, 0, 0, 0);
        return d;
      });
    } else {
      // Monthly buckets: startMonth → startMonth + periodMonths - 1
      labelsLocal = Array.from({ length: periodMonths }, (_, i) => {
        const d = new Date(selYear, selMonth + i, 1);
        d.setHours(0, 0, 0, 0);
        return d;
      });
    }

    function bucketEnd(startDate, index) {
      if (isDaily) {
        const end = new Date(startDate);
        end.setHours(23, 59, 59, 999);
        // Last bucket of current month → cap at now
        if (isCurrentMonth && index === labelsLocal.length - 1) return now;
        return end;
      } else {
        const bucketIsCurrentMonth =
          startDate.getFullYear() === now.getFullYear() &&
          startDate.getMonth() === now.getMonth();
        return bucketIsCurrentMonth ? now : monthEnd(startDate);
      }
    }

    const analyzed = labelsLocal.map((start, idx) => {
      const end = bucketEnd(start, idx);
      return risks.filter((r) => {
        const created = new Date(r.createdAt || Date.now());
        if (Number.isNaN(created.getTime())) return false;
        if (created > end) return false;
        return getRiskStatus(r) === 'perlu-pengukuran';
      }).length;
    });

    const planned = labelsLocal.map((start, idx) => {
      const end = bucketEnd(start, idx);
      return risks.filter((r) => {
        const created = new Date(r.createdAt || Date.now());
        if (Number.isNaN(created.getTime())) return false;
        if (created > end) return false;
        return getRiskStatus(r) === 'planned';
      }).length;
    });

    return { labels: labelsLocal, analyzedCount: analyzed, plannedCount: planned };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [risks, periodMonths, startMonth, isDaily, clockKey]);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Analyzed',
            data: analyzedCount,
            borderColor: '#0d6efd',
            backgroundColor: 'rgba(13, 110, 253, 0.12)',
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            borderWidth: 3,
          },
          {
            label: 'Planned',
            data: plannedCount,
            borderColor: '#ffc107',
            backgroundColor: 'rgba(255, 193, 7, 0.10)',
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            borderWidth: 3,
          },
        ],
      },
      options: {
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
              title: (items) => {
                const idx = items?.[0]?.dataIndex ?? 0;
                if (isDaily) {
                  return new Intl.DateTimeFormat('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  }).format(labels[idx]);
                }
                return fmtDateTitle(labels[idx]);
              },
            },
          },
        },
        interaction: { mode: 'index', intersect: false, axis: 'x' },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#6c757d',
              callback: (_value, index) =>
                isDaily ? fmtDateTick(labels[index]) : fmtMonthTick(labels[index]),
              maxTicksLimit: isDaily ? 31 : undefined,
            },
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.08)' },
            ticks: { color: '#6c757d', precision: 0 },
            title: {
              display: true,
              text: 'Count',
              color: '#6c757d',
              font: { size: 12, weight: '600' },
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
  }, [labels, analyzedCount, plannedCount, isDaily]);

  return (
    <div className="relative w-full" style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
