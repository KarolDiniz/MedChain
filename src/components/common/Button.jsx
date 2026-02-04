import './Button.css';

export function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  return (
    <button className={`btn btn--${variant} btn--${size} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
