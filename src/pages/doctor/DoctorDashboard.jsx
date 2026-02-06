import { Link } from 'react-router-dom';
import {
  Users,
  FolderOpen,
  UserPlus,
  FileText,
  Link2,
  Stethoscope,
  ChevronRight,
  Shield,
  Activity,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getPatientsByDoctor, getMedicalRecordsByDoctor, getDoctorById } from '../../services/medicalRecordService';
import { Card } from '../../components/common/Card';
import './DoctorDashboard.css';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `Há ${diffDays} dias`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function DoctorDashboard() {
  const { user } = useAuth();
  const doctor = user?.id ? getDoctorById(user.id) : null;
  const patients = getPatientsByDoctor(user?.id) || [];
  const medicalRecords = getMedicalRecordsByDoctor(user?.id) || [];

  const totalConsultations = medicalRecords.reduce(
    (acc, mr) => acc + (mr.consultations?.length || 0),
    0
  );

  const firstName = user?.full_name?.split(' ').slice(1).join(' ') || user?.full_name || 'Médico';
  const specialty = doctor?.specialty || 'Medicina';

  const stats = [
    {
      label: 'Pacientes',
      Icon: Users,
      value: patients.length,
      to: '/doctor/patients',
      color: 'primary',
      subtitle: 'cadastrados',
    },
    {
      label: 'Prontuários',
      Icon: FolderOpen,
      value: medicalRecords.length,
      to: '/doctor/medical-records',
      color: 'secondary',
      subtitle: 'ativos',
    },
    {
      label: 'Consultas',
      Icon: Stethoscope,
      value: totalConsultations,
      to: '/doctor/medical-records',
      color: 'accent',
      subtitle: 'registradas',
    },
  ];

  const recentActivity = medicalRecords
    .flatMap((mr) => {
      const patient = patients.find((p) => p.id === mr.patient_id);
      const name = patient?.full_name || 'Paciente';
      return (mr.consultations || []).slice(-1).map((c) => ({
        id: `${mr.id}-${c.id}`,
        type: 'consultation',
        title: c.chief_complaint || 'Consulta',
        patientName: name,
        date: c.created_date || mr.updated_date,
      }));
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const todayFormatted = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="dashboard">
      <header className="dashboard-hero">
        <div className="dashboard-hero-content">
          <p className="dashboard-hero-greeting">
            <Sparkles size={18} strokeWidth={2} />
            {getGreeting()}
          </p>
          <h1 className="dashboard-hero-title">
            Dr(a). {firstName}
          </h1>
          <p className="dashboard-hero-subtitle">
            {specialty} · {todayFormatted}
          </p>
          <p className="dashboard-hero-desc">
            Gerencie seus pacientes e prontuários com segurança e praticidade.
          </p>
        </div>
        <div className="dashboard-hero-accent" aria-hidden />
      </header>

      <section className="dashboard-stats" aria-label="Resumo">
        {stats.map((stat) => {
          const StatIcon = stat.Icon;
          return (
            <Link key={stat.label} to={stat.to} className="dashboard-stat-card">
              <span className={`dashboard-stat-icon dashboard-stat-icon--${stat.color}`}>
                <StatIcon size={24} strokeWidth={2} />
              </span>
              <div className="dashboard-stat-content">
                <span className="dashboard-stat-value">{stat.value}</span>
                <span className="dashboard-stat-label">{stat.label}</span>
                {stat.subtitle && (
                  <span className="dashboard-stat-subtitle">{stat.subtitle}</span>
                )}
              </div>
              <ChevronRight className="dashboard-stat-chevron" size={20} strokeWidth={2} />
            </Link>
          );
        })}
      </section>

      <section className="dashboard-section dashboard-shortcuts-section">
        <h2 className="dashboard-section-title">
          <Activity size={22} strokeWidth={2} />
          Atalhos rápidos
        </h2>
        <div className="dashboard-shortcuts">
          <Link to="/doctor/patients" className="dashboard-shortcut dashboard-shortcut--primary">
            <span className="dashboard-shortcut-icon">
              <UserPlus size={22} strokeWidth={2} />
            </span>
            <span>Novo Paciente</span>
          </Link>
          <Link to="/doctor/medical-records" className="dashboard-shortcut dashboard-shortcut--secondary">
            <span className="dashboard-shortcut-icon">
              <FileText size={22} strokeWidth={2} />
            </span>
            <span>Novo Prontuário</span>
          </Link>
        </div>
      </section>

      <div className="dashboard-grid">
        {recentActivity.length > 0 && (
          <section className="dashboard-section dashboard-activity-section">
            <h2 className="dashboard-section-title">
              <Calendar size={22} strokeWidth={2} />
              Atividade recente
            </h2>
            <Card className="dashboard-activity-card">
              <ul className="dashboard-activity-list">
                {recentActivity.map((item) => (
                  <li key={item.id} className="dashboard-activity-item">
                    <span className="dashboard-activity-dot" />
                    <div className="dashboard-activity-content">
                      <strong>{item.title}</strong>
                      <span className="dashboard-activity-meta">
                        {item.patientName} · {formatDate(item.date)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        )}

        {patients.length > 0 && (
          <section className="dashboard-section dashboard-patients-section">
            <h2 className="dashboard-section-title">
              <Users size={22} strokeWidth={2} />
              Pacientes recentes
            </h2>
            <Card className="dashboard-patients-card">
              <div className="dashboard-table-wrapper">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>E-mail</th>
                      <th>Telefone</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.slice(0, 5).map((p) => (
                      <tr key={p.id}>
                        <td>
                          <span className="dashboard-table-name">{p.full_name}</span>
                        </td>
                        <td>{p.email}</td>
                        <td>{p.cellphone}</td>
                        <td>
                          <Link to={`/doctor/patients/${p.id}`} className="dashboard-link">
                            Ver <ChevronRight size={16} strokeWidth={2} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Link to="/doctor/patients" className="dashboard-see-all">
                Ver todos os pacientes
              </Link>
            </Card>
          </section>
        )}
      </div>

      <section className="dashboard-section dashboard-blockchain-section">
        <Card className="dashboard-blockchain-card">
          <div className="blockchain-badge">
            <span className="blockchain-icon-wrap">
              <Link2 className="blockchain-icon" size={28} strokeWidth={2} />
              <span className="blockchain-pulse" aria-hidden />
            </span>
            <div className="blockchain-content">
              <div className="blockchain-header">
                <strong>Blockchain ativo</strong>
                <span className="blockchain-status">
                  <span className="blockchain-status-dot" /> Integridade garantida
                </span>
              </div>
              <p>
                Prontuários protegidos por hashes criptográficos e registro imutável.
                Seus dados estão seguros e auditáveis.
              </p>
            </div>
            <Shield className="blockchain-shield" size={32} strokeWidth={1.5} aria-hidden />
          </div>
        </Card>
      </section>
    </div>
  );
}
