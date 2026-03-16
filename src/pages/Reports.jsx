import { useMemo } from 'react';
import RiskScoreBar from '../components/risk/RiskScoreBar';
import ContentHeader from '../components/ui/ContentHeader';
import { Card } from '../components/widgets';
import { useRisks } from '../context/RiskContext';
import { getRiskSummary, RISK_LEVELS } from '../utils/risk';

export default function Reports() {
  const { risks } = useRisks();
  const summary = useMemo(() => getRiskSummary(risks), [risks]);

  return (
    <>
      <ContentHeader
        title="Laporan & Analitik"
        breadcrumbs={[
          { label: 'Beranda', path: '/' },
          { label: 'Laporan & Analitik' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7">
          <Card title="Distribusi Tingkat Risiko">
            <div className="space-y-3">
              {RISK_LEVELS.map((lvl) => {
                const count = summary.counts[lvl.key] || 0;
                const denom = summary.assessedTotal || 0;
                const pct = denom ? Math.round((count / denom) * 100) : 0;
                return (
                  <div key={lvl.key} className="flex items-center gap-3">
                    <div className="w-28 text-sm font-semibold text-gray-700 dark:text-gray-200">{lvl.label}</div>
                    <div className="flex-1">
                      <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                        <div className={lvl.barClass} style={{ width: `${pct}%`, height: '100%' }} />
                      </div>
                    </div>
                    <div className="w-24 text-right text-sm text-gray-700 dark:text-gray-200">
                      {count} ({pct}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-5">
          <Card title="Skor Risiko Rata-rata">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-semibold text-gray-700 dark:text-gray-200">{summary.avgScore}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Skor rata-rata dari semua risiko</div>
              </div>
              <RiskScoreBar score={summary.avgScore} className="w-48" />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}


