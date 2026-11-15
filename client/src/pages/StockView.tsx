import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { Medicine } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { EmptyState } from '../components/common/EmptyState';

export const StockView: React.FC = () => {
  const { t } = useTranslation();
  const { currentCircle } = useAuth();

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refill Modal
  const [refillModalOpen, setRefillModalOpen] = useState(false);
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);
  const [refillQuantity, setRefillQuantity] = useState(30);
  const [refilling, setRefilling] = useState(false);

  const fetchStock = useCallback(async () => {
    if (!currentCircle) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<Medicine[]>(`/circles/${currentCircle.id}/medicines`);
      setMedicines(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch medication stock.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [currentCircle]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const handleRefillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMed) return;
    setRefilling(true);
    try {
      await apiClient.post(`/medicines/${selectedMed.id}/refill`, {
        quantity: Number(refillQuantity),
      });
      setRefillModalOpen(false);
      await fetchStock();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to refill stock.';
      setError(msg);
    } finally {
      setRefilling(false);
    }
  };

  const lowStockMeds = medicines.filter(
    (m) => m.daysLeft !== null && m.daysLeft !== undefined && m.daysLeft <= 7
  );

  return (
    <main style={{ maxWidth: '1000px', margin: '30px auto', padding: '0 16px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{t('stock.title')}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{t('stock.subtitle')}</p>
      </div>

      {lowStockMeds.length > 0 && (
        <div
          role="alert"
          style={{
            padding: '16px 20px',
            backgroundColor: 'var(--color-danger-bg)',
            border: '2px solid var(--color-danger)',
            borderRadius: 'var(--border-radius)',
            color: 'var(--color-danger)',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '1.5rem' }} aria-hidden="true">
            ⚠️
          </span>
          <div>
            <strong>{t('stock.lowStockWarning')}</strong>
            <p style={{ fontSize: '0.9rem', marginTop: '2px' }}>
              {lowStockMeds.map((m) => `${m.name} (${m.daysLeft} days left)`).join(', ')}
            </p>
          </div>
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      {loading ? (
        <LoadingSpinner message="Calculating stock projections..." />
      ) : medicines.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No stock data"
          description="Add medications to view stock run-out projections and refill tiers."
        />
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.95rem',
              }}
            >
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 16px' }}>Medication</th>
                  <th style={{ padding: '12px 16px' }}>In Stock</th>
                  <th style={{ padding: '12px 16px' }}>Doses / Day</th>
                  <th style={{ padding: '12px 16px' }}>Days Left</th>
                  <th style={{ padding: '12px 16px' }}>Run-Out Date</th>
                  <th style={{ padding: '12px 16px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((med) => {
                  const isLow = med.daysLeft !== null && med.daysLeft !== undefined && med.daysLeft <= 7;
                  const isCritical = med.daysLeft !== null && med.daysLeft !== undefined && med.daysLeft <= 1;

                  return (
                    <tr
                      key={med.id}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        backgroundColor: isCritical
                          ? 'var(--color-danger-bg)'
                          : isLow
                          ? 'var(--color-warning-bg)'
                          : 'transparent',
                      }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <strong>{med.name}</strong>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {med.dosage} • {med.form}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>
                        {med.quantityRemaining} units
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {med.asNeeded ? 'As Needed' : `${med.dosesPerDay} / day`}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {med.daysLeft !== null && med.daysLeft !== undefined ? (
                          <span
                            style={{
                              fontWeight: 700,
                              color: isLow ? 'var(--color-danger)' : 'inherit',
                            }}
                          >
                            {med.daysLeft} days
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                        {med.runOutDate || 'N/A'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedMed(med);
                            setRefillQuantity(30);
                            setRefillModalOpen(true);
                          }}
                          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                        >
                          🔄 Refill
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Refill Stock Modal */}
      <Modal
        isOpen={refillModalOpen}
        onClose={() => setRefillModalOpen(false)}
        title={`Refill Stock: ${selectedMed?.name}`}
      >
        <form onSubmit={handleRefillSubmit}>
          <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
            Current stock: <strong>{selectedMed?.quantityRemaining} units</strong>
          </p>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRefillQuantity(30)}
            >
              +30 Units
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRefillQuantity(60)}
            >
              +60 Units
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRefillQuantity(90)}
            >
              +90 Units
            </Button>
          </div>

          <Input
            id="refill-quantity-input"
            label="Quantity to Add"
            type="number"
            step="0.5"
            min="0.5"
            value={refillQuantity}
            onChange={(e) => setRefillQuantity(Number(e.target.value))}
            required
          />

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <Button variant="outline" type="button" onClick={() => setRefillModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" type="submit" loading={refilling}>
              Confirm Refill
            </Button>
          </div>
        </form>
      </Modal>
    </main>
  );
};
