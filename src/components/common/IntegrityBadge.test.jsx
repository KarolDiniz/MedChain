import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntegrityBadge } from './IntegrityBadge';

vi.mock('../../services/api', () => ({
  medicalRecordsApi: {
    verify: vi.fn(),
  },
}));

import { medicalRecordsApi } from '../../services/api';

describe('IntegrityBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('mostra status pendente sem hash', () => {
    render(<IntegrityBadge item={{}} />);
    expect(screen.getByText('Pendente')).toBeInTheDocument();
  });

  it('mostra hash local e oculta explorer sem tx', () => {
    render(<IntegrityBadge item={{ hash: 'abc123hashvalue', public_id: 'mr-1' }} />);
    expect(screen.getByText('Hash local')).toBeInTheDocument();
    expect(screen.queryByText('Explorer')).not.toBeInTheDocument();
  });

  it('mostra ancorado com link do explorer', () => {
    render(
      <IntegrityBadge
        item={{
          hash: 'hashvalue1234567890',
          blockchain_tx_id: 'tx-abc',
          public_id: 'mr-1',
        }}
      />,
    );
    expect(screen.getByText('Ancorado')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Explorer/i });
    expect(link).toHaveAttribute(
      'href',
      'https://explorer.solana.com/tx/tx-abc?cluster=devnet',
    );
  });

  it('verifica integridade com sucesso', async () => {
    const user = userEvent.setup();
    medicalRecordsApi.verify.mockResolvedValue({
      valid: true,
      message: 'Integridade confirmada',
    });

    render(
      <IntegrityBadge
        item={{ hash: 'h', blockchain_tx_id: 'tx', public_id: 'mr-1' }}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Verificar integridade/i }));
    await waitFor(() =>
      expect(screen.getByText('Integridade confirmada')).toBeInTheDocument(),
    );
    expect(medicalRecordsApi.verify).toHaveBeenCalledWith('mr-1');
  });

  it('exibe erro quando verificação falha', async () => {
    const user = userEvent.setup();
    medicalRecordsApi.verify.mockRejectedValue(new Error('rede indisponível'));

    render(<IntegrityBadge publicId="mr-2" hash="h" blockchainTxId="tx" />);

    await user.click(screen.getByRole('button', { name: /Verificar integridade/i }));
    await waitFor(() =>
      expect(screen.getByText('rede indisponível')).toBeInTheDocument(),
    );
  });

  it('não exibe botão de verificação sem publicId', () => {
    render(<IntegrityBadge item={{ hash: 'h', blockchain_tx_id: 'tx' }} />);
    expect(
      screen.queryByRole('button', { name: /Verificar integridade/i }),
    ).not.toBeInTheDocument();
  });
});
