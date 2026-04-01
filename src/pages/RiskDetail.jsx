import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { RiskForm } from '../components/form';
import EvaluationForm from '../components/form/EvaluationForm';
import MitigationPlanForm from '../components/form/MitigationPlanForm';
import RiskAnalysisForm from '../components/form/RiskAnalysisForm';
import ApprovalPanel from '../components/risk/ApprovalPanel';
import RiskLevelBadge from '../components/risk/RiskLevelBadge';
import ContentHeader from '../components/ui/ContentHeader';
import NotificationPopup from '../components/ui/NotificationPopup';
import { Card } from '../components/widgets';
import { API_ENDPOINTS, apiRequest } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useRisks } from '../context/RiskContext';
import { getCabangCode } from '../utils/cabang';
import { getRiskStatus, RISK_STATUS_CONFIG } from '../utils/riskStatus';
import { logger } from '../utils/logger';

const TABS = [
  { id: 'identified', label: 'Risk Identified', icon: 'bi-clipboard-data' },
  { id: 'analysis', label: 'Risk Analysis', icon: 'bi-graph-up' },
  { id: 'planning', label: 'Mitigation Planning', icon: 'bi-shield-check' },
  { id: 'measurement', label: 'Pengukuran Risiko', icon: 'bi-rulers' },
  { id: 'evaluation', label: 'Evaluasi Keberhasilan', icon: 'bi-calendar-check' },
];

export default function RiskDetail() {
  const { riskId } = useParams();
  const navigate = useNavigate();
  const { risks, updateRisk, refreshRisks } = useRisks();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('identified');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [notification, setNotification] = useState({ isOpen: false, type: 'error', title: '', message: '' });

  const risk = useMemo(() => {
    return risks.find((r) => r.id === riskId);
  }, [risks, riskId]);

  // Calculate risk status and available tabs (must be before early return to maintain hook order)
  // All hooks and computations must be done before any conditional return
  const riskStatus = risk ? getRiskStatus(risk) : null;
  const statusConfig = riskStatus 
    ? (RISK_STATUS_CONFIG[riskStatus] || RISK_STATUS_CONFIG['open-risk']) 
    : RISK_STATUS_CONFIG['open-risk'];

  // Determine which tabs to show based on status (only if risk exists)
  // hasAnalysis also checks data presence — wizard-registered risks have analysis data at risiko-baru status
  const hasAnalysis = riskStatus
    ? ['planned', 'monitor', 'mitigate', 'need-improvement', 'perlu-pengukuran'].includes(riskStatus) ||
      !!(risk?.existingControl || risk?.keyRiskIndicator || risk?.controlType || (risk?.impactLevel > 0) || (risk?.possibilityType > 0))
    : false;
  // Planning tab only shows when mitigation plan data has actually been submitted
  const hasPlanning = !!(risk?.mitigationPlan && risk.mitigationPlan.trim().length > 0);
  const hasMeasurementData = !!(risk?.hasMeasurement || risk?.measurement);
  // Evaluation tab only shows when an evaluation has been submitted
  const hasEvaluation = !!(risk?.evaluationStatus);

  const availableTabs = useMemo(() => {
    if (!riskStatus) return [TABS[0]]; // Return only 'identified' tab if no risk
    return TABS.filter((tab) => {
      if (tab.id === 'identified') return true;
      if (tab.id === 'analysis') return hasAnalysis;
      if (tab.id === 'planning') return hasPlanning;
      if (tab.id === 'measurement') return hasMeasurementData;
      if (tab.id === 'evaluation') return hasEvaluation;
      return false;
    });
  }, [riskStatus, hasAnalysis, hasPlanning, hasMeasurementData, hasEvaluation]);

  // Ensure active tab is available (moved to useEffect to avoid state update during render)
  // This hook must be called before any early return to maintain hook order
  // Always call this hook, but only update state if risk exists
  useEffect(() => {
    if (risk && availableTabs.length > 0 && !availableTabs.find((t) => t.id === activeTab)) {
      setActiveTab('identified');
    }
  }, [risk, activeTab, availableTabs]);

  // Early return AFTER all hooks have been called
  if (!risk) {
    return (
      <>
        <ContentHeader
          title="Detail Risiko"
          breadcrumbs={[
            { label: 'Beranda', path: '/' },
            { label: 'Semua Risiko', path: '/risks' },
            { label: 'Detail' },
          ]}
        />
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">Risiko tidak ditemukan.</p>
            <button
              type="button"
              onClick={() => navigate('/risks')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#0c9361] text-white rounded-lg hover:bg-[#0a7a4f] transition-colors"
            >
              Kembali ke Semua Risiko
            </button>
          </div>
        </Card>
      </>
    );
  }

  const handleEditSubmit = async (payload) => {
    try {
      if (activeTab === 'identified') {
        // Update risk basic info — include riskDate so it can be changed via the edit form
        await updateRisk({ ...payload, id: risk.id, riskDate: payload.riskDate || null });
        await refreshRisks();
      } else if (activeTab === 'analysis') {
        // Save analysis via API — only Bagian 1 (controls) and Bagian 2 (KRI).
        // Bagian 3 (measurement scores) is managed via the dedicated Pengukuran Risiko menu.
        const analysisPayload = {
          existingControl: payload.existingControl,
          controlType: payload.controlType,
          controlLevel: payload.controlLevel,
          controlEffectivenessAssessment: payload.controlEffectivenessAssessment,
          estimatedExposureDate: payload.estimatedExposureDate,
          estimatedExposureDateEnd: payload.estimatedExposureDateEnd,
          keyRiskIndicator: payload.keyRiskIndicator,
          kriUnit: payload.kriUnit,
          kriValueSafe: payload.kriValueSafe,
          kriValueCaution: payload.kriValueCaution,
          kriValueDanger: payload.kriValueDanger,
        };
        
        await apiRequest(API_ENDPOINTS.risks.analysis(risk.id), {
          method: 'POST',
          body: JSON.stringify(analysisPayload),
        });
        
        // Refresh risks
        await refreshRisks();
      } else if (activeTab === 'planning') {
        // Save mitigation via API
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
        
        await apiRequest(API_ENDPOINTS.risks.mitigation(risk.id), {
          method: 'POST',
          body: JSON.stringify(mitigationPayload),
        });
        
        // Refresh risks
        await refreshRisks();
      }
      
      setIsEditModalOpen(false);
    } catch (error) {
      logger.error('Error saving:', error);
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Gagal Menyimpan',
        message: 'Gagal menyimpan: ' + (error.message || 'Unknown error'),
      });
    }
  };

  const handleEditCancel = () => {
    setIsEditModalOpen(false);
  };

  const renderEditForm = () => {
    switch (activeTab) {
      case 'identified':
        return (
          <RiskForm
            initial={{
              ...risk,
              // Ensure dropdown values match existing data
              organization: risk.organization || 'Corporate',
              division: risk.division || '',
              category: risk.category || risk.riskCategory || '',
              riskType: risk.riskType || '',
              regionCode: risk.regionCode || 'KPS',
              riskDate: risk.riskDate || risk.createdAt || null,
            }}
            onSubmit={handleEditSubmit}
            submitLabel="Simpan Perubahan"
            simplified={true}
          />
        );
      case 'analysis':
        return (
          <RiskAnalysisForm
            risk={risk}
            onSubmit={handleEditSubmit}
            onCancel={handleEditCancel}
            hideMeasurementSection={true}
          />
        );
      case 'planning':
        return (
          <MitigationPlanForm
            risk={risk}
            onSubmit={handleEditSubmit}
            onCancel={handleEditCancel}
          />
        );
      case 'measurement':
        return null;
      case 'evaluation':
        return (
          <EvaluationForm
            risk={risk}
            evaluator={risk.evaluator || 'Current User'}
            onAccept={handleEditSubmit}
            onReject={handleEditSubmit}
            onCancel={handleEditCancel}
          />
        );
      default:
        return null;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'identified':
        return (
          <div className="space-y-4">
            {user?.userRole === 'RISK_ASSESSMENT' && (
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0d6efd] rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <i className="bi bi-pencil"></i>
                  Edit
                </button>
              </div>
            )}
            {/* Nama Perusahaan & Divisi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Nama Perusahaan</label>
                <p className="text-sm text-gray-900 dark:text-white">{risk.organization || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Divisi</label>
                <p className="text-sm text-gray-900 dark:text-white">{risk.division || 'N/A'}</p>
              </div>
            </div>

            {/* Sasaran & Cabang */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Sasaran</label>
                <p className="text-sm text-gray-900 dark:text-white">{risk.target || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Cabang</label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {risk.regionCode ? getCabangCode(risk.regionCode) : 'N/A'}
                </p>
              </div>
            </div>

            {/* Tanggal Risiko */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tanggal Risiko</label>
              <p className="text-sm text-gray-900 dark:text-white">
                {risk.riskDate
                  ? new Date(risk.riskDate).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
                  : new Date(risk.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
            </div>

            {/* Peristiwa Risiko */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Peristiwa Risiko</label>
              <p className="text-sm text-gray-900 dark:text-white">{risk.riskEvent || risk.title || 'N/A'}</p>
            </div>

            {/* Deskripsi Peristiwa Risiko */}
            {risk.riskEventDescription && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Deskripsi Peristiwa Risiko</label>
                <p className="text-sm text-gray-900 dark:text-white">{risk.riskEventDescription}</p>
              </div>
            )}

            {/* Kategori */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Kategori</label>
              <p className="text-sm text-gray-900 dark:text-white">{risk.category || risk.riskCategory || 'N/A'}</p>
            </div>

            {/* Penyebab Risiko */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Penyebab Risiko</label>
              <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{risk.riskCause || 'N/A'}</p>
            </div>

            {/* Kategori Resiko */}
            {risk.riskCategoryType && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Kategori Resiko</label>
                <p className="text-sm text-gray-900 dark:text-white">{risk.riskCategoryType}</p>
              </div>
            )}

            {/* Deskripsi Dampak */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Deskripsi Dampak</label>
              <p className="text-sm text-gray-900 dark:text-white">{risk.riskImpactExplanation || 'N/A'}</p>
            </div>
          </div>
        );

      case 'analysis': {
        // Format ISO date string to "Bulan Tahun" (e.g. "Januari 2025")
        const formatMonthDisplay = (dateString) => {
          if (!dateString) return null;
          try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return null;
            return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
          } catch {
            return null;
          }
        };

        return (
          <div className="space-y-6">
            {user?.userRole === 'RISK_ASSESSMENT' && (
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0d6efd] rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <i className="bi bi-pencil"></i>
                  Edit
                </button>
              </div>
            )}

            {/* Bagian 1: Kontrol yang Ada */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/40">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Bagian 1: Kontrol yang Ada</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Kontrol yang Ada</label>
                  <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                    {risk.existingControl && risk.existingControl.trim() ? risk.existingControl : 'N/A'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Jenis Kontrol</label>
                    <p className="text-sm text-gray-900 dark:text-white">{risk.controlType || 'N/A'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Level Kontrol</label>
                    <p className="text-sm text-gray-900 dark:text-white">{risk.controlLevel || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Penilaian Efektivitas Kontrol</label>
                  <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                    {risk.controlEffectivenessAssessment && risk.controlEffectivenessAssessment.trim() ? risk.controlEffectivenessAssessment : 'N/A'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Perkiraan waktu terpapar resiko</label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {formatMonthDisplay(risk.estimatedExposureDate) && formatMonthDisplay(risk.estimatedExposureDateEnd)
                      ? `${formatMonthDisplay(risk.estimatedExposureDate)} s/d ${formatMonthDisplay(risk.estimatedExposureDateEnd)}`
                      : formatMonthDisplay(risk.estimatedExposureDate) || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Bagian 2: Key Risk Indicator */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/40">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Bagian 2: Key Risk Indicator</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Key Risk Indicator</label>
                  <p className="text-sm text-gray-900 dark:text-white">{risk.keyRiskIndicator || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Unit Satuan KRI</label>
                  <p className="text-sm text-gray-900 dark:text-white">{risk.kriUnit || 'N/A'}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Value Aman</label>
                    <p className="text-sm text-gray-900 dark:text-white">{risk.kriValueSafe || 'N/A'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Value Hati-Hati</label>
                    <p className="text-sm text-gray-900 dark:text-white">{risk.kriValueCaution || 'N/A'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Value Bahaya</label>
                    <p className="text-sm text-gray-900 dark:text-white">{risk.kriValueDanger || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        );
      }

      case 'planning': {
        return (
          <div className="space-y-4">
            {user?.userRole === 'RISK_ASSESSMENT' && (
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0d6efd] rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <i className="bi bi-pencil"></i>
                  Edit
                </button>
              </div>
            )}
            {/* Bagian 1 */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Jenis Penanganan</label>
                <p className="text-sm text-gray-900 dark:text-white">{risk.mitigationHandlingType || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Rencana Mitigasi Risiko</label>
                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{risk.mitigationPlan || risk.mitigation || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Output Realisasi Mitigasi</label>
                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{risk.mitigationOutput || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Anggaran Biaya Mitigasi Risiko</label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {(() => {
                      if (!risk.mitigationBudget || risk.mitigationBudget === 0) return 'N/A';
                      try {
                        return new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(risk.mitigationBudget);
                      } catch {
                        return 'N/A';
                      }
                    })()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Realisasi Biaya Mitigasi Risiko</label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {(() => {
                      if (!risk.mitigationActual || risk.mitigationActual === 0) return 'N/A';
                      try {
                        return new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(risk.mitigationActual);
                      } catch {
                        return 'N/A';
                      }
                    })()}
                  </p>
                </div>
              </div>
              {risk.mitigationBudget && risk.mitigationActual && (
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="w-14 h-14 rounded-full border-4 border-blue-200 dark:border-blue-900/40 flex items-center justify-center relative">
                    {(() => {
                      const budget = risk.mitigationBudget || 0;
                      const actual = risk.mitigationActual || 0;
                      const pct = budget > 0 ? Math.min(100, Math.round((actual / budget) * 100)) : 0;
                      return (
                        <>
                          <svg className="absolute inset-0" viewBox="0 0 36 36">
                            <path
                              className="text-gray-200 dark:text-gray-700"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32"
                            />
                            <path
                              className="text-blue-500 dark:text-blue-400"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              strokeDasharray={`${pct},100`}
                              d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32"
                              strokeLinecap="round"
                              transform="rotate(-90 18 18)"
                            />
                          </svg>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{pct}%</span>
                        </>
                      );
                    })()}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    <div className="font-semibold text-gray-900 dark:text-white">Realisasi Anggaran</div>
                    <div>Menunjukkan persentase realisasi terhadap anggaran.</div>
                  </div>
                </div>
              )}
            </div>

            {/* Bagian 2: Deskripsi Tindak Lanjut */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
              <div className="text-sm font-semibold text-gray-900 dark:text-white">Bagian 2: Deskripsi Tindak Lanjut</div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Progress Mitigasi</label>
                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{risk.progressMitigation || 'N/A'}</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Realisasi Terhadap Target</label>
                  <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{risk.realizationTarget || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Target KPI</label>
                  <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{risk.targetKpi || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Bagian 3: Kondisi Risiko Terkini */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
              <div className="text-sm font-semibold text-gray-900 dark:text-white">Bagian 3: Kondisi Risiko Terkini</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tingkat Dampak Terkini</label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {risk.currentImpactLevel && risk.currentImpactLevel > 0
                      ? `${risk.currentImpactLevel} — ${['', 'Sangat Rendah', 'Rendah', 'Moderat', 'Tinggi', 'Sangat Tinggi'][risk.currentImpactLevel] || 'N/A'}`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tingkat Kemungkinan Terkini</label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {risk.currentProbabilityType && risk.currentProbabilityType > 0
                      ? `${risk.currentProbabilityType} — ${['', 'Sangat Jarang Terjadi', 'Jarang Terjadi', 'Bisa Terjadi', 'Sangat Mungkin Terjadi', 'Hampir Pasti Terjadi'][risk.currentProbabilityType] || 'N/A'}`
                      : 'N/A'}
                  </p>
                </div>
              </div>
              {risk.currentScore > 0 && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Score Risiko Terkini:</span>
                  <RiskLevelBadge score={risk.currentScore} />
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{risk.currentScore}/25</span>
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'measurement': {
        const m = risk.measurement;
        const impactLabels = ['', 'Rendah', 'Rendah - Menengah', 'Menengah', 'Menengah - Tinggi', 'Tinggi'];
        const possibilityLabels = ['', 'Sangat Jarang Terjadi', 'Jarang Terjadi', 'Bisa Terjadi', 'Sangat Mungkin Terjadi', 'Hampir Pasti Terjadi'];
        return (
          <div className="space-y-6">
            {/* Section A */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/40">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Section A: Risk Treatment Option</h3>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Risk Treatment Option</label>
                <p className="text-sm text-gray-900 dark:text-white">{m?.treatmentOption || 'N/A'}</p>
              </div>
            </div>

            {/* Section B */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/40">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Section B: Pengukuran Risiko</h3>
              <div className="space-y-6">
                {/* Inherent Risk */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Inherent Risk (Risiko awal sebelum adanya kontrol)</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tingkat Dampak</label>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {m?.impactLevel ? `${m.impactLevel} — ${impactLabels[m.impactLevel] || 'N/A'}` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Deskripsi Dampak</label>
                        <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{m?.impactDescription || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tingkat Kemungkinan</label>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {m?.possibilityType ? `${m.possibilityType} — ${possibilityLabels[m.possibilityType] || 'N/A'}` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Deskripsi Kemungkinan</label>
                        <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{m?.possibilityDescription || 'N/A'}</p>
                      </div>
                    </div>
                    {m?.inherentScore > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tingkat Risiko Inheren:</span>
                        <RiskLevelBadge score={m.inherentScore} />
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{m.inherentScore}/25</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Residual Risk */}
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Residual Risk (Risiko yang diharapkan setelah kontrol)</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tingkat Dampak Residual</label>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {m?.residualImpactLevel ? `${m.residualImpactLevel} — ${impactLabels[m.residualImpactLevel] || 'N/A'}` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Deskripsi Dampak Residual</label>
                        <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{m?.residualImpactDescription || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tingkat Kemungkinan Residual</label>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {m?.residualPossibilityType ? `${m.residualPossibilityType} — ${possibilityLabels[m.residualPossibilityType] || 'N/A'}` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Deskripsi Kemungkinan Residual</label>
                        <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{m?.residualPossibilityDescription || 'N/A'}</p>
                      </div>
                    </div>
                    {m?.residualScore > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tingkat Risiko Residual:</span>
                        <RiskLevelBadge score={m.residualScore} />
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{m.residualScore}/25</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'evaluation': {
        return (
          <div className="space-y-4">
            {user?.userRole === 'RISK_ASSESSMENT' && (
              <div className="flex justify-end mb-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0d6efd] rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <i className="bi bi-pencil"></i>
                  Edit
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Status Evaluasi</label>
                <p className="text-sm text-gray-900 dark:text-white capitalize">{risk.evaluationStatus || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tanggal Evaluasi</label>
                <p className="text-sm text-gray-900 dark:text-white">{risk.evaluationDate || 'N/A'}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Pembuat Evaluasi</label>
              <p className="text-sm text-gray-900 dark:text-white">{risk.evaluator || 'N/A'}</p>
            </div>
            {risk.evaluatorNote && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Catatan Pembuat Evaluasi</label>
                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{risk.evaluatorNote}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Target Yang Tercapai</label>
              <p className="text-sm text-gray-900 dark:text-white">{risk.currentImpactDescription || 'N/A'}</p>
            </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Keterangan (opsional)</label>
                <p className="text-sm text-gray-900 dark:text-white">{risk.currentProbabilityDescription || 'N/A'}</p>
              </div>
            {risk.lastEvaluatedAt && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tanggal Evaluasi Terakhir</label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {new Date(risk.lastEvaluatedAt).toLocaleString('en-GB')}
                </p>
              </div>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <>
      <ContentHeader
        title={`Detail Risiko - ${risk.id}`}
        breadcrumbs={[
          { label: 'Beranda', path: '/' },
          { label: 'Semua Risiko', path: '/risks' },
          { label: risk.id || 'Detail' },
        ]}
      />

      {/* Risk Summary Card */}
      <Card className="mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {risk.riskEvent || risk.title}
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusConfig.badgeClass}`}>
                <span className="h-2 w-2 rounded-full bg-current opacity-60"></span>
                {statusConfig.label}
              </span>
              {risk.organization && <span>· {risk.organization}</span>}
              {risk.location && <span>· {risk.location}</span>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <RiskLevelBadge score={risk.score || 0} />
            <button
              type="button"
              onClick={() => navigate('/risks')}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
        <ApprovalPanel risk={risk} onActionComplete={refreshRisks} />
      </Card>

      {/* Tab Navigation (Browser-style) */}
      <div className="flex flex-wrap items-end gap-1 border-b border-gray-200 dark:border-gray-700 mb-4 overflow-x-auto">
        {availableTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-colors rounded-t-lg whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white dark:bg-(--color-card-bg-dark) text-[#0c9361] border-t-2 border-[#0c9361]'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50'
            }`}
          >
            <i className={`${tab.icon} mr-1.5 sm:mr-2`}></i>
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0c9361]"></span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <Card>
        {renderTabContent()}
      </Card>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <>
          <style>{`
            .edit-modal-content::-webkit-scrollbar {
              display: none;
            }
            .edit-modal-content {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 pb-4 px-4 bg-black/50 backdrop-blur-sm">
            <div
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full mx-auto flex flex-col max-h-[calc(100vh-5rem)] ${
                activeTab === 'identified' ? 'max-w-2xl' : 'max-w-3xl'
              }`}
            >
              <div className="shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-lg">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Edit {availableTabs.find(t => t.id === activeTab)?.label || 'Data'}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <i className="bi bi-x-lg text-xl"></i>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-6 edit-modal-content" key={`${activeTab}-${risk.id}`}>
                {renderEditForm()}
              </div>
            </div>
          </div>
        </>
      )}

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

