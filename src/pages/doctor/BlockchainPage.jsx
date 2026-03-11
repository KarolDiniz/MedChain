import { Link2, Shield, Lock, Database, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import './BlockchainPage.css';

export function BlockchainPage() {
  return (
    <div className="blockchain-page">
      <header className="page-header">
        <div>
          <h1>Blockchain</h1>
          <p>Integridade e segurança dos prontuários médicos</p>
        </div>
      </header>

      <div className="blockchain-grid">
        <Card className="blockchain-hero-card">
          <div className="blockchain-hero">
            <div className="blockchain-hero-icon-wrap">
              <Link2 className="blockchain-hero-icon" size={40} strokeWidth={2} />
              <span className="blockchain-hero-pulse" aria-hidden />
            </div>
            <div className="blockchain-hero-content">
              <h2>Blockchain ativo</h2>
              <p className="blockchain-hero-status">
                <span className="blockchain-status-dot" /> Integridade garantida
              </p>
              <p className="blockchain-hero-desc">
                Prontuários protegidos por hashes criptográficos e registro imutável.
                Seus dados estão seguros e auditáveis.
              </p>
            </div>
          </div>
        </Card>

        <Card className="blockchain-feature-card">
          <Lock size={24} className="blockchain-feature-icon" />
          <h3>Criptografia</h3>
          <p>Dados sensíveis criptografados com padrões de segurança hospitalar.</p>
        </Card>

        <Card className="blockchain-feature-card">
          <Database size={24} className="blockchain-feature-icon" />
          <h3>Registro imutável</h3>
          <p>Histórico médico preservado sem possibilidade de alteração posterior.</p>
        </Card>

        <Card className="blockchain-feature-card">
          <Shield size={24} className="blockchain-feature-icon" />
          <h3>Auditoria</h3>
          <p>Rastreabilidade completa de todas as operações realizadas no sistema.</p>
        </Card>
      </div>

      <div className="blockchain-actions">
        <Link to="/doctor" className="blockchain-back-link">
          <ChevronLeft size={20} />
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  );
}
