import { Stethoscope, Shield, Database, FileText, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import './SobrePage.css';

const SYSTEM_VERSION = '1.0.0';

export function SobrePage() {
  return (
    <div className="sobre-page">
      <header className="page-header">
        <div>
          <h1>Sobre</h1>
          <p>Informações do sistema MedChain</p>
        </div>
      </header>

      <div className="sobre-content">
        <Card className="sobre-hero-card">
          <div className="sobre-hero">
            <div className="sobre-hero-icon-wrap">
              <Stethoscope size={40} strokeWidth={2} />
            </div>
            <div className="sobre-hero-text">
              <h2>MedChain</h2>
              <p className="sobre-version">Versão {SYSTEM_VERSION}</p>
              <p className="sobre-desc">
                Sistema de prontuários médicos eletrônicos com integridade garantida por tecnologia blockchain.
                Desenvolvido para garantir segurança, rastreabilidade e conformidade com a legislação de saúde.
              </p>
            </div>
          </div>
        </Card>

        <div className="sobre-grid">
          <Card className="sobre-feature-card">
            <FileText size={24} className="sobre-feature-icon" />
            <h3>Prontuários</h3>
            <p>Gestão completa de prontuários, consultas, diagnósticos, atestados e receitas médicas.</p>
          </Card>
          <Card className="sobre-feature-card">
            <Database size={24} className="sobre-feature-icon" />
            <h3>Blockchain</h3>
            <p>Registro imutável e auditável de todos os documentos com hashes criptográficos.</p>
          </Card>
          <Card className="sobre-feature-card">
            <Shield size={24} className="sobre-feature-icon" />
            <h3>Segurança</h3>
            <p>Dados sensíveis protegidos com criptografia e controle de acesso por perfil.</p>
          </Card>
        </div>

        <Card className="sobre-tech-card">
          <h3>Tecnologia</h3>
          <p>React, Vite, React Router, FastAPI, PostgreSQL, Solana</p>
        </Card>
      </div>

      <div className="sobre-actions">
        <Link to="/doctor" className="sobre-back-link">
          <ChevronLeft size={20} />
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  );
}
