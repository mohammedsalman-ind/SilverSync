import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { DoseLog } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { EmptyState } from '../components/common/EmptyState';

export const TodayDoses: React.FC = () => {
  const { t } = useTranslation();
  const { currentCircle } = useAuth();

  const [doses, setDoses] = useState<DoseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const fetchTodayDoses = useCallback(async () => {
    if (!currentCircle) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<DoseLog[]>(`/circles/${currentCircle.id}/doses/today`);
      setDoses(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch today doses.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [currentCircle]);

  useEffect(() => {
    fetchTodayDoses();
  }, [fetchTodayDoses]);

  const handleLogDose = async (doseId: string, status: 'taken' | 'skipped') => {
    setActionInProgress(doseId);
    try {
      await apiClient.post(`/doses/${doseId}/log`, { status });
      await fetchTodayDoses();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to log dose.';
      setError(msg);
    } finally {
      setActionInProgress(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'taken':
        return {
          text: t('today.statusTaken'),
          icon: '✅',
          bg: 'var(--color-primary-bg)',
          color: 'var(--color-primary)',
          border: '1px solid var(--color-primary)',
        };
      case 'missed':
        return {
          text: t('today.statusMissed'),
          icon: '⏰',
          bg: 'var(--color-danger-bg)',
          color: 'var(--color-danger)',
          border: '1px solid var(--color-danger)',
        };
      case 'skipped':
        return {
          text: t('today.statusSkipped'),
          icon: '⏸️',
          bg: '#f1f5f9',
          color: '#475569',
          border: '1px solid #cbd5e1',
        };
      default:
        return {
          text: t('today.statusPending'),
          icon: '⏳',
          bg: 'var(--color-warning-bg)',
          color: 'var(--color-warning)',
          border: '1px solid var(--color-warning)',
        };
    }
  };

  return (
    <main style={{ maxWidth: '900px', margin: '30px auto', padding: '0 16px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{t('today.title')}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{t('today.subtitle')}</p>
      </div>

              // Added H2 heading for accessibility hierarchy
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: '12px' }}>{t('today.dosesHeading')}</h2>
        
        {error && <ErrorMessage message={error} />}

        {loading ? (
          <LoadingSpinner message="Loading today's schedule..." />
        ) : doses.length === 0 ? (
          <EmptyState
            icon="📉"
            title="All clear for today"
            description={t('today.noDosesToday')}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {doses.map((dose) => {
              const timeFormatted = new Date(dose.scheduledAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              const badge = getStatusBadge(dose.status);
              const isPendingOrMissed = dose.status === 'pending' || dose.status === 'missed';

              return (
                <Card key={dose.id}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '16px',
                    }}
                  >
                    {/* Dose info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <div
                        style={{
                          fontSize: '1.5rem',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                          backgroundColor: 'var(--bg-primary)',
                          padding: '8px 14px',
                          borderRadius: 'var(--border-radius)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        {timeFormatted}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{dose.medicineName}</h2>
                          {/* Status shown by Colour AND Icon AND Text */}
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: '16px',
                              fontSize: '0.85rem',
                              fontWeight: 700,
                              backgroundColor: badge.bg,
                              color: badge.color,
                              border: badge.border,
                            }}
                          >
                            <span aria-hidden="true">{badge.icon}</span>
                            <span>{badge.text}</span>
                          </span>
                        </div>

                        <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                          {dose.dosage} • {dose.form}{dose.notes && ` (${dose.notes})`}
                        </p>
                      </div>
                    </div>

                    {/* Big Accessible Action Buttons (48px+ touch targets in senior mode) */}
                    {isPendingOrMissed && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <Button
                          variant="primary"
                          size="lg"
                          onClick={() => handleLogDose(dose.id, 'taken')}
                          loading={actionInProgress === dose.id}
                          aria-label={`Mark ${dose.medicineName} as taken`}
                          style={{
                            fontSize: '1.1rem',
                            padding: '12px 24px',
                            boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)',
                          }}
                        >
                          ✔ {t('today.taken')}
                        </Button>

                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => handleLogDose(dose.id, 'skipped')}
                          loading={actionInProgress === dose.id}
                          aria-label={`Skip dose of ${dose.medicineName}`}
                          style={{
                            fontSize: '1.05rem',
                            padding: '12px 20px',
                          }}
                        >
                          ⏹️ {t('today.skip')}
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    )}
  </main>
);
};

      {loading ? (
        <LoadingSpinner message="Loading today's schedule..." />
      ) : doses.length === 0 ? (
        <EmptyState
          icon="🎉"
          title="All clear for today"
          description={t('today.noDosesToday')}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {doses.map((dose) => {
            const timeFormatted = new Date(dose.scheduledAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            const badge = getStatusBadge(dose.status);
            const isPendingOrMissed = dose.status === 'pending' || dose.status === 'missed';

            return (
              <Card key={dose.id}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px',
                  }}
                >
                  {/* Dose info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        backgroundColor: 'var(--bg-primary)',
                        padding: '8px 14px',
                        borderRadius: 'var(--border-radius)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      {timeFormatted}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                          {dose.medicineName}
                        </h2>
                        {/* Status shown by Colour AND Icon AND Text */}
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '16px',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            backgroundColor: badge.bg,
                            color: badge.color,
                            border: badge.border,
                          }}
                        >
                          <span aria-hidden="true">{badge.icon}</span>
                          <span>{badge.text}</span>
                        </span>
                      </div>

                      <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {dose.dosage} • {dose.form}
                        {dose.notes && ` (${dose.notes})`}
                      </p>
                    </div>
                  </div>

                  {/* Big Accessible Action Buttons (48px+ touch targets in senior mode) */}
                  {isPendingOrMissed && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <Button
                        variant="primary"
                        size="lg"
                        onClick={() => handleLogDose(dose.id, 'taken')}
                        loading={actionInProgress === dose.id}
                        aria-label={`Mark ${dose.medicineName} as taken`}
                        style={{
                          fontSize: '1.1rem',
                          padding: '12px 24px',
                          boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)',
                        }}
                      >
                        ✅ {t('today.taken')}
                      </Button>

                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => handleLogDose(dose.id, 'skipped')}
                        loading={actionInProgress === dose.id}
                        aria-label={`Skip dose of ${dose.medicineName}`}
                        style={{
                          fontSize: '1.05rem',
                          padding: '12px 20px',
                        }}
                      >
                        ⏸️ {t('today.skip')}
                      </Button>
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
