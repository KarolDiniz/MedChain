import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  User,
  Mail,
  Lock,
  BadgeCheck,
  GraduationCap,
  ShieldCheck,
  AlertCircle,
  Sun,
  Moon,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import doctorImg from '../../assets/auth-doctor.jpg';
import './LoginPage.css';

function AuthField({ id, label, icon, className = '', ...inputProps }) {
  const Icon = icon;
  return (
    <div className="auth-field">
      <label className="auth-sr-only" htmlFor={id}>{label}</label>
      <div className="auth-input-wrap">
        <Icon className="auth-input-icon" size={18} strokeWidth={2} aria-hidden />
        <input id={id} className={`auth-input ${className}`.trim()} {...inputProps} />
      </div>
    </div>
  );
}

function AuthError({ message }) {
  return (
    <p className="auth-error" role="alert">
      <AlertCircle size={16} strokeWidth={2.25} aria-hidden />
      <span>{message}</span>
    </p>
  );
}

export function LoginPage() {
  const [userType, setUserType] = useState('patient'); // 'patient' | 'doctor'
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
  const [isDark, setIsDark] = useState(() => {
    try {
      return window.localStorage.getItem('theme') === 'dark';
    } catch {
      return false;
    }
  });
  const { user, login, registerDoctor } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.toggle('theme-dark', isDark);
    try {
      window.localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
  }, [isDark]);

  useEffect(() => {
    if (user?.type === 'doctor') {
      navigate('/doctor', { replace: true });
    } else if (user?.type === 'patient') {
      navigate('/patient', { replace: true });
    }
  }, [user?.type, navigate]);

  useEffect(() => {
    if (!redirectTo || !user) return;
    const expectedType = redirectTo === '/doctor' ? 'doctor' : 'patient';
    if (user.type === expectedType) {
      navigate(redirectTo, { replace: true });
    }
  }, [redirectTo, user?.type, navigate]);

  const handleTypeSwitch = (type) => {
    if (type === userType) return;
    setError('');
    setFormKey((k) => k + 1);
    setUserType(type);
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

  const passwordState = `${registerForm.password.length >= 6 ? 'has-success' : ''} ${registerForm.password.length > 0 && registerForm.password.length < 6 ? 'has-error' : ''}`.trim();
  const confirmState = `${error && registerForm.confirmPassword ? 'has-error' : ''} ${registerForm.confirmPassword && registerForm.password === registerForm.confirmPassword && registerForm.confirmPassword.length >= 6 ? 'has-success' : ''}`.trim();

  return (
    <div className="login-page">
      <div className="auth-backdrop" aria-hidden>
        <span className="auth-blob auth-blob--a" />
        <span className="auth-blob auth-blob--b" />
        <span className="auth-blob auth-blob--c" />
      </div>

      <div className={`auth-card ${showRegister ? 'auth-card--register' : ''}`}>
        <aside className="auth-photo">
          <div className="auth-photo-media" aria-hidden>
            <img src={doctorImg} alt="" className="auth-photo-img" />
          </div>

          <div className="auth-photo-logo">
            <span className="auth-photo-mark" aria-hidden>
              <Stethoscope size={16} strokeWidth={2.25} />
            </span>
            <span>MedChain</span>
          </div>

          <span className="auth-photo-chip" aria-hidden>
            <ShieldCheck size={14} strokeWidth={2.25} />
            Registro verificado · SHA-256
          </span>

          <blockquote className="auth-photo-quote">
            <span className="auth-photo-quote-mark" aria-hidden>“</span>
            <p>
              Prontuários médicos com integridade <em>garantida</em> por blockchain.
            </p>
          </blockquote>

          <svg className="auth-photo-curve" viewBox="0 0 60 600" preserveAspectRatio="none" aria-hidden>
            <path d="M60 0 L22 0 C 52 150, 0 250, 30 380 C 52 470, 18 540, 34 600 L60 600 Z" />
          </svg>
        </aside>

        <main className="auth-form-area">
          <div className="auth-topbar">
            <div className="auth-mobile-logo">
              <span className="auth-mobile-mark" aria-hidden>
                <Stethoscope size={20} strokeWidth={2} />
              </span>
              <span>MedChain</span>
            </div>
            <button
              type="button"
              className="auth-theme-toggle"
              onClick={() => setIsDark((prev) => !prev)}
              aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
              title={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
            >
              {isDark ? <Sun size={18} strokeWidth={2} aria-hidden /> : <Moon size={18} strokeWidth={2} aria-hidden />}
            </button>
          </div>

          <div className="auth-form-main">
            {!showRegister ? (
              <div className="auth-form-container">
                <header className="auth-header">
                  <h1 className="auth-title">Bem-vindo de volta!</h1>
                  <p key={formKey} className="auth-subtitle">
                    {userType === 'patient'
                      ? 'Pacientes só podem fazer login. O cadastro é realizado pelo médico.'
                      : 'Entre ou cadastre-se como médico para gerenciar prontuários.'}
                  </p>
                </header>

                <div className="auth-segmented" role="group" aria-label="Tipo de acesso">
                  <span className="auth-segmented-indicator" data-active={userType} aria-hidden />
                  <button
                    type="button"
                    className={`auth-segmented-btn ${userType === 'patient' ? 'is-active' : ''}`}
                    onClick={() => handleTypeSwitch('patient')}
                    aria-pressed={userType === 'patient'}
                  >
                    <User size={17} strokeWidth={2.25} aria-hidden />
                    <span>Paciente</span>
                  </button>
                  <button
                    type="button"
                    className={`auth-segmented-btn ${userType === 'doctor' ? 'is-active' : ''}`}
                    onClick={() => handleTypeSwitch('doctor')}
                    aria-pressed={userType === 'doctor'}
                  >
                    <Stethoscope size={17} strokeWidth={2.25} aria-hidden />
                    <span>Doutor</span>
                  </button>
                </div>

                <form onSubmit={handleLogin} className="auth-form">
                  <AuthField
                    id="login-email"
                    label="E-mail"
                    icon={Mail}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="E-mail"
                    required
                    autoComplete="email"
                  />
                  <AuthField
                    id="login-password"
                    label="Senha"
                    icon={Lock}
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Senha"
                    className={error ? 'has-error' : ''}
                    required
                    autoComplete="current-password"
                  />
                  {error && <AuthError message={error} />}
                  <button type="submit" className="auth-submit" disabled={loading}>
                    <span>{loading ? 'Entrando...' : 'Entrar'}</span>
                    {!loading && <ArrowRight size={18} strokeWidth={2.25} aria-hidden />}
                  </button>
                </form>

                {userType === 'doctor' && (
                  <p className="auth-footer">
                    Não tem conta?{' '}
                    <button
                      type="button"
                      className="auth-link"
                      onClick={() => setShowRegister(true)}
                    >
                      Cadastre-se como doutor
                    </button>
                  </p>
                )}
              </div>
            ) : (
              <div className="auth-form-container auth-form-container--wide">
                <header className="auth-header">
                  <h1 className="auth-title">Cadastro de médico</h1>
                  <p className="auth-subtitle">
                    Crie sua conta para gerenciar prontuários com segurança blockchain
                  </p>
                </header>

                <form onSubmit={handleRegister} className="auth-form auth-form--register">
                  <fieldset className="auth-section">
                    <legend className="auth-sr-only">Informações pessoais</legend>
                    <div className="auth-grid">
                      <AuthField
                        id="register-full-name"
                        label="Nome completo"
                        icon={User}
                        type="text"
                        name="full_name"
                        value={registerForm.full_name}
                        onChange={handleRegisterChange}
                        placeholder="Nome completo"
                        required
                        autoComplete="name"
                      />
                      <AuthField
                        id="register-email"
                        label="E-mail"
                        icon={Mail}
                        type="email"
                        name="email"
                        value={registerForm.email}
                        onChange={handleRegisterChange}
                        placeholder="E-mail"
                        required
                        autoComplete="email"
                      />
                    </div>
                  </fieldset>

                  <fieldset className="auth-section">
                    <legend className="auth-sr-only">Informações profissionais</legend>
                    <div className="auth-grid">
                      <AuthField
                        id="register-crm"
                        label="CRM"
                        icon={BadgeCheck}
                        type="text"
                        name="CRM"
                        value={registerForm.CRM}
                        onChange={handleRegisterChange}
                        placeholder="CRM (ex: 12345-SP)"
                        required
                      />
                      <AuthField
                        id="register-specialty"
                        label="Especialidade"
                        icon={GraduationCap}
                        type="text"
                        name="specialty"
                        value={registerForm.specialty}
                        onChange={handleRegisterChange}
                        placeholder="Especialidade"
                        required
                      />
                    </div>
                  </fieldset>

                  <fieldset className="auth-section">
                    <legend className="auth-sr-only">Segurança</legend>
                    <div className="auth-grid">
                      <AuthField
                        id="register-password"
                        label="Senha"
                        icon={Lock}
                        type="password"
                        name="password"
                        value={registerForm.password}
                        onChange={handleRegisterChange}
                        placeholder="Senha (mín. 6)"
                        className={passwordState}
                        required
                        autoComplete="new-password"
                      />
                      <AuthField
                        id="register-confirm-password"
                        label="Confirmar senha"
                        icon={Lock}
                        type="password"
                        name="confirmPassword"
                        value={registerForm.confirmPassword}
                        onChange={handleRegisterChange}
                        placeholder="Confirmar senha"
                        className={confirmState}
                        required
                        autoComplete="new-password"
                      />
                    </div>
                  </fieldset>

                  {error && <AuthError message={error} />}

                  <button type="submit" className="auth-submit" disabled={loading}>
                    <span>{loading ? 'Cadastrando...' : 'Criar conta médica'}</span>
                    {!loading && <ArrowRight size={18} strokeWidth={2.25} aria-hidden />}
                  </button>

                  <p className="auth-register-trust">
                    Seus dados clínicos ficam protegidos no servidor; a integridade é comprovada por hash na blockchain.
                  </p>
                </form>

                <p className="auth-footer">
                  Já possui uma conta?{' '}
                  <button
                    type="button"
                    className="auth-link"
                    onClick={() => { setShowRegister(false); setError(''); }}
                  >
                    Fazer login
                  </button>
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      <p className="auth-legal">© {new Date().getFullYear()} MedChain · Prontuários com integridade verificável</p>
    </div>
  );
}
