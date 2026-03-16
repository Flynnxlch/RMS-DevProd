import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MitigationPlanForm } from '../components/form';
import RiskLevelBadge from '../components/risk/RiskLevelBadge';
import ContentHeader from '../components/ui/ContentHeader';
import NotificationPopup from '../components/ui/NotificationPopup';
import { Card } from '../components/widgets';
import { API_ENDPOINTS, apiRequest } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useRisks } from '../context/RiskContext';
import { getRiskStatus } from '../utils/riskStatus';

export default function MitigationPlan() {
  const { riskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { risks, updateRisk, refreshRisks } = useRisks();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ isOpen: false, type: 'error', title: '', message: '', autoClose: false, autoCloseDelay: 3000 });

  const risk = useMemo(() => {
    return risks.find((r) => r.id === riskId);
  }, [risks, riskId]);

  const handleSubmit = async (payload) => {
    try {
      setIsSubmitting(true);
      
      // Extract only mitigation fields for API
      const mitigationPayload = {
        handlingType: payload.handlingType,
        mitigationPlan: payload.mitigationPlan,
        mitigationOutput: payload.mitigationOutput,
        mitigationBudget: payload.mitigationBudget,
        mitigationActual: payload.mitigationActual,
        progressMitigation: payload.progressMitigation,
        realizationTarget: payload.realizationTarget,
        targetKpi: payload.targetKpi,
        inherentScore: payload.inherentScore,
        // Current Risk (after mitigation) - kondisi risiko terkini
        currentImpactLevel: payload.currentImpactLevel,
        currentProbabilityType: payload.currentProbabilityType,
        currentScore: payload.currentScore,
        currentLevel: payload.currentLevel,
      };

      await apiRequest(API_ENDPOINTS.risks.mitigation(riskId), {
        method: 'POST',
        body: JSON.stringify(mitigationPayload),
      });

      // Refresh risks from API
      await refreshRisks();
      navigate('/mitigations');
    } catch (error) {
      console.error('Error saving mitigation:', error);
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Gagal Menyimpan',
        message: 'Gagal menyimpan rencana mitigasi: ' + (error.message || 'Unknown error'),
      });
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/mitigations');
  };

  const handleRequestEvaluation = async (riskData) => {
    try {
      setIsSubmitting(true);
      
      // Update risk to set evaluationRequested flag
      const updatedRisk = {
        ...riskData,
        evaluationRequested: true,
        evaluationRequestedAt: new Date().toISOString(),
      };
      
      await updateRisk(updatedRisk);
      setNotification({
        isOpen: true,
        type: 'success',
        title: 'Berhasil',
        message: 'Evaluasi keberhasilan berhasil diajukan!',
        autoClose: true,
        autoCloseDelay: 2000,
      });
      setTimeout(() => {
        navigate('/evaluations');
      }, 2000);
    } catch (error) {
      console.error('Error requesting evaluation:', error);
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Gagal',
        message: 'Terjadi kesalahan saat mengajukan evaluasi. Silakan coba lagi.',
      });
      setIsSubmitting(false);
    }
  };

  // RISK_CHAMPION can only plan mitigations for their own cabang
  const champCabangBlocked =
    user?.userRole === 'RISK_CHAMPION' &&
    user?.regionCabang &&
    user.regionCabang !== 'KPS' &&
    risk?.regionCode &&
    risk.regionCode !== user.regionCabang;

  if (champCabangBlocked) {
    return (
      <>
        <ContentHeader
          title="Rencana Mitigasi"
          breadcrumbs={[
            { label: 'Beranda', path: '/' },
            { label: 'Rencana Mitigasi', path: '/mitigations' },
            { label: 'Akses Ditolak' },
          ]}
        />
        <Card>
          <div className="text-center py-10">
            <i className="bi bi-shield-x text-4xl text-red-400 mb-3 block" />
            <p className="text-sm font-semibold text-gray-800 dark:text-white mb-1">Akses Ditolak</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Kamu hanya dapat mengakses rencana mitigasi untuk risiko di cabangmu ({user.regionCabang}).
            </p>
            <button
              type="button"
              onClick={() => navigate('/mitigations')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0c9361] rounded-lg hover:bg-[#0a7a4f] transition-colors"
            >
              Kembali ke Daftar Mitigasi
            </button>
          </div>
        </Card>
      </>
    );
  }

  // RISK_ASSESSMENT has no access to create or edit mitigation plans
  if (user?.userRole === 'RISK_ASSESSMENT') {
    return (
      <>
        <ContentHeader
          title="Rencana Mitigasi"
          breadcrumbs={[
            { label: 'Beranda', path: '/' },
            { label: 'Rencana Mitigasi', path: '/mitigations' },
            { label: 'Akses Ditolak' },
          ]}
        />
        <Card>
          <div className="text-center py-10">
            <i className="bi bi-shield-x text-4xl text-red-400 mb-3 block" />
            <p className="text-sm font-semibold text-gray-800 dark:text-white mb-1">Akses Ditolak</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Role Risk Assessment tidak memiliki akses ke Rencana Mitigasi.
            </p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0c9361] rounded-lg hover:bg-[#0a7a4f] transition-colors"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </Card>
      </>
    );
  }

  if (!risk) {
    return (
      <>
        <ContentHeader
          title="Rencana Mitigasi"
          breadcrumbs={[
            { label: 'Beranda', path: '/' },
            { label: 'Rencana Mitigasi', path: '/mitigations' },
            { label: 'Rencana Mitigasi' },
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

  // Check if risk status is "Analyzed", "Planned", or "Need Improvement"
  const riskStatus = getRiskStatus(risk);
  const canCreateMitigation = riskStatus === 'analyzed' || riskStatus === 'planned' || riskStatus === 'not-finished';

  if (!canCreateMitigation) {
    return (
      <>
        <ContentHeader
          title="Rencana Mitigasi"
          breadcrumbs={[
            { label: 'Beranda', path: '/' },
            { label: 'Rencana Mitigasi', path: '/mitigations' },
            { label: 'Rencana Mitigasi' },
          ]}
        />
        <Card title={`Rencana Mitigasi - ${risk.id}`} outline color="warning">
          <div className="space-y-3">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {riskStatus === 'open-risk' 
                ? 'Risiko ini belum dianalisis. Silakan jalankan Analisis Risiko terlebih dahulu.'
                : 'Rencana mitigasi hanya dapat dibuat untuk risiko dengan status "Dianalisis" atau "Belum Selesai".'}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {riskStatus === 'open-risk' && (
                <Link
                  to={`/risks/${risk.id}/risk-analysis`}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#0c9361] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0a7a4f] transition-colors"
                >
                  <i className="bi bi-clipboard-check" />
                  Analisis Risiko
                </Link>
              )}
              <button
                type="button"
                onClick={() => navigate('/mitigations')}
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
        title="Rencana Mitigasi"
        breadcrumbs={[
          { label: 'Beranda', path: '/' },
          { label: 'Rencana Mitigasi', path: '/mitigations' },
          { label: 'Rencana Mitigasi' },
        ]}
      />

      <Card
        title={`Rencana Mitigasi - ${risk.id}`}
        outline
        color="primary"
        headerExtra={
          <div className="flex items-center gap-3">
            <RiskLevelBadge score={risk.score} />
            <span className="text-sm text-gray-500 dark:text-gray-400">Skor: {risk.score}/25</span>
          </div>
        }
      >
        <MitigationPlanForm
          risk={risk}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          onRequestEvaluation={handleRequestEvaluation}
          disabled={isSubmitting}
        />
      </Card>

      {/* Notification Popup */}
      <NotificationPopup
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        autoClose={notification.autoClose}
        autoCloseDelay={notification.autoCloseDelay}
      />
    </>
  );
}
