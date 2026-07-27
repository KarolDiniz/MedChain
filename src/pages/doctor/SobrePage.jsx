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
          <p>Conheça a plataforma MedChain</p>
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
                Prontuário eletrônico pensado para a rotina clínica: organizar atendimentos,
                preservar o histórico do paciente e oferecer uma forma transparente de
                comprovar que os registros permanecem íntegros ao longo do tempo.
              </p>
            </div>
          </div>
        </Card>

        <div className="sobre-grid">
          <Card className="sobre-feature-card">
            <FileText size={24} className="sobre-feature-icon" />
            <h3>Prontuários</h3>
            <p>
              Consultas, diagnósticos, atestados e anexos em um só lugar, com histórico
              contínuo e sem sobrescrita de informações clínicas já registradas.
            </p>
          </Card>
          <Card className="sobre-feature-card">
            <Database size={24} className="sobre-feature-icon" />
            <h3>Privacidade dos dados</h3>
            <p>
              O conteúdo clínico permanece sob controle do sistema. Na rede pública é
              registrada apenas uma evidência criptográfica — nunca o prontuário completo.
            </p>
          </Card>
          <Card className="sobre-feature-card">
            <Shield size={24} className="sobre-feature-icon" />
            <h3>Verificação</h3>
            <p>
              Em Auditoria ou em cada registro, você pode confirmar se o conteúdo
              ainda corresponde à evidência registrada no momento da criação.
            </p>
          </Card>
        </div>

        <Card className="sobre-tech-card">
          <h3>Como a integridade é garantida</h3>
          <p className="sobre-tech-flow">
            <Link2 size={16} />
            Registro clínico → evidência criptográfica → comprovação pública imutável
          </p>
          <p>
            Assim, qualquer alteração posterior no conteúdo deixa de coincidir com a
            evidência original e pode ser detectada na verificação.
          </p>
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
