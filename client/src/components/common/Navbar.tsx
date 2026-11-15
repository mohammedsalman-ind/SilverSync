import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Button } from './Button';

export const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, profile, currentCircle, seniorMode, toggleSeniorMode, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLanguageToggle = () => {
    const nextLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(nextLang);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '2px solid var(--border-color)',
        padding: '12px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link
            to="/"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '1.3rem',
              fontWeight: 800,
              color: 'var(--color-primary)',
            }}
          >
            <span aria-hidden="true" style={{ fontSize: '1.5rem' }}>
              💊
            </span>
            <span>SilverSync</span>
          </Link>

          {currentCircle && (
            <span
              style={{
                backgroundColor: 'var(--color-primary-bg)',
                color: 'var(--color-primary)',
                padding: '4px 10px',
                borderRadius: '16px',
                fontSize: '0.85rem',
                fontWeight: 600,
                border: '1px solid var(--color-primary)',
              }}
            >
              ⭕ {currentCircle.name}
            </span>
          )}
        </div>

        {user && (
          <nav aria-label="Main Navigation" style={{ display: 'flex', gap: '8px' }}>
            <Link
              to="/dashboard"
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--border-radius)',
                textDecoration: 'none',
                fontWeight: 600,
                color: isActive('/dashboard') ? '#ffffff' : 'var(--text-secondary)',
                backgroundColor: isActive('/dashboard') ? 'var(--color-primary)' : 'transparent',
              }}
            >
              {t('nav.dashboard')}
            </Link>

            <Link
              to="/circle"
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--border-radius)',
                textDecoration: 'none',
                fontWeight: 600,
                color: isActive('/circle') ? '#ffffff' : 'var(--text-secondary)',
                backgroundColor: isActive('/circle') ? 'var(--color-primary)' : 'transparent',
              }}
            >
              {t('nav.circle')}
            </Link>
          </nav>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Senior Mode Toggle */}
          <button
            onClick={toggleSeniorMode}
            aria-pressed={seniorMode}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--border-radius)',
              border: seniorMode ? '2px solid #000000' : '1px solid var(--border-color)',
              backgroundColor: seniorMode ? '#fef08a' : 'var(--bg-surface)',
              color: '#000000',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              minHeight: 'var(--btn-min-height)',
            }}
          >
            👓 {t('nav.seniorMode')}: {seniorMode ? 'ON' : 'OFF'}
          </button>

          {/* Language Switcher */}
          <button
            onClick={handleLanguageToggle}
            aria-label="Toggle language between English and Hindi"
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--border-radius)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-surface)',
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: 'var(--btn-min-height)',
            }}
          >
            🌐 {i18n.language === 'en' ? 'हिन्दी' : 'English'}
          </button>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                {profile?.name || user.email?.split('@')[0]}
              </span>
              <Button
                variant="outline"
                onClick={handleLogout}
                style={{ padding: '6px 12px', minHeight: '38px', fontSize: '0.85rem' }}
              >
                {t('nav.logout')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
