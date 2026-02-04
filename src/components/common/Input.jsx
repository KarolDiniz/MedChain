import './Input.css';

export function Input({ label, error, className = '', ...props }) {
  return (
    <div className={`input-group ${className}`.trim()}>
      {label && <label className="input-label">{label}</label>}
      <input className={`input-field ${error ? 'input-field--error' : ''}`} {...props} />
      {error && <span className="input-error">{error}</span>}
    </div>
  );
}
