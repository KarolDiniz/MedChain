import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, User, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './LoginPage.css';

export function LoginPage() {
  const [userType, setUserType] = useState('patient'); // 'patient' | 'doctor'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirectTo, setRedirectTo] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!redirectTo || !user) return;
    const expectedType = redirectTo === '/doctor' ? 'doctor' : 'patient';
    if (user.type === expectedType) {
      navigate(redirectTo, { replace: true });
    }
  }, [redirectTo, user?.type, navigate]);

  const handleTypeSwitch = (type) => {
    if (type === userType) return;
    setFormKey((k) => k + 1);
    setUserType(type);
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        setRedirectTo(result.type === 'doctor' ? '/doctor' : '/patient');
      } else {
        setError(result.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-bg-gradient" />
        <div className="login-bg-mesh" />
        <div className="login-bg-particles">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="login-particle" style={{ '--i': i }} />
          ))}
        </div>
        <div className="login-bg-grid" />
      </div>

      <div className="login-wrapper">
        <div className="login-container login-fade-in">
          <header className="login-header">
            <div className="login-logo">
              <span className="login-logo-icon">
                <Stethoscope size={44} strokeWidth={1.8} />
              </span>
            </div>
            <h1 className="login-title">MedChain</h1>
            <p className="login-tagline">
              Prontuários médicos com integridade garantida por blockchain
            </p>
          </header>

          <div className="login-type-selector">
            <div className="login-type-track">
              <div
                className="login-type-indicator"
                data-active={userType}
                aria-hidden
              />
              <button
                type="button"
                className={`login-type-btn ${userType === 'patient' ? 'is-active' : ''}`}
                onClick={() => handleTypeSwitch('patient')}
              >
                <User size={18} strokeWidth={2.5} />
                <span>Paciente</span>
              </button>
              <span className="login-type-divider" aria-hidden />
              <button
                type="button"
                className={`login-type-btn ${userType === 'doctor' ? 'is-active' : ''}`}
                onClick={() => handleTypeSwitch('doctor')}
              >
                <Stethoscope size={18} strokeWidth={2.5} />
                <span>Doutor</span>
              </button>
            </div>
          </div>

          <div
            key={formKey}
            className={`login-message login-message--${userType}`}
          >
            {userType === 'patient' ? (
              <p>
                Pacientes só podem fazer login. O cadastro é realizado pelo
                médico.
              </p>
            ) : (
              <p>
                Entre ou cadastre-se como médico para gerenciar prontuários.
              </p>
            )}
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="login-input-wrap">
              <Mail className="login-input-icon" size={20} strokeWidth={2} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail"
                className="login-input"
                required
                autoComplete="email"
              />
            </div>
            <div className="login-input-wrap">
              <Lock className="login-input-icon" size={20} strokeWidth={2} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
                className={`login-input ${error ? 'has-error' : ''}`}
                required
                autoComplete="current-password"
              />
            </div>
            {error && <p className="login-error">{error}</p>}
            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              <span className="login-submit-text">
                {loading ? 'Entrando...' : 'Entrar'}
              </span>
            </button>
          </form>

          {userType === 'doctor' && (
            <p className="login-register-hint">
              Não tem conta?{' '}
              <button
                type="button"
                className="login-register-link"
                onClick={() => navigate('/register')}
              >
                Cadastre-se como doutor
              </button>
            </p>
          )}

          <p className="login-demo">
            Demo: use senha <strong>12345</strong> para qualquer usuário
            cadastrado
          </p>
        </div>
      </div>
    </div>
  );
}
