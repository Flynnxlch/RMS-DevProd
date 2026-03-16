import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiskAnalysisForm, RiskForm } from '../components/form';
import ContentHeader from '../components/ui/ContentHeader';
import NotificationPopup from '../components/ui/NotificationPopup';
import { Card } from '../components/widgets';
import { useRisks } from '../context/RiskContext';
import { logger } from '../utils/logger';

function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
      {/* Step 1 */}
      <div className="flex items-center gap-2">
        <span
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
            currentStep === 1
              ? 'bg-[#0d6efd] text-white shadow-sm'
              : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
          }`}
        >
          {currentStep > 1 ? <i className="bi bi-check" /> : '1'}
        </span>
        <span
          className={`text-sm font-semibold transition-colors ${
            currentStep === 1
              ? 'text-[#0d6efd]'
              : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          Risk Entry
        </span>
      </div>

      {/* Separator */}
      <i className="bi bi-arrow-right text-gray-300 dark:text-gray-600 text-sm" />

      {/* Step 2 */}
      <div className="flex items-center gap-2">
        <span
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
            currentStep === 2
              ? 'bg-[#0d6efd] text-white shadow-sm'
              : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
          }`}
        >
          2
        </span>
        <span
          className={`text-sm font-semibold transition-colors ${
            currentStep === 2
              ? 'text-[#0d6efd]'
              : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          Risk Analysis
        </span>
      </div>
    </div>
  );
}

export default function NewRiskEntry() {
  const navigate = useNavigate();
  const { addRisk } = useRisks();
  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({
    isOpen: false,
    type: 'error',
    title: '',
    message: '',
  });

  const handleStep1Submit = (payload) => {
    setStep1Data(payload);
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveRisk = async (combinedPayload) => {
    try {
      setIsSubmitting(true);
      await addRisk(combinedPayload);
      navigate('/risks');
    } catch (error) {
      logger.error('Error creating risk:', error);
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Gagal Membuat Risiko',
        message: 'Gagal membuat risiko: ' + (error.message || 'Unknown error'),
      });
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ContentHeader
        title="Entri Risiko Baru"
        breadcrumbs={[
          { label: 'Beranda', path: '/' },
          { label: 'Register Risiko', path: '/risks' },
          { label: 'Entri Risiko Baru' },
        ]}
      />

      <Card
        title={step === 1 ? 'Formulir Entri Risiko' : 'Formulir Analisis Risiko'}
        outline
        color="primary"
      >
        <StepIndicator currentStep={step} />

        {step === 1 && (
          <RiskForm
            onSubmit={handleStep1Submit}
            submitLabel="Continue"
            wizardMode={true}
            simplified={true}
            initial={step1Data || {}}
          />
        )}

        {step === 2 && (
          <RiskAnalysisForm
            risk={step1Data}
            onCancel={handleBack}
            onSubmit={handleSaveRisk}
            wizardMode={true}
            isSubmitting={isSubmitting}
          />
        )}
      </Card>

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
