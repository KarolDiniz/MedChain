import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PatientModal } from './PatientModal';

vi.mock('../../services/medicalRecordService', () => ({
  addPatient: vi.fn(),
}));

import { addPatient } from '../../services/medicalRecordService';

describe('PatientModal', () => {
  const onClose = vi.fn();
  const onSaved = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza seções, callout e ações', () => {
    render(<PatientModal doctorId="doc-1" onClose={onClose} onSaved={onSaved} />);

    expect(screen.getByRole('dialog', { name: /novo paciente/i })).toBeInTheDocument();
    expect(screen.getByText(/acesso inicial/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /dados pessoais/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /endereço/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cadastrar paciente/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
  });

  it('fecha ao clicar em Cancelar sem salvar', async () => {
    const user = userEvent.setup();
    render(<PatientModal doctorId="doc-1" onClose={onClose} onSaved={onSaved} />);

    await user.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(addPatient).not.toHaveBeenCalled();
  });

  it('envia payload completo e chama onSaved', async () => {
    const user = userEvent.setup();
    addPatient.mockResolvedValueOnce({ patient_public_id: 'p-1' });

    render(<PatientModal doctorId="doc-1" onClose={onClose} onSaved={onSaved} />);

    await user.type(screen.getByLabelText(/nome completo/i), 'Carla Mendes Teste');
    await user.type(screen.getByLabelText(/^e-mail$/i), 'carla.modal.test@email.com');
    await user.type(screen.getByLabelText(/senha inicial/i), 'senha123');
    await user.type(screen.getByLabelText(/telefone/i), '11999990000');
    await user.type(screen.getByLabelText(/data de nascimento/i), '1990-05-20');
    await user.selectOptions(screen.getByLabelText(/gênero/i), 'FEMALE');
    await user.type(screen.getByLabelText(/^rua$/i), 'Rua das Flores');
    await user.type(screen.getByLabelText(/^número$/i), '100');
    await user.type(screen.getByLabelText(/complemento/i), 'Apto 2');
    await user.type(screen.getByLabelText(/bairro/i), 'Centro');
    await user.type(screen.getByLabelText(/cidade/i), 'São Paulo');
    await user.type(screen.getByLabelText(/estado/i), 'SP');

    await user.click(screen.getByRole('button', { name: /cadastrar paciente/i }));

    await waitFor(() => {
      expect(addPatient).toHaveBeenCalledTimes(1);
    });

    expect(addPatient).toHaveBeenCalledWith('doc-1', {
      full_name: 'Carla Mendes Teste',
      email: 'carla.modal.test@email.com',
      password: 'senha123',
      cellphone: '11999990000',
      birth_date: '1990-05-20',
      gender: 'FEMALE',
      address: {
        street: 'Rua das Flores',
        number: '100',
        complement: 'Apto 2',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
      },
    });
    expect(onSaved).toHaveBeenCalledWith('patient');
  });

  it('mostra erro da API e não chama onSaved', async () => {
    const user = userEvent.setup();
    addPatient.mockRejectedValueOnce(new Error('E-mail já cadastrado.'));

    render(<PatientModal doctorId="doc-1" onClose={onClose} onSaved={onSaved} />);

    await user.type(screen.getByLabelText(/nome completo/i), 'Duplicado');
    await user.type(screen.getByLabelText(/^e-mail$/i), 'dup@email.com');
    await user.type(screen.getByLabelText(/senha inicial/i), 'senha123');
    await user.click(screen.getByRole('button', { name: /cadastrar paciente/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/e-mail já cadastrado/i);
    expect(onSaved).not.toHaveBeenCalled();
  });
});
