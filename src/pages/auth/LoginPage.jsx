import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, User, Mail, Lock, BadgeCheck, GraduationCap } from 'lucide-react';
import { PolygonBackground, createTheme } from 'polygon-background';
import { useAuth } from '../../contexts/AuthContext';
import humanBlockchainImg from '../../assets/human-blockchain-saude.png';
import './LoginPage.css';

const medchainTheme = createTheme('ocean', {
  gradientStart: '#152a45',
  gradientEnd: '#163842',
  backgroundColor: '#152a45',
  strokeColor: 'rgba(0, 255, 255, 0.1)',
  strokeWidth: 0.35,
  lightColor: 'rgba(0, 255, 255, 0.35)',
  pointColor: 'rgba(0, 255, 255, 0.2)',
  fillOpacity: 0.2,
});

export function LoginPage() {
  const [userType, setUserType] = useState('patient'); // 'patient' | 'doctor'
  const [isSwapping, setIsSwapping] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const meshRef = useRef(null);
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

  const panelDots = useMemo(() => {
    const dots = [];
    for (let i = 0; i < 72; i++) {
      const a = (i * 137.508) % 360;
      const r = 35 + ((i * 41 + 17) % 25);
      const t = 50 + r * Math.sin((a * Math.PI) / 180) + ((i * 7) % 11) - 5;
      const l = 50 + r * Math.cos((a * Math.PI) / 180) + ((i * 13) % 9) - 4;
      dots.push({
        t: Math.max(2, Math.min(98, t)),
        l: Math.max(2, Math.min(98, l)),
        s: 1 + ((i * 23 + i) % 4),
        lum: 0.35 + ((i * 67 + 31) % 8) / 12,
      });
    }
    return dots;
  }, []);

  const illusDots = useMemo(() => {
    const dots = [];
    for (let i = 0; i < 110; i++) {
      const a = (i * 99.73 + 127) % 360;
      const r = 20 + ((i * 53 + 7) % 38);
      const t = 50 + r * Math.sin((a * Math.PI) / 180) + ((i * 19) % 13) - 6;
      const l = 50 + r * Math.cos((a * Math.PI) / 180) + ((i * 29) % 11) - 5;
      dots.push({
        t: Math.max(2, Math.min(98, t)),
        l: Math.max(2, Math.min(98, l)),
        s: 2 + ((i * 17 + i * 3) % 4),
        lum: 0.55 + ((i * 43 + 19) % 10) / 12,
      });
    }
    return dots;
  }, []);

  useEffect(() => {
    if (!meshRef.current) return;
    const bg = new PolygonBackground(meshRef.current, {
      theme: medchainTheme,
      pointCount: 100,
      speed: 0.2,
      mouse: {
        enabled: true,
        mode: 'push',
        strength: 28,
        radius: 160,
        springBack: 0.02,
        velocityInfluence: 0.1,
      },
      interaction: { clickShockwave: false, holdGravityWell: false },
    });
    return () => bg.destroy();
  }, []);

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
        <div ref={meshRef} className="login-bg-polygon-mesh" aria-hidden />
        <div className="login-bg-grid" />
      </div>

      <div className={`login-panel ${showRegister ? 'login-panel--register' : ''} ${isSwapping ? 'login-panel--swapping' : ''}`}>
        {!showRegister && <div className="login-panel-bg" aria-hidden />}
        {!showRegister && (
        <div className="login-panel-dots" aria-hidden>
          {panelDots.map((d, i) => (
            <div
              key={i}
              className="login-panel-dot"
              style={{ '--pt': d.t, '--pl': d.l, '--ps': d.s, '--plum': d.lum, '--pi': i }}
            />
          ))}
        </div>
        )}
        <aside className={`login-illustration ${showRegister ? 'login-illustration--hidden' : `login-illustration--${userType}`}`} aria-hidden>
          <div className="login-illus-wrapper">
            <img
              src={humanBlockchainImg}
              alt=""
              className="login-illus-img"
            />
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
            <div className="login-illus-dots" aria-hidden>
              {illusDots.map((d, i) => (
                <div
                  key={i}
                  className="login-illus-dot"
                  style={{ '--dt': d.t, '--dl': d.l, '--ds': d.s, '--dlum': d.lum, '--di': i }}
                />
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
          <div className="login-register-dots" aria-hidden />
          <header className="login-register-header">
            <div className="login-register-logo">
              <Stethoscope size={26} strokeWidth={1.8} />
            </div>
            <h1 className="login-register-title">Cadastro de médico</h1>
            <p className="login-register-subtitle">
              Crie sua conta para gerenciar prontuários com segurança blockchain
            </p>
          </header>

          <form onSubmit={handleRegister} className="login-form login-form--register">
            <section className="login-register-block">
              <h3 className="login-register-block-title">Informações pessoais</h3>
              <div className="login-form-grid">
                <div className="login-input-wrap">
                  <User className="login-input-icon" size={18} strokeWidth={2} />
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
                  <Mail className="login-input-icon" size={18} strokeWidth={2} />
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
              </div>
            </section>

            <section className="login-register-block">
              <h3 className="login-register-block-title">Informações profissionais</h3>
              <div className="login-form-grid">
                <div className="login-input-wrap">
                  <BadgeCheck className="login-input-icon" size={18} strokeWidth={2} />
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
                <div className="login-input-wrap">
                  <GraduationCap className="login-input-icon" size={18} strokeWidth={2} />
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
              </div>
            </section>

            <section className="login-register-block">
              <h3 className="login-register-block-title">Segurança</h3>
              <div className="login-form-grid">
                <div className="login-input-wrap">
                  <Lock className="login-input-icon" size={18} strokeWidth={2} />
                  <input
                    type="password"
                    name="password"
                    value={registerForm.password}
                    onChange={handleRegisterChange}
                    placeholder="Senha (mín. 6 caracteres)"
                    className={`login-input ${registerForm.password.length >= 6 ? 'has-success' : ''} ${registerForm.password.length > 0 && registerForm.password.length < 6 ? 'has-error' : ''}`}
                    required
                  />
                </div>
                <div className="login-input-wrap">
                  <Lock className="login-input-icon" size={18} strokeWidth={2} />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={registerForm.confirmPassword}
                    onChange={handleRegisterChange}
                    placeholder="Confirmar senha"
                    className={`login-input ${error && registerForm.confirmPassword ? 'has-error' : ''} ${registerForm.confirmPassword && registerForm.password === registerForm.confirmPassword && registerForm.confirmPassword.length >= 6 ? 'has-success' : ''}`}
                    required
                  />
                </div>
              </div>
            </section>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" className="login-submit login-submit--register" disabled={loading}>
              <span className="login-submit-text">
                {loading ? 'Cadastrando...' : 'Criar conta médica'}
              </span>
            </button>

            <p className="login-register-trust">
              Seus dados são criptografados e protegidos por blockchain.
            </p>
          </form>

          <p className="login-register-footer">
            Já possui uma conta?{' '}
            <button type="button" className="login-register-link login-register-link--back" onClick={() => { setShowRegister(false); setError(''); }}>
              Fazer login
            </button>
          </p>
        </div>
        )}
      </div>
      </div>
    </div>
  );
}
