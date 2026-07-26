import { Stethoscope, Shield, Database, FileText, ChevronLeft, Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import './SobrePage.css';

const SYSTEM_VERSION = '1.1.0';

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
                Prontuário eletrônico com prova de integridade: o conteúdo clínico fica no banco de dados;
                um hash SHA-256 é ancorado na blockchain Solana (devnet) via Memo Program.
                Qualquer alteração no registro quebra a verificação.
              </p>
            </div>
          </div>
        </Card>

        <div className="sobre-grid">
          <Card className="sobre-feature-card">
            <FileText size={24} className="sobre-feature-icon" />
            <h3>Prontuários</h3>
            <p>Consultas, diagnósticos, atestados e arquivos vinculados ao paciente — modelo append-only (sem edição/exclusão clínica).</p>
          </Card>
          <Card className="sobre-feature-card">
            <Database size={24} className="sobre-feature-icon" />
            <h3>Off-chain + on-chain</h3>
            <p>Dados sensíveis permanecem off-chain (PostgreSQL/arquivos cifrados). Na Solana fica apenas o hash + ID, não o prontuário completo.</p>
          </Card>
          <Card className="sobre-feature-card">
            <Shield size={24} className="sobre-feature-icon" />
            <h3>Verificação</h3>
            <p>Use Auditoria ou o botão “Verificar integridade” para recomputar o hash e comparar com a transação no Explorer.</p>
          </Card>
        </div>

        <Card className="sobre-tech-card">
          <h3>Arquitetura em uma frase</h3>
          <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Link2 size={16} />
            Conteúdo clínico → SHA-256 → Memo Solana → prova pública de integridade
          </p>
          <p>Stack: React, Vite, FastAPI, PostgreSQL, Redis, Solana Devnet</p>
        </Card>
      </div>

      <div className="sobre-actions">
        <Link to="/doctor/auditoria" className="sobre-back-link">
          Ir para Auditoria
        </Link>
        <Link to="/doctor" className="sobre-back-link">
          <ChevronLeft size={20} />
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  );
}
