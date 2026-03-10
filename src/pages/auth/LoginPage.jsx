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

      <div className="login-panel">
        <div className="login-panel-bg" aria-hidden />
        <aside className="login-illustration" aria-hidden>
        <svg
          viewBox="0 0 500 500"
          className="login-illus-svg"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="medGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#32e0c4" />
              <stop offset="100%" stopColor="#0d7377" />
            </linearGradient>
            <linearGradient id="medGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#5b8def" />
              <stop offset="100%" stopColor="#32e0c4" />
            </linearGradient>
          </defs>
          <g className="login-illus-nodes">
            <circle cx="120" cy="100" r="8" fill="url(#medGrad1)" opacity="0.9" className="node n1" />
            <circle cx="180" cy="140" r="8" fill="url(#medGrad1)" opacity="0.8" className="node n2" />
            <circle cx="250" cy="100" r="10" fill="url(#medGrad1)" opacity="0.95" className="node n3" />
            <circle cx="320" cy="140" r="8" fill="url(#medGrad1)" opacity="0.8" className="node n4" />
            <circle cx="380" cy="100" r="8" fill="url(#medGrad1)" opacity="0.9" className="node n5" />
            <circle cx="100" cy="250" r="6" fill="url(#medGrad2)" opacity="0.7" className="node n6" />
            <circle cx="400" cy="250" r="6" fill="url(#medGrad2)" opacity="0.7" className="node n7" />
          </g>
          <g className="login-illus-lines">
            <line x1="128" y1="104" x2="172" y2="136" stroke="url(#medGrad1)" strokeWidth="2" opacity="0.5" className="conn" />
            <line x1="188" y1="136" x2="242" y2="104" stroke="url(#medGrad1)" strokeWidth="2" opacity="0.5" className="conn" />
            <line x1="258" y1="104" x2="312" y2="136" stroke="url(#medGrad1)" strokeWidth="2" opacity="0.5" className="conn" />
            <line x1="328" y1="136" x2="372" y2="104" stroke="url(#medGrad1)" strokeWidth="2" opacity="0.5" className="conn" />
          </g>
          <g className="login-illus-cross" transform="translate(250, 250)">
            <rect x="-20" y="-60" width="40" height="120" rx="8" fill="url(#medGrad1)" className="cross-v" />
            <rect x="-60" y="-20" width="120" height="40" rx="8" fill="url(#medGrad1)" className="cross-h" />
            <circle cx="0" cy="0" r="24" fill="#0a2e2c" stroke="url(#medGrad1)" strokeWidth="3" className="cross-center" />
            <path d="M-8 0 L-2 6 L8 -6" stroke="#32e0c4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" className="cross-check" />
          </g>
          <path
            d="M80 350 L120 330 L160 350 L200 290 L240 350 L280 310 L320 350 L360 330 L400 350 L420 340"
            stroke="url(#medGrad2)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity="0.9"
            className="login-illus-heartbeat"
          />
          <ellipse cx="250" cy="250" rx="180" ry="180" stroke="rgba(50,224,196,0.15)" strokeWidth="1" fill="none" className="ring r1" />
          <ellipse cx="250" cy="250" rx="220" ry="220" stroke="rgba(91,141,239,0.1)" strokeWidth="1" fill="none" className="ring r2" />
        </svg>
      </aside>

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

          <p className="login-trust-badge">
            <span className="login-trust-icon" aria-hidden>🔒</span>
            Sua saúde protegida por tecnologia blockchain
          </p>
        </div>
      </div>
      </div>
    </div>
  );
}
