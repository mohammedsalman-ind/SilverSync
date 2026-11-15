import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  style,
  ...props
}) => {
  const getBackgroundColor = () => {
    if (disabled || loading) return '#94a3b8';
    switch (variant) {
      case 'primary':
        return 'var(--color-primary)';
      case 'secondary':
        return '#475569';
      case 'danger':
        return 'var(--color-danger)';
      case 'outline':
        return 'transparent';
    }
  };

  const getTextColor = () => {
    if (variant === 'outline') return 'var(--color-primary)';
    return '#ffffff';
  };

  const getBorder = () => {
    if (variant === 'outline') return '2px solid var(--color-primary)';
    return 'none';
  };

  const buttonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    backgroundColor: getBackgroundColor(),
    color: getTextColor(),
    border: getBorder(),
    borderRadius: 'var(--border-radius)',
    padding: size === 'lg' ? '12px 24px' : '10px 18px',
    minHeight: 'var(--btn-min-height)',
    fontWeight: 600,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease-in-out',
    textDecoration: 'none',
    ...style,
  };

  return (
    <button
      {...props}
      style={buttonStyle}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading ? '...' : children}
    </button>
  );
};
