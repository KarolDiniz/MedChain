import { useEffect, useId, useRef } from 'react';
import './Modal.css';

/**
 * Shell acessível para modais: Escape, aria-dialog, restauração de foco.
 */
export function ModalShell({
  title,
  onClose,
  children,
  wide = false,
  className = '',
  contentClassName = '',
}) {
  const titleId = useId();
  const panelRef = useRef(null);
  const previousFocus = useRef(null);

  useEffect(() => {
    previousFocus.current = document.activeElement;

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
      }
    };
    document.addEventListener('keydown', onKey);

    const panel = panelRef.current;
    if (panel) {
      const focusable = panel.querySelector(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      (focusable || panel).focus?.();
    }

    return () => {
      document.removeEventListener('keydown', onKey);
      const prev = previousFocus.current;
      if (prev && typeof prev.focus === 'function') {
        prev.focus();
      }
    };
  }, [onClose]);

  return (
    <div className={`modal-overlay ${className}`.trim()} onClick={onClose} role="presentation">
      <div
        ref={panelRef}
        className={`modal-content card card--padding ${wide ? 'modal-content--wide' : ''} ${contentClassName}`.trim()}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="modal-header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
