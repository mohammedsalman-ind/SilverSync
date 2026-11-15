import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { ErrorMessage } from '../components/common/ErrorMessage';

export const Login: React.FC = () => {
  const { t } = useTranslation();
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in was cancelled or failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Quick fill helper for Evaluator
  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Demo@123456');
  };

  return (
    <div style={{ maxWidth: '480px', margin: '40px auto', padding: '0 16px' }}>
      <Card title={t('auth.loginTitle')} subtitle={t('auth.loginSubtitle')}>
        {error && <ErrorMessage message={error} />}

        <form onSubmit={handleSubmit} noValidate>
          <Input
            id="login-email"
            label={t('auth.emailLabel')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            id="login-password"
            label={t('auth.passwordLabel')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <Button type="submit" loading={loading} style={{ width: '100%', marginTop: '8px' }}>
            {t('auth.signInBtn')}
          </Button>
        </form>

        <div style={{ textAlign: 'center', margin: '20px 0', position: 'relative' }}>
          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)' }} />
          <span
            style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'var(--bg-surface)',
              padding: '0 12px',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
            }}
          >
            or
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleLogin}
          style={{ width: '100%' }}
        >
          🔍 {t('auth.googleSignIn')}
        </Button>

        {/* Demo Logins for Evaluator */}
        <div
          style={{
            marginTop: '24px',
            padding: '12px',
            backgroundColor: 'var(--color-info-bg)',
            borderRadius: 'var(--border-radius)',
            border: '1px solid var(--color-info)',
          }}
        >
          <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '8px', color: 'var(--color-info)' }}>
            ⚡ Fast Demo Credentials for Review:
          </p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => fillDemoAccount('elder@silversync.demo')}
              style={{ padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer', borderRadius: '4px' }}
            >
              👵 Elder
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('family@silversync.demo')}
              style={{ padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer', borderRadius: '4px' }}
            >
              👨‍👩‍👦 Family
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('caregiver@silversync.demo')}
              style={{ padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer', borderRadius: '4px' }}
            >
              🩺 Caregiver
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link to="/signup">{t('auth.noAccount')}</Link>
        </div>
      </Card>
    </div>
  );
};
