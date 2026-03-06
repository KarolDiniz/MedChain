import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

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

  const login = async (email, password, userType) => {
    try {
      const res = await authApi.login(email, password);
      const userData = {
        ...res.user,
        type: res.user.role === 'doctor' ? 'doctor' : 'patient',
        access_token: res.access_token,
        refresh_token: res.refresh_token,
      };
      setUser(userData);
      localStorage.setItem('medchain_user', JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      const msg = err?.data?.detail || err?.message || 'E-mail ou senha incorretos.';
      return { success: false, error: msg };
    }
  };

  const registerDoctor = async (data) => {
    try {
      const res = await authApi.registerDoctor(data);
      const userData = {
        ...res.user,
        type: 'doctor',
        access_token: res.access_token,
        refresh_token: res.refresh_token,
      };
      setUser(userData);
      localStorage.setItem('medchain_user', JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      const msg = err?.data?.detail || err?.message || 'Erro ao cadastrar.';
      return { success: false, error: typeof msg === 'string' ? msg : JSON.stringify(msg) };
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
