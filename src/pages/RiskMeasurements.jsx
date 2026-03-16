import { useState } from 'react';
import RiskMeasurementForm from '../components/form/RiskMeasurementForm';
import ContentHeader from '../components/ui/ContentHeader';
import NotificationPopup from '../components/ui/NotificationPopup';
import { Card } from '../components/widgets';
import { API_ENDPOINTS, apiRequest } from '../config/api';
import { useRisks } from '../context/RiskContext';
import { getRiskStatus, RISK_STATUS_CONFIG } from '../utils/riskStatus';

export default function RiskMeasurements() {
  const { risks, refreshRisks } = useRisks();
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  // Only show risks with "perlu-pengukuran" status
  const eligibleRisks = risks.filter((r) => getRiskStatus(r) === 'perlu-pengukuran');

  const handleSubmit = async (payload) => {
    if (!selectedRisk) return;
    setIsSubmitting(true);
    try {
      await apiRequest(API_ENDPOINTS.risks.measurement(selectedRisk.id), {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await refreshRisks();
      setSelectedRisk(null);
      setNotification({
        isOpen: true,
        type: 'success',
        title: 'Pengukuran Disimpan',
        message: 'Data pengukuran risiko berhasil disimpan.',
      });
    } catch (err) {
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Gagal Menyimpan',
        message: err.message || 'Terjadi kesalahan. Coba lagi.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusConfig = RISK_STATUS_CONFIG['perlu-pengukuran'];

  return (
    <>
      <ContentHeader
        title="Pengukuran Risiko"
        breadcrumbs={[
          { label: 'Beranda', path: '/' },
          { label: 'Pengukuran Risiko' },
        ]}
      />

      {selectedRisk ? (
        <Card
          title="Formulir Pengukuran Risiko"
          headerExtra={
            <button
              type="button"
              onClick={() => setSelectedRisk(null)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <i className="bi bi-arrow-left" />
              Kembali
            </button>
          }
        >
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{selectedRisk.id}</p>
          <RiskMeasurementForm
            risk={selectedRisk}
            onSubmit={handleSubmit}
            onCancel={() => setSelectedRisk(null)}
            isSubmitting={isSubmitting}
          />
        </Card>
      ) : (
        <Card title="Daftar Risiko Perlu Pengukuran">
          {eligibleRisks.length === 0 ? (
            <div className="text-center py-12">
              <i className="bi bi-rulers text-4xl text-gray-300 dark:text-gray-600 mb-3 block" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tidak ada risiko yang perlu diukur saat ini.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {eligibleRisks.map((risk) => (
                <div
                  key={risk.id}
                  className="flex items-start justify-between gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-xs font-mono text-gray-400 dark:text-gray-500">{risk.id}</span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${statusConfig.badgeClass}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                        {statusConfig.label}
                      </span>
                      {risk.regionCode && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          <i className="bi bi-geo-alt mr-0.5" />
                          {risk.regionCode}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {risk.riskEvent || risk.title}
                    </p>
                    {risk.organization && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{risk.organization}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedRisk(risk)}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-[#0c9361] rounded-lg hover:bg-[#0a7a4f] transition-colors"
                  >
                    <i className="bi bi-rulers" />
                    Ukur
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

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
