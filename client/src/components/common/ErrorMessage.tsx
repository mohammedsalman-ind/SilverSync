import React from 'react';

export const ErrorMessage: React.FC<{ message: string; onRetry?: () => void }> = ({
  message,
  onRetry,
}) => {
  return (
    <div
      role="alert"
      style={{
        padding: '16px',
        backgroundColor: 'var(--color-danger-bg)',
        border: '1px solid var(--color-danger)',
        borderRadius: 'var(--border-radius)',
        color: 'var(--color-danger)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: '16px 0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span aria-hidden="true" style={{ fontSize: '1.2rem' }}>
          ⚠️
        </span>
        <span style={{ fontWeight: 500 }}>{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-danger)',
            textDecoration: 'underline',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
};
