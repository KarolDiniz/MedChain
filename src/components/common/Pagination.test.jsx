import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from './Pagination';

vi.mock('framer-motion', () => ({
  motion: {
    footer: ({ children, initial, animate, transition, style, ...props }) => (
      <footer style={style} {...props}>{children}</footer>
    ),
  },
  useReducedMotion: () => true,
}));

const baseProps = {
  page: 2,
  totalPages: 5,
  totalItems: 40,
  startItem: 13,
  endItem: 24,
  itemsPerPage: 12,
  onPageChange: vi.fn(),
  onPageSizeChange: vi.fn(),
};

describe('Pagination', () => {
  it('não renderiza quando não há itens', () => {
    const { container } = render(<Pagination {...baseProps} totalItems={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('exibe intervalo atual e navega entre páginas', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination {...baseProps} onPageChange={onPageChange} />);

    expect(screen.getByText(/Mostrando/i)).toHaveTextContent('13');
    expect(screen.getByText(/Mostrando/i)).toHaveTextContent('24');
    expect(screen.getByText(/Mostrando/i)).toHaveTextContent('40');

    await user.click(screen.getByRole('button', { name: 'Página anterior' }));
    expect(onPageChange).toHaveBeenCalledWith(1);

    await user.click(screen.getByRole('button', { name: 'Próxima página' }));
    expect(onPageChange).toHaveBeenCalledWith(3);

    await user.click(screen.getByRole('button', { name: 'Página 5' }));
    expect(onPageChange).toHaveBeenCalledWith(5);
  });

  it('desabilita anterior na primeira página e próximo na última', () => {
    const { rerender } = render(<Pagination {...baseProps} page={1} />);
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();

    rerender(<Pagination {...baseProps} page={5} />);
    expect(screen.getByRole('button', { name: 'Próxima página' })).toBeDisabled();
  });

  it('altera tamanho da página', async () => {
    const user = userEvent.setup();
    const onPageSizeChange = vi.fn();
    render(<Pagination {...baseProps} onPageSizeChange={onPageSizeChange} />);

    await user.selectOptions(screen.getByLabelText('Itens por página'), '24');
    expect(onPageSizeChange).toHaveBeenCalledWith(24);
  });
});
