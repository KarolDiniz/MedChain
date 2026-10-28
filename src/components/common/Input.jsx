import { useId } from 'react';
import './Input.css';

export function Input({ label, error, className = '', id, ...props }) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className={`input-group ${className}`.trim()}>
      {label && (
        <label className="input-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`input-field ${error ? 'input-field--error' : ''}`}
        {...props}
      />
      {error && <span className="input-error">{error}</span>}
    </div>
  );
}
