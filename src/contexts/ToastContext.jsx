import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import './Toast.css';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message, tone = 'info', durationMs = 4500) => {
    if (!message) return;
    const id = ++toastId;
    setToasts((prev) => [...prev.slice(-4), { id, message: String(message), tone }]);
    if (durationMs > 0) {
      window.setTimeout(() => dismiss(id), durationMs);
    }
  }, [dismiss]);

  const api = useMemo(
    () => ({
      push,
      info: (msg) => push(msg, 'info'),
      success: (msg) => push(msg, 'success'),
      error: (msg) => push(msg, 'error'),
      warning: (msg) => push(msg, 'warning'),
      dismiss,
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => {
          const Icon =
            t.tone === 'success'
              ? CheckCircle2
              : t.tone === 'error' || t.tone === 'warning'
                ? AlertTriangle
                : Info;
          return (
            <div key={t.id} className={`toast toast--${t.tone}`} role="status">
              <Icon size={18} strokeWidth={2} className="toast-icon" />
              <p className="toast-message">{t.message}</p>
              <button
                type="button"
                className="toast-close"
                aria-label="Fechar"
                onClick={() => dismiss(t.id)}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      push: () => {},
      info: () => {},
      success: () => {},
      error: () => {},
      warning: () => {},
      dismiss: () => {},
    };
  }
  return ctx;
}
