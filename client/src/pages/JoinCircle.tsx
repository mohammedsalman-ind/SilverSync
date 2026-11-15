import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { ErrorMessage } from '../components/common/ErrorMessage';

export const JoinCircle: React.FC = () => {
  const { t } = useTranslation();
  const { refreshSession } = useAuth();
  const navigate = useNavigate();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCircle, setSuccessCircle] = useState<{ circleName: string } | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const res = await apiClient.post<{ circleId: string; status: string; circleName: string }>(
        '/invites/redeem',
        { code: code.trim().toUpperCase() }
      );
      setSuccessCircle({ circleName: res.circleName });
      await refreshSession();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid or expired invite code.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: '480px', margin: '40px auto', padding: '0 16px' }}>
      <Card title={t('circle.joinCircle')} subtitle="Connect to your loved one's Care Circle">
        {error && <ErrorMessage message={error} />}

        {successCircle ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <span style={{ fontSize: '3rem' }}>⏳</span>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: '12px', color: 'var(--color-primary)' }}>
              Join Request Submitted!
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
              You have requested to join <strong>{successCircle.circleName}</strong>. For the security of
              the elder, access is pending their personal approval.
            </p>
            <Button
              variant="primary"
              onClick={() => navigate('/dashboard')}
              style={{ marginTop: '20px' }}
            >
              Go to Dashboard
            </Button>
          </div>
        ) : (
          <form onSubmit={handleJoin}>
            <Input
              id="invite-code-input"
              label={t('circle.enterCode')}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. 8K2M9XYZ"
              required
              maxLength={12}
              helperText="Ask the elder for their 8-character passcode."
              style={{
                textTransform: 'uppercase',
                letterSpacing: '4px',
                fontSize: '1.2rem',
                fontWeight: 700,
                textAlign: 'center',
              }}
            />

            <Button type="submit" loading={loading} style={{ width: '100%', marginTop: '8px' }}>
              {t('circle.joinBtn')}
            </Button>
          </form>
        )}
      </Card>
    </main>
  );
};
