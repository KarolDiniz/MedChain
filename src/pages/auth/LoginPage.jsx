import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, User, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import humanBlockchainImg from '../../assets/human-blockchain-saude.png';
import './LoginPage.css';

export function LoginPage() {
  const [userType, setUserType] = useState('patient'); // 'patient' | 'doctor'
  const [isSwapping, setIsSwapping] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirectTo, setRedirectTo] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const [registerForm, setRegisterForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    CRM: '',
    specialty: '',
  });
  const { user, login, registerDoctor } = useAuth();
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
    setIsSwapping(true);
    setError('');
    // Imagem some (200ms) + login desliza (400ms) = ~600ms total
    const FADE_MS = 200;
    const SLIDE_MS = 400;
    setTimeout(() => {
      setFormKey((k) => k + 1);
      setUserType(type);
      setIsSwapping(false);
    }, FADE_MS + SLIDE_MS);
  };

  const handleRegisterChange = (e) => {
    setRegisterForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (registerForm.password !== registerForm.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (registerForm.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      const result = await registerDoctor(registerForm);
      if (result.success) setRedirectTo('/doctor');
      else setError(result.error);
    } finally {
      setLoading(false);
    }
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
        {/* Vetores tecnológicos sutis */}
        <svg className="login-bg-vectors" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <defs>
            <pattern id="techGrid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(50,224,196,0.05)" strokeWidth="0.3" />
            </pattern>
            <pattern id="dotNet" width="15" height="15" patternUnits="userSpaceOnUse">
              <circle cx="7.5" cy="7.5" r="0.4" fill="rgba(50,70,95,0.06)" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#techGrid)" />
          <rect width="100" height="100" fill="url(#dotNet)" />
          <line x1="0" y1="30" x2="100" y2="30" stroke="rgba(50,224,196,0.04)" strokeWidth="0.5" className="bg-line" />
          <line x1="0" y1="70" x2="100" y2="70" stroke="rgba(50,224,196,0.04)" strokeWidth="0.5" className="bg-line" />
          <line x1="20" y1="0" x2="20" y2="100" stroke="rgba(50,224,196,0.04)" strokeWidth="0.5" className="bg-line" />
          <line x1="80" y1="0" x2="80" y2="100" stroke="rgba(50,224,196,0.04)" strokeWidth="0.5" className="bg-line" />
          <path d="M0,50 Q25,30 50,50 T100,50" fill="none" className="bg-curve" stroke="rgba(50,70,95,0.05)" strokeWidth="0.4" />
          <path d="M0,80 Q50,60 100,80" fill="none" className="bg-curve" stroke="rgba(50,224,196,0.04)" strokeWidth="0.4" />
          <polygon points="0,0 100,0 50,100" fill="none" stroke="rgba(50,224,196,0.03)" strokeWidth="0.3" className="bg-poly" />
        </svg>
        <div className="login-bg-particles">
          {[...Array(24)].map((_, i) => (
            <div key={i} className="login-particle" style={{ '--i': i }} />
          ))}
        </div>
        <div className="login-bg-grid" />
      </div>

      <div className={`login-panel ${showRegister ? 'login-panel--register' : ''} ${isSwapping ? 'login-panel--swapping' : ''}`}>
        <div className="login-panel-bg" aria-hidden />
        {/* Pontos de luz espalhados no painel */}
        <div className="login-panel-dots" aria-hidden>
          {[
            { t: 5, l: 8 }, { t: 12, l: 45 }, { t: 22, l: 85 }, { t: 35, l: 15 },
            { t: 48, l: 72 }, { t: 55, l: 32 }, { t: 68, l: 92 }, { t: 78, l: 55 },
            { t: 88, l: 22 }, { t: 8, l: 65 }, { t: 18, l: 28 }, { t: 42, l: 48 },
            { t: 62, l: 12 }, { t: 72, l: 78 }, { t: 95, l: 42 }, { t: 3, l: 35 },
            { t: 28, l: 92 }, { t: 52, l: 8 }, { t: 82, l: 65 }, { t: 15, l: 58 },
            { t: 38, l: 25 }, { t: 58, l: 85 }, { t: 75, l: 38 }, { t: 92, l: 72 },
            { t: 7, l: 22 }, { t: 45, l: 55 }, { t: 65, l: 28 }, { t: 25, l: 75 },
            { t: 85, l: 48 }, { t: 33, l: 12 }, { t: 52, l: 88 }, { t: 18, l: 42 },
            { t: 72, l: 52 }, { t: 95, l: 18 }, { t: 12, l: 92 }, { t: 58, l: 35 },
            { t: 38, l: 68 }, { t: 82, l: 22 }, { t: 5, l: 58 }, { t: 48, l: 5 },
            { t: 68, l: 75 }, { t: 28, l: 38 }, { t: 88, l: 65 },
            { t: 14, l: 18 }, { t: 52, l: 62 }, { t: 78, l: 32 }, { t: 42, l: 78 },
            { t: 6, l: 52 }, { t: 92, l: 88 }, { t: 35, l: 48 }, { t: 65, l: 5 },
            { t: 22, l: 72 }, { t: 58, l: 42 }, { t: 85, l: 65 }, { t: 18, l: 12 },
            { t: 48, l: 28 }, { t: 72, l: 92 }, { t: 32, l: 55 }, { t: 95, l: 35 },
          ].map((pos, i) => (
            <div key={i} className="login-panel-dot" style={{ '--pt': pos.t, '--pl': pos.l, '--pi': i }} />
          ))}
        </div>
        <aside className={`login-illustration ${showRegister ? 'login-illustration--hidden' : `login-illustration--${userType}`}`} aria-hidden>
          <div className="login-illus-wrapper">
            <img
              src={humanBlockchainImg}
              alt=""
              className="login-illus-img"
            />
            {/* Partículas flutuantes */}
            <div className="login-illus-particles">
              {[...Array(30)].map((_, i) => (
                <div key={i} className="login-illus-particle" style={{ '--pi': i }} />
              ))}
            </div>
            {/* Nós blockchain + linhas conectando */}
            <svg className="login-illus-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="blockchainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00ffff" />
                  <stop offset="100%" stopColor="#32465f" />
                </linearGradient>
                <filter id="nodeGlow">
                  <feGaussianBlur stdDeviation="0.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <g className="login-illus-lines">
                <line x1="15" y1="20" x2="45" y2="35" stroke="url(#blockchainGrad)" strokeWidth="0.3" fill="none" className="conn c1" />
                <line x1="50" y1="40" x2="75" y2="25" stroke="url(#blockchainGrad)" strokeWidth="0.3" fill="none" className="conn c2" />
                <line x1="25" y1="55" x2="55" y2="70" stroke="url(#blockchainGrad)" strokeWidth="0.3" fill="none" className="conn c3" />
                <line x1="60" y1="75" x2="85" y2="60" stroke="url(#blockchainGrad)" strokeWidth="0.3" fill="none" className="conn c4" />
                <line x1="20" y1="45" x2="80" y2="50" stroke="url(#blockchainGrad)" strokeWidth="0.3" fill="none" className="conn c5" />
                <line x1="35" y1="15" x2="70" y2="55" stroke="url(#blockchainGrad)" strokeWidth="0.3" fill="none" className="conn c6" />
              </g>
            </svg>
            {/* Pontos luminosos pulsando - pequenos e espalhados */}
            <div className="login-illus-dots">
              {[
                { t: 8, l: 15 }, { t: 18, l: 72 }, { t: 25, l: 28 }, { t: 42, l: 85 },
                { t: 55, l: 12 }, { t: 68, l: 45 }, { t: 12, l: 55 }, { t: 35, l: 18 },
                { t: 75, l: 78 }, { t: 88, l: 32 }, { t: 5, l: 90 }, { t: 48, l: 62 },
                { t: 22, l: 42 }, { t: 62, l: 8 }, { t: 82, l: 55 }, { t: 38, l: 88 },
                { t: 3, l: 38 }, { t: 45, l: 5 }, { t: 92, l: 68 }, { t: 15, l: 92 },
                { t: 58, l: 35 }, { t: 72, l: 18 }, { t: 28, l: 75 }, { t: 95, l: 48 },
                { t: 8, l: 58 }, { t: 52, l: 82 }, { t: 38, l: 25 }, { t: 85, l: 12 },
                { t: 18, l: 35 }, { t: 65, l: 72 }, { t: 42, l: 48 }, { t: 78, l: 92 },
                { t: 32, l: 8 }, { t: 52, l: 45 }, { t: 88, l: 78 }, { t: 12, l: 38 },
                { t: 68, l: 22 }, { t: 35, l: 82 }, { t: 95, l: 15 }, { t: 5, l: 65 },
                { t: 72, l: 52 }, { t: 48, l: 28 }, { t: 22, l: 88 }, { t: 82, l: 42 },
                { t: 55, l: 68 }, { t: 15, l: 22 }, { t: 78, l: 45 }, { t: 38, l: 52 },
                { t: 92, l: 12 }, { t: 8, l: 78 }, { t: 62, l: 35 }, { t: 28, l: 85 },
                { t: 45, l: 18 }, { t: 75, l: 62 }, { t: 18, l: 58 }, { t: 85, l: 38 },
              ].map((pos, i) => (
                <div key={i} className="login-illus-dot" style={{ '--dt': pos.t, '--dl': pos.l, '--di': i }} />
              ))}
            </div>
          </div>
        </aside>

      <div className={`login-wrapper ${showRegister ? 'login-wrapper--full' : `login-wrapper--${userType}`}`}>
        {!showRegister ? (
        <div className={`login-container login-fade-in login-container--${userType}`} data-user-type={userType}>
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

          <div className={`login-type-selector ${isSwapping ? 'is-disabled' : ''}`}>
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

          {userType === 'patient' && (
            <p className="login-register-hint" style={{ visibility: 'hidden' }} aria-hidden>
              Não tem conta? Cadastre-se como paciente
            </p>
          )}
          {userType === 'doctor' && (
            <p className="login-register-hint">
              Não tem conta?{' '}
              <button
                type="button"
                className="login-register-link"
                onClick={() => setShowRegister(true)}
              >
                Cadastre-se como doutor
              </button>
            </p>
          )}

        </div>
        ) : (
        <div className="login-container login-container--register login-fade-in">
          <header className="login-header">
            <div className="login-logo">
              <span className="login-logo-icon">
                <Stethoscope size={44} strokeWidth={1.8} />
              </span>
            </div>
            <h1 className="login-title">MedChain</h1>
            <p className="login-tagline">Cadastro exclusivo para profissionais de saúde</p>
          </header>
          <p className="login-register-note">
            O cadastro de pacientes é realizado apenas pelo doutor, dentro do sistema.
          </p>
          <form onSubmit={handleRegister} className="login-form login-form--register">
            <div className="login-input-wrap login-input-wrap--no-icon">
              <input
                type="text"
                name="full_name"
                value={registerForm.full_name}
                onChange={handleRegisterChange}
                placeholder="Nome completo"
                className="login-input"
                required
              />
            </div>
            <div className="login-input-wrap">
              <Mail className="login-input-icon" size={20} strokeWidth={2} />
              <input
                type="email"
                name="email"
                value={registerForm.email}
                onChange={handleRegisterChange}
                placeholder="E-mail"
                className="login-input"
                required
              />
            </div>
            <div className="login-input-wrap login-input-wrap--no-icon">
              <input
                type="text"
                name="CRM"
                value={registerForm.CRM}
                onChange={handleRegisterChange}
                placeholder="CRM (ex: 12345-SP)"
                className="login-input"
                required
              />
            </div>
            <div className="login-input-wrap login-input-wrap--no-icon">
              <input
                type="text"
                name="specialty"
                value={registerForm.specialty}
                onChange={handleRegisterChange}
                placeholder="Especialidade"
                className="login-input"
                required
              />
            </div>
            <div className="login-input-wrap">
              <Lock className="login-input-icon" size={20} strokeWidth={2} />
              <input
                type="password"
                name="password"
                value={registerForm.password}
                onChange={handleRegisterChange}
                placeholder="Senha (mín. 6 caracteres)"
                className="login-input"
                required
              />
            </div>
            <div className="login-input-wrap">
              <Lock className="login-input-icon" size={20} strokeWidth={2} />
              <input
                type="password"
                name="confirmPassword"
                value={registerForm.confirmPassword}
                onChange={handleRegisterChange}
                placeholder="Confirmar senha"
                className={`login-input ${error ? 'has-error' : ''}`}
                required
              />
            </div>
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="login-submit" disabled={loading}>
              <span className="login-submit-text">
                {loading ? 'Cadastrando...' : 'Cadastrar'}
              </span>
            </button>
          </form>
          <p className="login-register-hint">
            Já tem conta?{' '}
            <button type="button" className="login-register-link" onClick={() => { setShowRegister(false); setError(''); }}>
              Entrar
            </button>
          </p>
        </div>
        )}
      </div>
      </div>
    </div>
  );
}
