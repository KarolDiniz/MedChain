import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import './LoginPage.css';

export function LoginPage() {
  const [mode, setMode] = useState('select'); // select | patient | doctor
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(email, password);
    if (result.success) {
      navigate(result.type === 'doctor' ? '/doctor' : '/patient');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-bg-pattern" />
        <div className="login-bg-gradient" />
      </div>
      <div className="login-container">
        <div className="login-brand">
          <span className="login-brand-icon">
            <Stethoscope size={48} strokeWidth={1.5} />
          </span>
          <h1>MedChain</h1>
          <p>Prontuários médicos com integridade garantida por blockchain</p>
        </div>
        <Card className="login-card">
          {mode === 'select' ? (
            <>
              <h2>Como deseja entrar?</h2>
              <div className="login-options">
                <button
                  type="button"
                  className="login-option"
                  onClick={() => setMode('patient')}
                >
                  <span className="login-option-icon">
                    <User size={32} strokeWidth={1.5} />
                  </span>
                  <span className="login-option-title">Sou Paciente</span>
                  <span className="login-option-desc">Somente login (cadastro pelo médico)</span>
                </button>
                <button
                  type="button"
                  className="login-option"
                  onClick={() => setMode('doctor')}
                >
                  <span className="login-option-icon">
                    <Stethoscope size={32} strokeWidth={1.5} />
                  </span>
                  <span className="login-option-title">Sou Doutor</span>
                  <span className="login-option-desc">Entrar ou cadastrar</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                className="login-back"
                onClick={() => {
                  setMode('select');
                  setEmail('');
                  setPassword('');
                  setError('');
                }}
              >
                ← Voltar
              </button>
              <h2>
                {mode === 'patient' ? 'Entrar como Paciente' : 'Entrar como Doutor'}
              </h2>
              {mode === 'doctor' && (
                <p className="login-subtitle">
                  Não tem conta?{' '}
                  <button
                    type="button"
                    className="login-link"
                    onClick={() => navigate('/register')}
                  >
                    Cadastre-se como doutor
                  </button>
                </p>
              )}
              {mode === 'patient' && (
                <p className="login-subtitle login-subtitle--info">
                  Pacientes só podem fazer login. O cadastro é feito pelo médico.
                </p>
              )}
              <form onSubmit={handleLogin} className="login-form">
                <Input
                  label="E-mail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                />
                <Input
                  label="Senha"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="12345 (demo)"
                  required
                  error={error}
                />
                <Button type="submit" size="lg" className="login-submit">
                  Entrar
                </Button>
              </form>
              <p className="login-demo">
                Demo: use senha <strong>12345</strong> para qualquer usuário cadastrado
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
