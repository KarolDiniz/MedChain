import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

function buildUserData(res, type) {
  return {
    ...res.user,
    type,
    access_token: res.access_token,
    refresh_token: res.refresh_token,
  };
}

function parseApiError(err) {
  const raw = err?.data?.detail ?? err?.message ?? '';
  if (Array.isArray(raw)) return raw[0]?.msg ?? String(raw);
  return typeof raw === 'string' ? raw : (raw?.msg ?? JSON.stringify(raw));
}

function isAlreadyExistsError(msg) {
  const s = String(msg || '').toLowerCase();
  return s.includes('ja existe') || s.includes('already exists');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('medchain_user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      } catch {
        localStorage.removeItem('medchain_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await authApi.login(email, password);
      const role = (res.user?.role || '').toLowerCase();
      const type = role === 'doctor' ? 'doctor' : 'patient';
      const userData = buildUserData(res, type);
      setUser(userData);
      localStorage.setItem('medchain_user', JSON.stringify(userData));
      return { success: true, type };
    } catch (err) {
      if (err?.message === 'Failed to fetch') {
        return { success: false, error: 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.' };
      }
      return { success: false, error: parseApiError(err) || 'E-mail ou senha incorretos.' };
    }
  };

  const registerDoctor = async (data) => {
    try {
      const res = await authApi.registerDoctor(data);
      const userData = buildUserData(res, 'doctor');
      setUser(userData);
      localStorage.setItem('medchain_user', JSON.stringify(userData));
      return { success: true, type: 'doctor' };
    } catch (err) {
      const msgStr = parseApiError(err);
      if (isAlreadyExistsError(msgStr)) {
        try {
          await authApi.completeDoctor(data);
          const loginRes = await authApi.login(data.email, data.password);
          const userData = buildUserData(loginRes, 'doctor');
          setUser(userData);
          localStorage.setItem('medchain_user', JSON.stringify(userData));
          return { success: true, type: 'doctor' };
        } catch (completeErr) {
          return { success: false, error: parseApiError(completeErr) || 'Erro ao completar cadastro.' };
        }
      }
      if (err?.message === 'Failed to fetch') {
        return { success: false, error: 'Não foi possível conectar ao servidor. Verifique se o backend está rodando.' };
      }
      return { success: false, error: msgStr || 'Erro ao cadastrar.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('medchain_user');
    authApi.logout().catch(() => {});
  };

  const isDoctor = () => user?.type === 'doctor';
  const isPatient = () => user?.type === 'patient';

  return (
    <AuthContext.Provider value={{ user, loading, login, registerDoctor, logout, isDoctor, isPatient }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
}
