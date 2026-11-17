import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

/**
 * Shell acessível para modais: Escape, aria-dialog, restauração de foco.
 */
export function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  wide = false,
  className = '',
  contentClassName = '',
  initialFocusSelector,
}) {
  const titleId = useId();
  const subtitleId = useId();
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
      const preferred = initialFocusSelector
        ? panel.querySelector(initialFocusSelector)
        : null;
      const focusable =
        preferred ||
        panel.querySelector(
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
  }, [onClose, initialFocusSelector]);

  return (
    <div className={`modal-overlay ${className}`.trim()} onClick={onClose} role="presentation">
      <div
        ref={panelRef}
        className={`modal-content ${wide ? 'modal-content--wide' : ''} ${contentClassName}`.trim()}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? subtitleId : undefined}
        tabIndex={-1}
      >
        <div className="modal-header">
          <div className="modal-header-text">
            <h2 id={titleId}>{title}</h2>
            {subtitle ? (
              <p id={subtitleId} className="modal-subtitle">
                {subtitle}
              </p>
            ) : null}
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar">
            <X size={18} strokeWidth={2} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
