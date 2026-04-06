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

// Simplified 3-level grouping for the toggleable count lines
function getRiskGroup(score) {
  if (!score || score <= 0) return null;
  if (score <= 11) return 'low';
  if (score <= 15) return 'medium';
  return 'high';
}

// selectedLevels: array of 'high' | 'medium' | 'low' — which count lines to show
export default function RiskTrendChart({
  risks = [],
  height = 300,
  periodMonths = 1,
  startMonth = (() => { const n = new Date(); return { year: n.getFullYear(), month: n.getMonth() }; })(),
  selectedLevels = [],
}) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const isDaily = periodMonths === 1;

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

  const chartData = useMemo(() => {
    const now = new Date();
    const selYear = startMonth.year;
    const selMonth = startMonth.month;
    const isCurrentMonth = selYear === now.getFullYear() && selMonth === now.getMonth();

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

    // Score to use for a risk at a given bucket end:
    // mirrors Matrix priority — currentScore only after it was first set, inherentScore/score before that.
    function effectiveScore(r, end) {
      if (r.currentScore > 0) {
        if (r.currentScoreSetAt) {
          const setAt = new Date(r.currentScoreSetAt);
          if (!Number.isNaN(setAt.getTime()) && setAt <= end) return r.currentScore;
          // bucket is before currentScore was set — use pre-mitigation score
          return r.inherentScore || 0;
        }
        // legacy data with no currentScoreSetAt: keep original behaviour
        return r.currentScore;
      }
      // no currentScore at all — r.score safely equals the pre-mitigation score
      return r.score || r.inherentScore || 0;
    }

    const avgScore = labelsLocal.map((startDate, idx) => {
      const end = bucketEnd(startDate, idx);
      const active = risks.filter((r) => {
        const created = new Date(r.riskDate || r.createdAt || Date.now());
        return !Number.isNaN(created.getTime()) && created <= end;
      });
      const scored = active.filter((r) => effectiveScore(r, end) > 0);
      if (!scored.length) return 0;
      const sum = scored.reduce((acc, r) => acc + effectiveScore(r, end), 0);
      return Math.round((sum / scored.length) * 10) / 10;
    });

    const residualScoreAvg = labelsLocal.map((startDate, idx) => {
      const end = bucketEnd(startDate, idx);
      const getResidual = (r) => r.residualScoreFinal || r.residualScore || r.measurement?.residualScore || 0;
      const active = risks.filter((r) => {
        if (getResidual(r) <= 0) return false;
        const anchor = new Date(r.riskDate || r.createdAt || Date.now());
        return !Number.isNaN(anchor.getTime()) && anchor <= end;
      });
      if (!active.length) return 0;
      const sum = active.reduce((acc, r) => acc + getResidual(r), 0);
      return Math.round((sum / active.length) * 10) / 10;
    });

    function countByGroup(group, idx, startDate) {
      const end = bucketEnd(startDate, idx);
      return risks.filter((r) => {
        const created = new Date(r.riskDate || r.createdAt || Date.now());
        if (Number.isNaN(created.getTime()) || created > end) return false;
        const score = r.score || r.inherentScore || r.currentScore || r.residualScore || r.residualScoreFinal || 0;
        return getRiskGroup(score) === group;
      }).length;
    }

    const highCount   = labelsLocal.map((d, i) => countByGroup('high', i, d));
    const mediumCount = labelsLocal.map((d, i) => countByGroup('medium', i, d));
    const lowCount    = labelsLocal.map((d, i) => countByGroup('low', i, d));

    return { labels: labelsLocal, avgScore, residualScoreAvg, highCount, mediumCount, lowCount };
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

    const hasCountLines = selectedLevels.length > 0;

    const datasets = [
      {
        label: 'Skor rata-rata',
        data: chartData.avgScore,
        yAxisID: 'y',
        borderColor: '#0d6efd',
        backgroundColor: 'rgba(13, 110, 253, 0.10)',
        fill: true,
        tension: 0.35,
        pointRadius: 0,
        borderWidth: 3,
      },
      {
        label: 'Residual Score',
        data: chartData.residualScoreAvg,
        yAxisID: 'y',
        borderColor: '#20c997',
        backgroundColor: 'rgba(32, 201, 151, 0.08)',
        fill: false,
        tension: 0.35,
        pointRadius: 0,
        borderWidth: 2,
      },
    ];

    if (selectedLevels.includes('high')) {
      datasets.push({
        label: 'High Risk',
        data: chartData.highCount,
        yAxisID: 'y1',
        borderColor: '#dc3545',
        backgroundColor: 'rgba(220, 53, 69, 0.08)',
        fill: false,
        tension: 0.35,
        pointRadius: 0,
        borderWidth: 2,
        borderDash: [5, 3],
      });
    }
    if (selectedLevels.includes('medium')) {
      datasets.push({
        label: 'Medium Risk',
        data: chartData.mediumCount,
        yAxisID: 'y1',
        borderColor: '#ffc107',
        backgroundColor: 'rgba(255, 193, 7, 0.08)',
        fill: false,
        tension: 0.35,
        pointRadius: 0,
        borderWidth: 2,
        borderDash: [5, 3],
      });
    }
    if (selectedLevels.includes('low')) {
      datasets.push({
        label: 'Low Risk',
        data: chartData.lowCount,
        yAxisID: 'y1',
        borderColor: '#198754',
        backgroundColor: 'rgba(25, 135, 84, 0.08)',
        fill: false,
        tension: 0.35,
        pointRadius: 0,
        borderWidth: 2,
        borderDash: [5, 3],
      });
    }

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: { labels: chartData.labels, datasets },
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
                    day: 'numeric', month: 'short', year: 'numeric',
                  }).format(chartData.labels[idx]);
                }
                return fmtDateTitle(chartData.labels[idx]);
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
                isDaily ? fmtDateTick(chartData.labels[index]) : fmtMonthTick(chartData.labels[index]),
              maxTicksLimit: isDaily ? 31 : undefined,
            },
          },
          y: {
            position: 'left',
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
          y1: {
            display: hasCountLines,
            position: 'right',
            beginAtZero: true,
            grid: { drawOnChartArea: false },
            ticks: { color: '#6c757d', precision: 0 },
            title: {
              display: hasCountLines,
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
  }, [chartData, isDaily, selectedLevels]);

  return (
    <div className="relative w-full" style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
