import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { RiskAnalysisForm } from '../components/form';
import RiskLevelBadge from '../components/risk/RiskLevelBadge';
import ContentHeader from '../components/ui/ContentHeader';
import NotificationPopup from '../components/ui/NotificationPopup';
import { Card } from '../components/widgets';
import { useRisks } from '../context/RiskContext';
import { API_ENDPOINTS, apiRequest } from '../config/api';
import { computeRiskScore } from '../utils/risk';

export default function InherentRiskEvaluation() {
  const { riskId } = useParams();
  const navigate = useNavigate();
  const { risks, refreshRisks } = useRisks();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ isOpen: false, type: 'error', title: '', message: '' });

  const risk = useMemo(() => {
    return risks.find((r) => r.id === riskId);
  }, [risks, riskId]);

  const handleSubmit = async (payload) => {
    try {
      setIsSubmitting(true);
      
      // Extract only analysis fields for API
      const analysisPayload = {
        existingControl: payload.existingControl,
        controlType: payload.controlType,
        controlLevel: payload.controlLevel,
        controlEffectivenessAssessment: payload.controlEffectivenessAssessment,
        estimatedExposureDate: payload.estimatedExposureDate,
        keyRiskIndicator: payload.keyRiskIndicator,
        kriUnit: payload.kriUnit,
        kriValueSafe: payload.kriValueSafe,
        kriValueCaution: payload.kriValueCaution,
        kriValueDanger: payload.kriValueDanger,
        impactDescription: payload.impactDescription,
        impactLevel: payload.impactLevel,
        possibilityType: payload.possibilityType,
        possibilityDescription: payload.possibilityDescription,
        residualImpactDescription: payload.residualImpactDescription,
        residualImpactLevel: payload.residualImpactLevel,
        residualPossibilityType: payload.residualPossibilityType,
        residualPossibilityDescription: payload.residualPossibilityDescription,
        // Kirim skor & level yang sudah dihitung di frontend (RiskMatrix)
        inherentScore: payload.inherentScore,
        inherentLevel: payload.inherentLevel,
        residualScore: payload.residualScore,
        residualLevel: payload.residualLevel,
      };

      await apiRequest(API_ENDPOINTS.risks.analysis(riskId), {
        method: 'POST',
        body: JSON.stringify(analysisPayload),
      });

      // Refresh risks from API
      await refreshRisks();
      navigate('/risks');
    } catch (error) {
      console.error('Error saving analysis:', error);
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Gagal Menyimpan',
        message: 'Gagal menyimpan analisis: ' + (error.message || 'Unknown error'),
      });
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/risks');
  };

  // Calculate inherent score for display in header
  const inherentScore = useMemo(() => {
    if (!risk) return 0;
    return computeRiskScore({ 
      possibility: risk.possibilityType || 3, 
      impactLevel: risk.impactLevel || 4 
    });
  }, [risk]);

  if (!risk) {
    return (
      <>
        <ContentHeader
          title="Analisis Risiko"
          breadcrumbs={[
            { label: 'Beranda', path: '/' },
            { label: 'Register Risiko', path: '/risks' },
            { label: 'Analisis Risiko' },
          ]}
        />
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">Risiko tidak ditemukan.</p>
          </div>
        </Card>
      </>
    );
  }

  // Check if risk status is "Open Risk" (score = 0)
  const isOpenRisk = (risk.score || 0) <= 0;
  if (!isOpenRisk) {
    return (
      <>
        <ContentHeader
          title="Analisis Risiko"
          breadcrumbs={[
            { label: 'Beranda', path: '/' },
            { label: 'Register Risiko', path: '/risks' },
            { label: 'Analisis Risiko' },
          ]}
        />
        <Card title={`Analisis Risiko - ${risk.id}`} outline color="warning">
          <div className="space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Risiko ini sudah dianalisis. Analisis risiko hanya dapat dilakukan pada risiko dengan status <span className="font-semibold">Risiko Terbuka</span>.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('/risks')}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Kembali ke Register Risiko
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
        title="Analisis Risiko"
        breadcrumbs={[
          { label: 'Beranda', path: '/' },
          { label: 'Register Risiko', path: '/risks' },
          { label: 'Analisis Risiko' },
        ]}
      />

      <Card
        title={`Analisis Risiko - ${risk.id}`}
        outline
        color="primary"
      >
        <RiskAnalysisForm
          risk={risk}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </Card>

      {/* Notification Popup */}
      <NotificationPopup
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
    </>
  );
}
