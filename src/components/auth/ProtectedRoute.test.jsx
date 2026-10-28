import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from './ProtectedRoute';

const authState = vi.hoisted(() => ({
  user: null,
  loading: false,
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => authState,
}));

function renderProtected({ requireDoctor, requirePatient } = {}) {
  return render(
    <MemoryRouter initialEntries={['/secure']}>
      <Routes>
        <Route path="/" element={<div>login</div>} />
        <Route path="/doctor" element={<div>doctor-home</div>} />
        <Route path="/patient" element={<div>patient-home</div>} />
        <Route
          path="/secure"
          element={
            <ProtectedRoute requireDoctor={requireDoctor} requirePatient={requirePatient}>
              <div>protegido</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    authState.user = null;
    authState.loading = false;
  });

  it('mostra loading enquanto autenticação carrega', () => {
    authState.loading = true;
    renderProtected({ requireDoctor: true });
    expect(screen.getByText(/Carregando/i)).toBeInTheDocument();
  });

  it('redireciona para login quando não autenticado', () => {
    renderProtected({ requireDoctor: true });
    expect(screen.getByText('login')).toBeInTheDocument();
  });

  it('bloqueia paciente em rota de médico', () => {
    authState.user = { type: 'patient' };
    renderProtected({ requireDoctor: true });
    expect(screen.getByText('patient-home')).toBeInTheDocument();
  });

  it('bloqueia médico em rota de paciente', () => {
    authState.user = { type: 'doctor' };
    renderProtected({ requirePatient: true });
    expect(screen.getByText('doctor-home')).toBeInTheDocument();
  });

  it('renderiza children quando papel é permitido', () => {
    authState.user = { type: 'doctor' };
    renderProtected({ requireDoctor: true });
    expect(screen.getByText('protegido')).toBeInTheDocument();
  });
});
