import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { EvaluationForm } from '../components/form';
import RiskLevelBadge from '../components/risk/RiskLevelBadge';
import ContentHeader from '../components/ui/ContentHeader';
import { Card } from '../components/widgets';
import { useAuth } from '../context/AuthContext';
import { useRisks } from '../context/RiskContext';
import { getRiskStatus } from '../utils/riskStatus';
import { API_ENDPOINTS, apiRequest } from '../config/api';

export default function MonthlyEvaluationForm() {
  const { riskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { risks, fetchRisks } = useRisks();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const risk = useMemo(() => {
    return risks.find((r) => r.id === riskId);
  }, [risks, riskId]);

  const evaluator = user?.name || 'Current User';
  const currentScore = risk?.score || 0;

  const handleAccept = async (payload) => {
    try {
      setIsSubmitting(true);
      // Save evaluation to database via evaluation endpoint
      await apiRequest(API_ENDPOINTS.risks.evaluation(riskId), {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      // Refresh risks to get updated data
      await fetchRisks(true, 'highest-risk');
      navigate('/evaluations');
    } catch (error) {
      console.error('Error saving evaluation:', error);
      alert('Terjadi kesalahan saat menyimpan evaluasi. Silakan coba lagi.');
      setIsSubmitting(false);
    }
  };

  const handleReject = async (payload) => {
    try {
      setIsSubmitting(true);
      // Save evaluation to database via evaluation endpoint (even if rejected)
      await apiRequest(API_ENDPOINTS.risks.evaluation(riskId), {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      // Refresh risks to get updated data
      await fetchRisks(true, 'highest-risk');
      navigate('/evaluations');
    } catch (error) {
      console.error('Error saving evaluation:', error);
      alert('Terjadi kesalahan saat menyimpan evaluasi. Silakan coba lagi.');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/evaluations');
  };

  if (!risk) {
    return (
      <>
        <ContentHeader
          title="Evaluasi Keberhasilan"
          breadcrumbs={[
            { label: 'Beranda', path: '/' },
            { label: 'Evaluasi Keberhasilan', path: '/evaluations' },
            { label: 'Formulir Evaluasi' },
          ]}
        />
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">Risk not found.</p>
          </div>
        </Card>
      </>
    );
  }

  // Check if risk status is "Planned" or "Need Improvement"
  const riskStatus = getRiskStatus(risk);

  if (riskStatus !== 'planned' && riskStatus !== 'not-finished') {
    return (
      <>
        <ContentHeader
          title="Evaluasi Keberhasilan"
          breadcrumbs={[
            { label: 'Beranda', path: '/' },
            { label: 'Evaluasi Keberhasilan', path: '/evaluations' },
            { label: 'Formulir Evaluasi' },
          ]}
        />
        <Card title={`Evaluasi Keberhasilan - ${risk.id}`} outline color="warning">
          <div className="space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Risiko ini belum mengajukan evaluasi keberhasilan. Silakan ajukan evaluasi dari halaman Rencana Mitigasi terlebih dahulu.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {riskStatus === 'open-risk' && (
                <button
                  type="button"
                  onClick={() => navigate(`/risks/${risk.id}/risk-analysis`)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#0c9361] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a7a4f] transition-colors"
                >
                  <i className="bi bi-clipboard-check" />
                  Analisis Risiko
                </button>
              )}
              {(riskStatus === 'analyzed' || riskStatus === 'not-finished') && (
                <button
                  type="button"
                  onClick={() => navigate(`/risks/${risk.id}/mitigation-plan`)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#0c9361] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a7a4f] transition-colors"
                >
                  <i className="bi bi-shield-check" />
                  Buat Rencana Mitigasi
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate('/evaluations')}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Kembali
              </button>
            </div>
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      <ContentHeader
        title="Evaluasi Keberhasilan"
        breadcrumbs={[
          { label: 'Beranda', path: '/' },
          { label: 'Evaluasi Keberhasilan', path: '/evaluations' },
          { label: 'Formulir Evaluasi' },
        ]}
      />

      <Card
        title={`Evaluasi Keberhasilan - ${risk.id}`}
        outline
        color="primary"
        headerExtra={
          <div className="flex items-center gap-3">
            <RiskLevelBadge score={currentScore} />
            <span className="text-sm text-gray-500 dark:text-gray-400">Saat Ini: {currentScore}/25</span>
          </div>
        }
      >
        <EvaluationForm
          risk={risk}
          evaluator={evaluator}
          onAccept={handleAccept}
          onReject={handleReject}
          onCancel={handleCancel}
          disabled={isSubmitting}
        />
      </Card>
    </>
  );
}
