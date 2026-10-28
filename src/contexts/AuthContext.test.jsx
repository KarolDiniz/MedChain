import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from './AuthContext';
import { ToastProvider } from './ToastContext';

vi.mock('../services/api', () => ({
  authApi: {
    login: vi.fn(),
    registerDoctor: vi.fn(),
    completeDoctor: vi.fn(),
    me: vi.fn(),
    logout: vi.fn(),
  },
}));

import { authApi } from '../services/api';

function AuthProbe() {
  const { user, loading, login, registerDoctor, logout, isDoctor, isPatient } = useAuth();

  if (loading) return <p>loading</p>;

  return (
    <div>
      <p data-testid="user">{user ? user.email : 'none'}</p>
      <p data-testid="role">{user?.type || 'none'}</p>
      <p data-testid="is-doctor">{String(isDoctor())}</p>
      <p data-testid="is-patient">{String(isPatient())}</p>
      <button type="button" onClick={() => login('a@b.com', '123')}>
        login
      </button>
      <button
        type="button"
        onClick={() =>
          registerDoctor({
            email: 'doc@test.com',
            password: 'senha123',
            full_name: 'Dr Test',
            CRM: '123',
            specialty: 'GENERAL',
          })
        }
      >
        register
      </button>
      <button type="button" onClick={logout}>
        logout
      </button>
    </div>
  );
}

function renderAuth(ui = <AuthProbe />) {
  return render(
    <ToastProvider>
      <AuthProvider>{ui}</AuthProvider>
    </ToastProvider>,
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    authApi.logout.mockResolvedValue({});
    authApi.me.mockResolvedValue({ email: 'doc@test.com', role: 'doctor' });
  });

  it('inicia sem usuário quando não há sessão persistida', async () => {
    renderAuth();
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('none'));
  });

  it('restaura sessão e enriquece com /auth/me', async () => {
    localStorage.setItem(
      'medchain_user',
      JSON.stringify({
        email: 'doc@test.com',
        type: 'doctor',
        access_token: 'tok',
        refresh_token: 'ref',
      }),
    );
    authApi.me.mockResolvedValue({ email: 'doc@test.com', role: 'doctor', full_name: 'Dr' });

    renderAuth();

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('doc@test.com'));
    expect(screen.getByTestId('is-doctor')).toHaveTextContent('true');
  });

  it('login bem-sucedido persiste usuário doctor', async () => {
    const user = userEvent.setup();
    authApi.login.mockResolvedValue({
      access_token: 'a',
      refresh_token: 'r',
      user: { email: 'a@b.com', role: 'doctor' },
    });

    renderAuth();
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('none'));
    await user.click(screen.getByRole('button', { name: 'login' }));

    await waitFor(() => expect(screen.getByTestId('role')).toHaveTextContent('doctor'));
    expect(JSON.parse(localStorage.getItem('medchain_user')).access_token).toBe('a');
  });

  it('login retorna erro amigável em falha de rede', async () => {
    const user = userEvent.setup();
    authApi.login.mockRejectedValue(new Error('Failed to fetch'));

    let loginResult;
    function Probe() {
      const auth = useAuth();
      return (
        <button
          type="button"
          onClick={async () => {
            loginResult = await auth.login('x', 'y');
          }}
        >
          go
        </button>
      );
    }

    renderAuth(<Probe />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'go' })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'go' }));

    await waitFor(() => expect(loginResult?.success).toBe(false));
    expect(loginResult.error).toMatch(/backend/i);
  });

  it('registerDoctor completa cadastro quando e-mail já existe', async () => {
    const user = userEvent.setup();
    authApi.registerDoctor.mockRejectedValue({
      message: 'já existe',
      data: { detail: 'User ja existe' },
    });
    authApi.completeDoctor.mockResolvedValue({});
    authApi.login.mockResolvedValue({
      access_token: 'a',
      refresh_token: 'r',
      user: { email: 'doc@test.com', role: 'doctor' },
    });

    renderAuth();
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('none'));
    await user.click(screen.getByRole('button', { name: 'register' }));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('doc@test.com'));
    expect(authApi.completeDoctor).toHaveBeenCalled();
    expect(authApi.login).toHaveBeenCalled();
  });

  it('logout limpa estado e storage', async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      'medchain_user',
      JSON.stringify({
        email: 'doc@test.com',
        type: 'doctor',
        access_token: 'tok',
        refresh_token: 'ref',
      }),
    );
    authApi.me.mockResolvedValue({ email: 'doc@test.com', role: 'doctor' });

    renderAuth();
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('doc@test.com'));
    await user.click(screen.getByRole('button', { name: 'logout' }));

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('none'));
    expect(localStorage.getItem('medchain_user')).toBeNull();
  });

  it('reage ao evento medchain:logout por sessão expirada', async () => {
    localStorage.setItem(
      'medchain_user',
      JSON.stringify({
        email: 'doc@test.com',
        type: 'doctor',
        access_token: 'tok',
        refresh_token: 'ref',
      }),
    );
    authApi.me.mockResolvedValue({ email: 'doc@test.com', role: 'doctor' });

    renderAuth();
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('doc@test.com'));

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent('medchain:logout', { detail: { reason: 'expired' } }),
      );
    });

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('none'));
  });

  it('useAuth fora do provider lança erro', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<AuthProbe />)).toThrow(/AuthProvider/i);
    spy.mockRestore();
  });
});
