import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import RiskCard from '../components/risk/RiskCard';
import ContentHeader from '../components/ui/ContentHeader';
import { Card } from '../components/widgets';
import { useRisks } from '../context/RiskContext';
import { sortRisksByScoreDesc } from '../utils/risk';
import { getRiskStatus } from '../utils/riskStatus';

export default function Mitigations() {
  const { risks } = useRisks();
  const navigate = useNavigate();

  // Only show risks with "Mitigate" status
  const eligible = useMemo(() => {
    return sortRisksByScoreDesc(risks).filter((r) => getRiskStatus(r) === 'mitigate');
  }, [risks]);

  return (
    <>
      <ContentHeader
        title="Rencana Mitigasi"
        breadcrumbs={[
          { label: 'Beranda', path: '/' },
          { label: 'Rencana Mitigasi' },
        ]}
      />

      <Card title="Ringkasan Mitigasi">
        <div className="space-y-3">
          {eligible.map((r) => (
            <RiskCard
              key={r.id}
              risk={r}
              showLocation={false}
              showEvaluationMonth={false}
              onClick={() => navigate(`/risks/${r.id}/mitigation-plan`)}
            />
          ))}
          {!eligible.length && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Tidak ada risiko dengan status "Mitigate" saat ini.
            </div>
          )}
        </div>
      </Card>
    </>
  );
}


