import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { apiClient } from '../api/client';
import { ErrorMessage } from '../components/common/ErrorMessage';

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user, profile, currentCircle } = useAuth();
  const navigate = useNavigate();

  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const [sosSuccess, setSosSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTriggerSos = async () => {
    if (!currentCircle) return;
    setSosLoading(true);
    setError(null);
    try {
      await apiClient.post(`/circles/${currentCircle.id}/sos`);
      setSosSuccess(true);
      setTimeout(() => {
        setSosSuccess(false);
        setSosModalOpen(false);
      }, 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to broadcast SOS alert.';
      setError(msg);
    } finally {
      setSosLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: '1000px', margin: '30px auto', padding: '0 16px' }}>
      {/* Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
            Namaste, {profile?.name || user?.email?.split('@')[0]}! 🙏
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Welcome to your healthcare & medication dashboard.
          </p>
        </div>

        {/* Big Emergency SOS Button */}
        {currentCircle && (
          <Button
            variant="danger"
            size="lg"
            onClick={() => setSosModalOpen(true)}
            style={{
              fontSize: '1.1rem',
              fontWeight: 800,
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
            }}
          >
            🚨 EMERGENCY SOS
          </Button>
        )}
      </div>

      {error && <ErrorMessage message={error} />}

      {/* No Care Circle Banner */}
      {!currentCircle ? (
        <Card
          title="Setup Your Care Circle"
          subtitle="SilverSync revolves around your Care Circle, keeping the elder in complete control."
        >
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '16px' }}>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/circle')}
            >
              👵 I am an Elder (Create Circle)
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/join')}
            >
              👨‍👩‍👦 I have an Invite Code (Join Circle)
            </Button>
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {/* Active Care Circle Summary */}
          <Card title="⭕ Care Circle" subtitle="Active Care Circle information">
            <p style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>
              {currentCircle.name}
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
              Your role:{' '}
              <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                {currentCircle.role || 'Member'}
              </span>
            </p>
            <Button variant="outline" onClick={() => navigate('/circle')}>
              Manage Circle & Members
            </Button>
          </Card>

          {/* Quick Schedule Preview */}
          <Card title="💊 Today's Medication Routine" subtitle="Doses and schedule for today">
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
              Medication schedule and stock tracker are active.
            </p>
            <Button variant="primary" onClick={() => navigate('/medicines')}>
              View Today's Doses
            </Button>
          </Card>

          {/* Doctor Appointments */}
          <Card title="🩺 Upcoming Appointments" subtitle="Doctor visits & clinical briefs">
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
              Prepare questions and checklists for upcoming doctor consultations.
            </p>
            <Button variant="outline" onClick={() => navigate('/appointments')}>
              View Appointments
            </Button>
          </Card>
        </div>
      )}

      {/* SOS Confirmation Modal */}
      <Modal
        isOpen={sosModalOpen}
        onClose={() => setSosModalOpen(false)}
        title="⚠️ Trigger Emergency SOS Alert"
      >
        {sosSuccess ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <span style={{ fontSize: '3rem' }}>✅</span>
            <h3 style={{ marginTop: '12px', color: 'var(--color-primary)' }}>
              Emergency Alert Broadcasted!
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
              Immediate email alerts and notifications have been sent to all Care Circle members.
            </p>
          </div>
        ) : (
          <div>
            <p style={{ marginBottom: '20px', fontSize: '1rem', lineHeight: 1.6 }}>
              Are you sure you want to trigger an Emergency SOS? This will immediately notify every
              member of your Care Circle via priority email and mobile notifications.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button
                variant="outline"
                onClick={() => setSosModalOpen(false)}
                disabled={sosLoading}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="danger"
                onClick={handleTriggerSos}
                loading={sosLoading}
              >
                🚨 Yes, Send SOS Alert Now
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
};
