import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { Medicine, MedicineSchedule } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { EmptyState } from '../components/common/EmptyState';

export const Medicines: React.FC = () => {
  const { t } = useTranslation();
  const { currentCircle } = useAuth();

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add / Propose Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [form, setForm] = useState('Tablet');
  const [times, setTimes] = useState('08:00, 20:00');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [quantity, setQuantity] = useState(30);
  const [asNeeded, setAsNeeded] = useState(false);
  const [notes, setNotes] = useState('');

  // Refill Modal
  const [refillModalOpen, setRefillModalOpen] = useState(false);
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);
  const [refillQuantity, setRefillQuantity] = useState(30);
  const [refilling, setRefilling] = useState(false);

  const isElder = currentCircle?.role === 'ELDER';

  const fetchMedicines = useCallback(async () => {
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
      const msg = err instanceof Error ? err.message : 'Failed to fetch medications.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [currentCircle]);

  useEffect(() => {
    fetchMedicines();
  }, [fetchMedicines]);

  const handleSaveMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCircle) return;
    setSaving(true);
    setError(null);

    const parsedTimes = times
      .split(',')
      .map((t) => t.trim())
      .filter((t) => /^[0-2]\d:[0-5]\d$/.test(t));

    if (parsedTimes.length === 0 && !asNeeded) {
      setError('Please provide at least one valid scheduled time (e.g. 08:00)');
      setSaving(false);
      return;
    }

    const schedule: MedicineSchedule = {
      times: parsedTimes.length > 0 ? parsedTimes : ['08:00'],
      daysOfWeek,
      startDate: new Date().toISOString().split('T')[0],
    };

    try {
      await apiClient.post(`/circles/${currentCircle.id}/medicines`, {
        name,
        dosage,
        form,
        schedule,
        asNeeded,
        quantityRemaining: Number(quantity),
        refillThresholdDays: 7,
        notes: notes || undefined,
      });

      setModalOpen(false);
      resetForm();
      await fetchMedicines();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save medication.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleRefillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMed) return;
    setRefilling(true);
    try {
      await apiClient.post(`/medicines/${selectedMed.id}/refill`, {
        quantity: Number(refillQuantity),
      });
      setRefillModalOpen(false);
      await fetchMedicines();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to refill stock.';
      setError(msg);
    } finally {
      setRefilling(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDosage('');
    setForm('Tablet');
    setTimes('08:00, 20:00');
    setDaysOfWeek([0, 1, 2, 3, 4, 5, 6]);
    setQuantity(30);
    setAsNeeded(false);
    setNotes('');
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <main style={{ maxWidth: '1000px', margin: '30px auto', padding: '0 16px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{t('medicines.title')}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{t('medicines.subtitle')}</p>
        </div>

        <Button
          variant="primary"
          onClick={() => {
            resetForm();
            setModalOpen(true);
          }}
          size="lg"
        >
          ➕ {isElder ? t('medicines.addBtn') : t('medicines.proposeBtn')}
        </Button>
      </div>

      {!isElder && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--color-info-bg)',
            border: '1px solid var(--color-info)',
            borderRadius: 'var(--border-radius)',
            marginBottom: '20px',
            fontSize: '0.9rem',
            color: 'var(--color-info)',
          }}
        >
          ℹ️ {t('medicines.proposeNotice')}
        </div>
      )}

      {error && <ErrorMessage message={error} />}

      {loading ? (
        <LoadingSpinner message="Loading medications..." />
      ) : medicines.length === 0 ? (
        <EmptyState
          icon="💊"
          title="No medications added yet"
          description="Add your daily medicines to enable automated reminders and refill tracking."
          actionText={isElder ? t('medicines.addBtn') : t('medicines.proposeBtn')}
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {medicines.map((med) => {
            const isLowStock = med.daysLeft !== null && med.daysLeft !== undefined && med.daysLeft <= 7;

            return (
              <Card key={med.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{med.name}</h2>
                    <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {med.dosage} • {med.form}
                    </p>
                  </div>

                  {isLowStock && (
                    <span
                      style={{
                        backgroundColor: 'var(--color-danger-bg)',
                        color: 'var(--color-danger)',
                        border: '1px solid var(--color-danger)',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                      }}
                    >
                      ⚠️ Refill Soon
                    </span>
                  )}
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: 'var(--border-radius)',
                    padding: '12px',
                    margin: '16px 0',
                    fontSize: '0.9rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div>
                    <strong>Schedule:</strong>{' '}
                    {med.asNeeded ? 'As Needed' : med.schedule.times.join(', ')}
                  </div>
                  <div>
                    <strong>Stock:</strong>{' '}
                    <span style={{ fontWeight: 700, color: isLowStock ? 'var(--color-danger)' : 'inherit' }}>
                      {med.quantityRemaining} units
                    </span>
                    {med.daysLeft !== null && med.daysLeft !== undefined && (
                      <span> ({med.daysLeft} days left)</span>
                    )}
                  </div>
                  {med.runOutDate && (
                    <div style={{ color: 'var(--text-muted)' }}>
                      Estimated run-out: {med.runOutDate}
                    </div>
                  )}
                  {med.notes && <div style={{ color: 'var(--text-muted)' }}>Note: {med.notes}</div>}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedMed(med);
                      setRefillQuantity(30);
                      setRefillModalOpen(true);
                    }}
                    style={{ flex: 1 }}
                  >
                    🔄 {t('medicines.refillBtn')}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Propose Medication Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isElder ? t('medicines.addBtn') : t('medicines.proposeBtn')}
      >
        <form onSubmit={handleSaveMedicine}>
          <Input
            id="med-name"
            label={t('medicines.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Metformin"
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              id="med-dosage"
              label={t('medicines.dosage')}
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="e.g. 500mg"
              required
            />
            <Input
              id="med-form"
              label={t('medicines.form')}
              value={form}
              onChange={(e) => setForm(e.target.value)}
              placeholder="e.g. Tablet"
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={asNeeded}
                onChange={(e) => setAsNeeded(e.target.checked)}
              />
              <span>{t('medicines.asNeeded')}</span>
            </label>
          </div>

          {!asNeeded && (
            <>
              <Input
                id="med-times"
                label={t('medicines.times')}
                value={times}
                onChange={(e) => setTimes(e.target.value)}
                placeholder="08:00, 20:00"
                helperText="Comma-separated times in 24h format (HH:mm)"
              />

              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontWeight: 600, fontSize: '0.95rem', display: 'block', marginBottom: '6px' }}>
                  Days of Week
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {dayNames.map((day, idx) => (
                    <label
                      key={day}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: daysOfWeek.includes(idx)
                          ? 'var(--color-primary-bg)'
                          : 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={daysOfWeek.includes(idx)}
                        onChange={(e) => {
                          if (e.target.checked) setDaysOfWeek([...daysOfWeek, idx]);
                          else setDaysOfWeek(daysOfWeek.filter((d) => d !== idx));
                        }}
                      />
                      {day}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          <Input
            id="med-quantity"
            label={t('medicines.quantityRemaining')}
            type="number"
            step="0.5"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            required
          />

          <Input
            id="med-notes"
            label="Clinical Instructions / Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Take after breakfast"
          />

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" type="submit" loading={saving}>
              {isElder ? t('common.save') : 'Submit Proposal'}
            </Button>
          </div>
        </form>
      </Modal>

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
            id="refill-quantity"
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
