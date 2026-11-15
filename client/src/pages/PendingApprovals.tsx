import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { ProposedChange } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { EmptyState } from '../components/common/EmptyState';

export const PendingApprovals: React.FC = () => {
  const { t } = useTranslation();
  const { currentCircle } = useAuth();

  const [proposals, setProposals] = useState<ProposedChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const isElder = currentCircle?.role === 'ELDER';

  const fetchProposals = useCallback(async () => {
    if (!currentCircle || !isElder) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<ProposedChange[]>(`/circles/${currentCircle.id}/proposals`);
      setProposals(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch pending proposals.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [currentCircle, isElder]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  const handleApprove = async (proposalId: string) => {
    setProcessingId(proposalId);
    try {
      await apiClient.post(`/proposals/${proposalId}/approve`);
      await fetchProposals();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to approve proposal.';
      setError(msg);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (proposalId: string) => {
    setProcessingId(proposalId);
    try {
      await apiClient.post(`/proposals/${proposalId}/reject`);
      await fetchProposals();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reject proposal.';
      setError(msg);
    } finally {
      setProcessingId(null);
    }
  };

  if (!isElder) {
    return (
      <main style={{ maxWidth: '800px', margin: '40px auto', padding: '0 16px' }}>
        <Card title={t('approvals.title')}>
          <p style={{ color: 'var(--text-secondary)' }}>
            Only the Elder has the authority to approve or reject proposed medication modifications.
          </p>
        </Card>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: '900px', margin: '30px auto', padding: '0 16px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{t('approvals.title')}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{t('approvals.subtitle')}</p>
      </div>

      {error && <ErrorMessage message={error} />}

      {loading ? (
        <LoadingSpinner message="Checking for pending changes..." />
      ) : proposals.length === 0 ? (
        <EmptyState
          icon="✅"
          title="All changes reviewed"
          description={t('approvals.noProposals')}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {proposals.map((prop) => {
            const p = prop.payload as Record<string, unknown>;
            const isProcessing = processingId === prop.id;

            return (
              <Card key={prop.id} style={{ border: '2px solid var(--color-warning)' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '16px',
                  }}
                >
                  <div>
                    <span
                      style={{
                        backgroundColor: 'var(--color-warning-bg)',
                        color: 'var(--color-warning)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      {prop.type} Medication
                    </span>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '6px' }}>
                      {String(p.name || p.medicineName || 'Medication Change')}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Proposed by <strong>{prop.proposerName || prop.proposedBy}</strong> on{' '}
                      {new Date(prop.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Button
                      variant="primary"
                      onClick={() => handleApprove(prop.id)}
                      loading={isProcessing}
                      disabled={isProcessing}
                    >
                      ✅ {t('approvals.approve')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleReject(prop.id)}
                      loading={isProcessing}
                      disabled={isProcessing}
                    >
                      ✕ {t('approvals.reject')}
                    </Button>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    padding: '12px 16px',
                    borderRadius: 'var(--border-radius)',
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                  }}
                >
                  {p.dosage && (
                    <div>
                      <strong>Dosage:</strong> {String(p.dosage)}
                    </div>
                  )}
                  {p.form && (
                    <div>
                      <strong>Form:</strong> {String(p.form)}
                    </div>
                  )}
                  {p.quantityRemaining !== undefined && (
                    <div>
                      <strong>Quantity:</strong> {String(p.quantityRemaining)} units
                    </div>
                  )}
                  {p.notes && (
                    <div>
                      <strong>Notes:</strong> {String(p.notes)}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
};
