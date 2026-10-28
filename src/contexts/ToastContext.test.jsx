import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from './ToastContext';

function ToastProbe() {
  const toast = useToast();
  return (
    <div>
      <button type="button" onClick={() => toast.success('Salvo')}>
        success
      </button>
      <button type="button" onClick={() => toast.error('Falhou')}>
        error
      </button>
      <button type="button" onClick={() => toast.push('')}>
        empty
      </button>
      <button type="button" onClick={() => toast.push('Persistente', 'info', 0)}>
        sticky
      </button>
    </div>
  );
}

describe('ToastContext', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('exibe toast e remove após duração', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastProvider>
        <ToastProbe />
      </ToastProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'success' }));
    expect(screen.getByText('Salvo')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(4500);
    });

    expect(screen.queryByText('Salvo')).not.toBeInTheDocument();
  });

  it('ignora mensagem vazia e permite dismiss manual', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <ToastProvider>
        <ToastProbe />
      </ToastProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'empty' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'sticky' }));
    expect(screen.getByText('Persistente')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Fechar' }));
    expect(screen.queryByText('Persistente')).not.toBeInTheDocument();
  });

  it('useToast fora do provider retorna no-ops seguros', () => {
    function Outside() {
      const toast = useToast();
      toast.success('x');
      return <p>ok</p>;
    }
    expect(() => render(<Outside />)).not.toThrow();
    expect(screen.getByText('ok')).toBeInTheDocument();
  });
});
