import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  id,
  label,
  error,
  helperText,
  style,
  ...props
}) => {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  return (
    <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label
        htmlFor={inputId}
        style={{
          fontWeight: 600,
          color: 'var(--text-primary)',
          fontSize: '0.95rem',
        }}
      >
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
        style={{
          padding: '10px 14px',
          borderRadius: 'var(--border-radius)',
          border: error ? '2px solid var(--color-danger)' : '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          minHeight: 'var(--btn-min-height)',
          outline: 'none',
          ...style,
        }}
        {...props}
      />
      {error && (
        <span
          id={errorId}
          role="alert"
          style={{ color: 'var(--color-danger)', fontSize: '0.85rem', fontWeight: 500 }}
        >
          {error}
        </span>
      )}
      {!error && helperText && (
        <span id={helperId} style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {helperText}
        </span>
      )}
    </div>
  );
};
