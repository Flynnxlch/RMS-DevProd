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

  // Debug log to trace eligible mitigation cards rendering
  console.log('[Mitigations] total risks:', risks?.length, risks);

  // Show risks that can have mitigation plans:
  // - "Analyzed" (has analysis but no mitigation plan yet)
  // - "Planned" (has mitigation plan but hasn't been evaluated yet)
  // - "Need Improvement" (has evaluation but not effective - evaluationStatus !== 'effective')
  // Exclude risks that have been accepted (evaluationStatus === 'effective')
  const eligible = useMemo(() => {
    return sortRisksByScoreDesc(risks).filter((r) => {
      const status = getRiskStatus(r);
      const evaluationStatus = r.evaluationStatus;
      
      // Exclude risks that have been accepted (effective)
      if (evaluationStatus === 'effective') {
        return false;
      }
      
      // Show risks that are analyzed, planned, or need-improvement (rejected evaluation)
      return status === 'analyzed' || status === 'planned' || status === 'need-improvement';
    });
  }, [risks]);

  console.log('[Mitigations] eligible for mitigation:', eligible?.length, eligible);

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
              Belum ada risiko yang dinilai. Analisis risiko terlebih dahulu, lalu buat rencana mitigasinya.
            </div>
          )}
        </div>
      </Card>
    </>
  );
}


