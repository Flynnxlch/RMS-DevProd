import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import RiskCard from '../components/risk/RiskCard';
import ContentHeader from '../components/ui/ContentHeader';
import { Card } from '../components/widgets';
import { useRisks } from '../context/RiskContext';
import { sortRisksByScoreDesc } from '../utils/risk';
import { getRiskStatus } from '../utils/riskStatus';

export default function MonthlyEvaluations() {
  const { risks } = useRisks();
  const navigate = useNavigate();

  // Menampilkan risiko yang sudah mengajukan evaluasi keberhasilan
  // Kecuali yang statusnya sudah "Mitigated" (evaluationStatus === 'effective')
  const list = useMemo(() => {
    return sortRisksByScoreDesc(risks).filter((r) => {
      const status = getRiskStatus(r);
      // Filter risiko yang sudah mengajukan evaluasi (ada flag evaluationRequested)
      // Tapi tidak menampilkan yang sudah "Monitor" atau "Mitigate"
      return r.evaluationRequested === true && status !== 'monitor' && status !== 'mitigate';
    });
  }, [risks]);

  return (
    <>
      <ContentHeader
        title="Evaluasi Keberhasilan"
        breadcrumbs={[
          { label: 'Beranda', path: '/' },
          { label: 'Evaluasi Keberhasilan' },
        ]}
      />

      <Card title="Risiko yang Telah Mengajukan Evaluasi Keberhasilan">
        <div className="space-y-3">
          {list.map((r) => (
            <div key={r.id} className="space-y-2">
              <RiskCard
                risk={r}
                showLocation={true}
                showEvaluationMonth={false}
                hideResidualRiskLevel={true}
                onClick={() => navigate(`/risks/${r.id}/evaluation`)}
              />
              {r.evaluationRequestedAt && (
                <div className="text-xs text-gray-500 dark:text-gray-400 pl-2">
                  Diajukan pada: {new Date(r.evaluationRequestedAt).toLocaleString('id-ID')}
                </div>
              )}
            </div>
          ))}
          {!list.length && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Belum ada risiko yang mengajukan evaluasi keberhasilan. Ajukan evaluasi dari halaman Rencana Mitigasi.
            </div>
          )}
        </div>
      </Card>
    </>
  );
}


