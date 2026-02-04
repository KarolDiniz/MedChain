import { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_DOCTORS, MOCK_PATIENTS } from '../data/mockData';

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

  const login = (email, password, userType) => {
    const collection = userType === 'doctor' ? MOCK_DOCTORS : MOCK_PATIENTS;
    const found = collection.find(u => u.email === email && u.password === password);
    if (found) {
      const userData = { ...found };
      delete userData.password;
      setUser(userData);
      localStorage.setItem('medchain_user', JSON.stringify(userData));
      return { success: true };
    }
    return { success: false, error: 'E-mail ou senha incorretos.' };
  };

  const registerDoctor = (data) => {
    const exists = MOCK_DOCTORS.some(d => d.email === data.email);
    if (exists) return { success: false, error: 'E-mail já cadastrado.' };
    
    const newDoctor = {
      id: `doc-${Date.now()}`,
      type: 'doctor',
      full_name: data.full_name,
      email: data.email,
      password: data.password,
      status: 'ACTIVE',
      CRM: data.CRM,
      specialty: data.specialty,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };
    
    MOCK_DOCTORS.push(newDoctor);
    const userData = { ...newDoctor };
    delete userData.password;
    setUser(userData);
    localStorage.setItem('medchain_user', JSON.stringify(userData));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('medchain_user');
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
