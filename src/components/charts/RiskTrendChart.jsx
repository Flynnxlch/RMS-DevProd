import Chart from 'chart.js/auto';
import { useEffect, useMemo, useRef, useState } from 'react';

const crosshairPlugin = {
  id: 'crosshairLine',
  afterDraw(chart) {
    const { tooltip, ctx, chartArea } = chart;
    if (!tooltip || !tooltip.getActiveElements().length) return;
    const { top, bottom } = chartArea;
    const x = tooltip.caretX;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.stroke();
    ctx.restore();
  },
};

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

export default function RiskTrendChart({
  risks = [],
  height = 300,
  periodMonths = 1,
  startMonth = (() => { const n = new Date(); return { year: n.getFullYear(), month: n.getMonth() }; })(),
}) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const isDaily = periodMonths === 1;

  // Clock tick — triggers re-computation when date changes
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

  const { labels, avgScore, inherentRiskRatio } = useMemo(() => {
    const now = new Date();
    const selYear = startMonth.year;
    const selMonth = startMonth.month;
    const isCurrentMonth =
      selYear === now.getFullYear() && selMonth === now.getMonth();

    let labelsLocal = [];

    if (isDaily) {
      const lastDay = isCurrentMonth
        ? now.getDate()
        : new Date(selYear, selMonth + 1, 0).getDate();
      labelsLocal = Array.from({ length: lastDay }, (_, i) => {
        const d = new Date(selYear, selMonth, i + 1);
        d.setHours(0, 0, 0, 0);
        return d;
      });
    } else {
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
        if (isCurrentMonth && index === labelsLocal.length - 1) return now;
        return end;
      } else {
        const bucketIsCurrentMonth =
          startDate.getFullYear() === now.getFullYear() &&
          startDate.getMonth() === now.getMonth();
        return bucketIsCurrentMonth ? now : monthEnd(startDate);
      }
    }

    const avg = labelsLocal.map((startDate, idx) => {
      const end = bucketEnd(startDate, idx);
      const active = risks.filter((r) => {
        const created = new Date(r.createdAt || Date.now());
        if (Number.isNaN(created.getTime())) return false;
        return created <= end;
      });
      const assessed = active.filter((r) => {
        const score = r.score || r.inherentScore || r.currentScore || r.residualScore || r.residualScoreFinal || 0;
        return score > 0;
      });
      if (!assessed.length) return 0;
      const sum = assessed.reduce((acc, r) => {
        const score = r.score || r.inherentScore || r.currentScore || r.residualScore || r.residualScoreFinal || 0;
        return acc + score;
      }, 0);
      return Math.round((sum / assessed.length) * 10) / 10;
    });

    const inherentRatio = labelsLocal.map((startDate, idx) => {
      const end = bucketEnd(startDate, idx);
      const active = risks.filter((r) => {
        const created = new Date(r.createdAt || Date.now());
        if (Number.isNaN(created.getTime())) return false;
        return created <= end;
      });
      const withInherent = active.filter((r) => (r.inherentScore || 0) > 0);
      if (!withInherent.length) return 0;
      const sum = withInherent.reduce((acc, r) => acc + (r.inherentScore || 0), 0);
      return Math.round((sum / withInherent.length) * 10) / 10;
    });

    return { labels: labelsLocal, avgScore: avg, inherentRiskRatio: inherentRatio };
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

    if (!Chart.registry.plugins.get('crosshairLine')) {
      Chart.register(crosshairPlugin);
    }

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Avg risk score',
            data: avgScore,
            yAxisID: 'y',
            borderColor: '#0d6efd',
            backgroundColor: 'rgba(13, 110, 253, 0.10)',
            fill: true,
            tension: 0.35,
            pointRadius: 0,
            borderWidth: 3,
          },
          {
            label: 'Inherent Risk Ratio',
            data: inherentRiskRatio,
            yAxisID: 'y',
            borderColor: '#dc3545',
            backgroundColor: 'rgba(220, 53, 69, 0.10)',
            fill: false,
            tension: 0.35,
            pointRadius: 0,
            borderWidth: 2,
            borderDash: [6, 4],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 450 },
        events: ['mousemove', 'mousedown', 'mouseup', 'mouseout', 'touchstart', 'touchmove', 'touchend'],
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
            suggestedMax: 25,
            grid: { color: 'rgba(0,0,0,0.08)' },
            ticks: { color: '#6c757d' },
            title: {
              display: true,
              text: 'Score',
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
  }, [labels, avgScore, inherentRiskRatio, isDaily]);

  return (
    <div className="relative w-full" style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
