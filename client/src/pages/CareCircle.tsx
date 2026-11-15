import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { CircleMember, InviteResult } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { EmptyState } from '../components/common/EmptyState';

export const CareCircle: React.FC = () => {
  const { t } = useTranslation();
  const { user, currentCircle, setCurrentCircle, refreshSession } = useAuth();

  const [members, setMembers] = useState<CircleMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Circle creation state
  const [newCircleName, setNewCircleName] = useState('');
  const [creatingCircle, setCreatingCircle] = useState(false);

  // Invite modal state
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteResult, setInviteResult] = useState<InviteResult | null>(null);
  const [generatingInvite, setGeneratingInvite] = useState(false);
  const [copied, setCopied] = useState(false);

  // Member approval state
  const [approvingUid, setApprovingUid] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'FAMILY' | 'CAREGIVER'>('FAMILY');
  const [selectedPerms, setSelectedPerms] = useState<string[]>(['view_only']);

  const isElder = currentCircle?.role === 'ELDER';

  const fetchMembers = useCallback(async () => {
    if (!currentCircle) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<CircleMember[]>(`/circles/${currentCircle.id}/members`);
      setMembers(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load circle members.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [currentCircle]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleCreateCircle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCircleName.trim()) return;

    setCreatingCircle(true);
    setError(null);
    try {
      const created = await apiClient.post<{ id: string; name: string; elderUid: string }>(
        '/circles',
        { name: newCircleName }
      );
      await refreshSession();
      setCurrentCircle({
        ...created,
        createdAt: new Date().toISOString(),
        role: 'ELDER',
        status: 'active',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create Care Circle.';
      setError(msg);
    } finally {
      setCreatingCircle(false);
    }
  };

  const handleGenerateInvite = async () => {
    if (!currentCircle) return;
    setGeneratingInvite(true);
    setError(null);
    try {
      const res = await apiClient.post<InviteResult>(`/circles/${currentCircle.id}/invites`);
      setInviteResult(res);
      setInviteModalOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate invite code.';
      setError(msg);
    } finally {
      setGeneratingInvite(false);
    }
  };

  const handleCopyCode = () => {
    if (inviteResult?.code) {
      navigator.clipboard.writeText(inviteResult.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleApproveMember = async (memberUid: string) => {
    if (!currentCircle) return;
    try {
      await apiClient.patch(`/circles/${currentCircle.id}/members/${memberUid}`, {
        status: 'active',
        role: selectedRole,
        permissions: selectedPerms,
      });
      setApprovingUid(null);
      await fetchMembers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to approve member.';
      setError(msg);
    }
  };

  const handleRevokeMember = async (memberUid: string) => {
    if (!currentCircle) return;
    if (!confirm('Are you sure you want to revoke this member? They will lose access immediately.')) {
      return;
    }
    try {
      await apiClient.delete(`/circles/${currentCircle.id}/members/${memberUid}`);
      await fetchMembers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to revoke member.';
      setError(msg);
    }
  };

  const activeMembers = members.filter((m) => m.status === 'active');
  const pendingMembers = members.filter((m) => m.status === 'pending');
  const revokedMembers = members.filter((m) => m.status === 'revoked');

  if (!currentCircle) {
    return (
      <main style={{ maxWidth: '600px', margin: '40px auto', padding: '0 16px' }}>
        <Card title={t('circle.createCircle')} subtitle={t('circle.subtitle')}>
          {error && <ErrorMessage message={error} />}
          <form onSubmit={handleCreateCircle}>
            <Input
              id="circle-name-input"
              label={t('circle.circleName')}
              value={newCircleName}
              onChange={(e) => setNewCircleName(e.target.value)}
              placeholder="e.g. Shanti Devi Care Circle"
              required
            />
            <Button type="submit" loading={creatingCircle} style={{ width: '100%' }}>
              {t('circle.createCircle')}
            </Button>
          </form>
        </Card>
      </main>
    );
  }

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
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{currentCircle.name}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{t('circle.subtitle')}</p>
        </div>

        {isElder && (
          <Button
            variant="primary"
            onClick={handleGenerateInvite}
            loading={generatingInvite}
            size="lg"
          >
            ➕ {t('circle.inviteMember')}
          </Button>
        )}
      </div>

      {error && <ErrorMessage message={error} />}

      {loading ? (
        <LoadingSpinner message="Loading circle members..." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Pending Members Section (Elder Approval) */}
          {pendingMembers.length > 0 && (
            <Card
              title={`⏳ ${t('circle.pendingList')} (${pendingMembers.length})`}
              subtitle="Review and grant elder-approved access to family members or caregivers"
              style={{ border: '2px solid var(--color-warning)' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {pendingMembers.map((member) => (
                  <div
                    key={member.uid}
                    style={{
                      padding: '16px',
                      backgroundColor: 'var(--color-warning-bg)',
                      borderRadius: 'var(--border-radius)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                        {member.name || member.email}
                      </p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {member.email} • Requested: {new Date(member.joinedAt).toLocaleDateString()}
                      </p>
                    </div>

                    {isElder && (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {approvingUid === member.uid ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <select
                              value={selectedRole}
                              onChange={(e) => setSelectedRole(e.target.value as 'FAMILY' | 'CAREGIVER')}
                              style={{ padding: '6px', borderRadius: '4px' }}
                            >
                              <option value="FAMILY">Family Member</option>
                              <option value="CAREGIVER">Caregiver</option>
                            </select>

                            <div style={{ display: 'flex', gap: '6px', fontSize: '0.85rem' }}>
                              <label>
                                <input
                                  type="checkbox"
                                  checked={selectedPerms.includes('manage_medicines')}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedPerms([...selectedPerms, 'manage_medicines']);
                                    } else {
                                      setSelectedPerms(selectedPerms.filter((p) => p !== 'manage_medicines'));
                                    }
                                  }}
                                />{' '}
                                Propose Medicines
                              </label>
                              <label>
                                <input
                                  type="checkbox"
                                  checked={selectedPerms.includes('manage_appointments')}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedPerms([...selectedPerms, 'manage_appointments']);
                                    } else {
                                      setSelectedPerms(selectedPerms.filter((p) => p !== 'manage_appointments'));
                                    }
                                  }}
                                />{' '}
                                Manage Appointments
                              </label>
                            </div>

                            <div style={{ display: 'flex', gap: '6px' }}>
                              <Button
                                variant="primary"
                                onClick={() => handleApproveMember(member.uid)}
                              >
                                Confirm Approval
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setApprovingUid(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="primary"
                            onClick={() => {
                              setApprovingUid(member.uid);
                              setSelectedRole('FAMILY');
                              setSelectedPerms(['view_only', 'manage_medicines']);
                            }}
                          >
                            Approve & Set Roles
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Active Members Section */}
          <Card title={`👥 ${t('circle.membersList')} (${activeMembers.length})`}>
            {activeMembers.length === 0 ? (
              <EmptyState
                title="No members in circle yet"
                description={t('circle.noMembers')}
                actionText={isElder ? t('circle.inviteMember') : undefined}
                onAction={isElder ? handleGenerateInvite : undefined}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeMembers.map((m) => (
                  <div
                    key={m.uid}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 16px',
                      borderRadius: 'var(--border-radius)',
                      border: '1px solid var(--border-color)',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                          {m.name || m.email}
                        </span>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            backgroundColor:
                              m.role === 'ELDER'
                                ? 'var(--color-primary-bg)'
                                : 'var(--color-info-bg)',
                            color:
                              m.role === 'ELDER'
                                ? 'var(--color-primary)'
                                : 'var(--color-info)',
                          }}
                        >
                          {m.role === 'ELDER' ? '👵 ELDER' : m.role}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                        Permissions: {m.permissions?.join(', ') || 'view_only'}
                      </p>
                    </div>

                    {isElder && m.uid !== user?.uid && (
                      <Button
                        variant="danger"
                        onClick={() => handleRevokeMember(m.uid)}
                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                      >
                        {t('circle.revoke')}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Revoked Members (Audit history) */}
          {revokedMembers.length > 0 && isElder && (
            <Card title={`🚫 Revoked Members (${revokedMembers.length})`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {revokedMembers.map((m) => (
                  <div
                    key={m.uid}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: 'var(--color-danger-bg)',
                      borderRadius: 'var(--border-radius)',
                      fontSize: '0.85rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{m.name || m.email}</span>
                    <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>Access Revoked</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Invite Code Generator Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title={t('circle.inviteModalTitle')}
      >
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            {t('circle.inviteInstructions')}
          </p>

          <div
            style={{
              letterSpacing: '8px',
              fontSize: '2.5rem',
              fontWeight: 800,
              fontFamily: 'monospace',
              color: 'var(--color-primary)',
              backgroundColor: 'var(--color-primary-bg)',
              padding: '16px',
              borderRadius: 'var(--border-radius)',
              border: '2px dashed var(--color-primary)',
              marginBottom: '20px',
            }}
          >
            {inviteResult?.code}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Button variant="primary" onClick={handleCopyCode} size="lg">
              {copied ? `✅ ${t('common.copied')}` : `📋 ${t('common.copy')}`}
            </Button>
            <Button variant="outline" onClick={() => setInviteModalOpen(false)} size="lg">
              {t('common.close')}
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
};
