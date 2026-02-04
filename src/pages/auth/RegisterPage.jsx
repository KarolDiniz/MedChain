import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import './RegisterPage.css';

export function RegisterPage() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    CRM: '',
    specialty: '',
  });
  const [error, setError] = useState('');
  const { registerDoctor } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (form.password.length < 5) {
      setError('A senha deve ter pelo menos 5 caracteres.');
      return;
    }
    const result = registerDoctor(form);
    if (result.success) {
      navigate('/doctor');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="register-page">
      <div className="login-bg">
        <div className="login-bg-pattern" />
        <div className="login-bg-gradient" />
      </div>
      <div className="register-container">
        <div className="login-brand">
          <span className="login-brand-icon">
            <Stethoscope size={48} strokeWidth={1.5} />
          </span>
          <h1>MedChain</h1>
          <p>Cadastro exclusivo para profissionais de saúde</p>
        </div>
        <Card className="register-card">
          <h2>Cadastrar como Doutor</h2>
          <p className="register-note">
            O cadastro de pacientes é realizado apenas pelo doutor, dentro do sistema.
          </p>
          <form onSubmit={handleSubmit} className="register-form">
            <Input
              label="Nome completo"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Dr. João Silva"
              required
            />
            <Input
              label="E-mail"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="seu@email.com"
              required
            />
            <Input
              label="CRM"
              name="CRM"
              value={form.CRM}
              onChange={handleChange}
              placeholder="12345-SP"
              required
            />
            <Input
              label="Especialidade"
              name="specialty"
              value={form.specialty}
              onChange={handleChange}
              placeholder="Clínica Geral"
              required
            />
            <Input
              label="Senha"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Mínimo 5 caracteres"
              required
            />
            <Input
              label="Confirmar senha"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Repita a senha"
              required
              error={error}
            />
            <Button type="submit" size="lg" className="register-submit">
              Cadastrar
            </Button>
          </form>
          <p className="register-login">
            Já tem conta? <Link to="/">Entrar</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
