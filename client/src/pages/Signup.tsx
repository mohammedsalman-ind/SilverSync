import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { ErrorMessage } from '../components/common/ErrorMessage';

export const Signup: React.FC = () => {
  const { t } = useTranslation();
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ELDER' | 'FAMILY' | 'CAREGIVER'>('ELDER');
  const [seniorMode, setSeniorMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signup(email, password, name, seniorMode);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '40px auto', padding: '0 16px' }}>
      <Card title={t('auth.signupTitle')} subtitle={t('auth.signupSubtitle')}>
        {error && <ErrorMessage message={error} />}

        <form onSubmit={handleSubmit} noValidate>
          <Input
            id="signup-name"
            label={t('auth.nameLabel')}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />

          <Input
            id="signup-email"
            label={t('auth.emailLabel')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            id="signup-password"
            label={t('auth.passwordLabel')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            helperText="Minimum 6 characters"
            autoComplete="new-password"
          />

          {/* Role Selection */}
          <fieldset style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', padding: '12px', marginBottom: '16px' }}>
            <legend style={{ fontWeight: 600, fontSize: '0.9rem', padding: '0 6px' }}>
              {t('auth.roleLabel')}
            </legend>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="role"
                  value="ELDER"
                  checked={role === 'ELDER'}
                  onChange={() => {
                    setRole('ELDER');
                    setSeniorMode(true);
                  }}
                />
                <span>👵 {t('auth.roleElder')}</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="role"
                  value="FAMILY"
                  checked={role === 'FAMILY'}
                  onChange={() => setRole('FAMILY')}
                />
                <span>👨‍👩‍👦 {t('auth.roleFamily')}</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="role"
                  value="CAREGIVER"
                  checked={role === 'CAREGIVER'}
                  onChange={() => setRole('CAREGIVER')}
                />
                <span>🩺 {t('auth.roleCaregiver')}</span>
              </label>
            </div>
          </fieldset>

          {/* Senior Mode Toggle */}
          <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="senior-mode-checkbox"
              checked={seniorMode}
              onChange={(e) => setSeniorMode(e.target.checked)}
            />
            <label htmlFor="senior-mode-checkbox" style={{ fontWeight: 600, cursor: 'pointer' }}>
              👓 Enable Senior Mode (Large fonts, high contrast)
            </label>
          </div>

          <Button type="submit" loading={loading} style={{ width: '100%' }}>
            {t('auth.signUpBtn')}
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link to="/login">{t('auth.hasAccount')}</Link>
        </div>
      </Card>
    </div>
  );
};
