import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiskForm } from '../components/form';
import ContentHeader from '../components/ui/ContentHeader';
import NotificationPopup from '../components/ui/NotificationPopup';
import { Card } from '../components/widgets';
import { useRisks } from '../context/RiskContext';
import { logger } from '../utils/logger';

export default function NewRiskEntry() {
  const navigate = useNavigate();
  const { addRisk } = useRisks();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ isOpen: false, type: 'error', title: '', message: '' });

  const handleSubmit = async (payload) => {
    try {
      setIsSubmitting(true);
      await addRisk(payload);
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
        title="Formulir Entri Risiko"
        outline
        color="primary"
      >
        <RiskForm 
          onSubmit={handleSubmit} 
          submitLabel={isSubmitting ? "Menyimpan..." : "Buat Risiko"} 
          simplified={true}
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
      />
    </>
  );
}
