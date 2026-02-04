import { Link } from 'react-router-dom';
import { Users, FolderOpen, UserPlus, FileText, Link2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getPatientsByDoctor, getMedicalRecordsByDoctor } from '../../services/medicalRecordService';
import { Card } from '../../components/common/Card';
import './DoctorDashboard.css';

export function DoctorDashboard() {
  const { user } = useAuth();
  const patients = getPatientsByDoctor(user?.id) || [];
  const medicalRecords = getMedicalRecordsByDoctor(user?.id) || [];

  const stats = [
    { label: 'Pacientes', Icon: Users, value: patients.length, to: '/doctor/patients', color: 'primary' },
    { label: 'Prontuários', Icon: FolderOpen, value: medicalRecords.length, to: '/doctor/medical-records', color: 'secondary' },
  ];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Olá, Dr(a). {user?.full_name?.split(' ')[1] || user?.full_name}</h1>
        <p>Bem-vindo ao painel MedChain. Gerencie pacientes e prontuários.</p>
      </header>

      <section className="dashboard-stats">
        {stats.map((stat) => {
          const StatIcon = stat.Icon;
          return (
          <Link key={stat.label} to={stat.to} className="dashboard-stat-card">
            <span className={`dashboard-stat-icon dashboard-stat-icon--${stat.color}`}>
              <StatIcon size={28} strokeWidth={2} />
            </span>
            <div className="dashboard-stat-content">
              <span className="dashboard-stat-value">{stat.value}</span>
              <span className="dashboard-stat-label">{stat.label}</span>
            </div>
          </Link>
          );
        })}
      </section>

      <section className="dashboard-section">
        <h2>Atalhos rápidos</h2>
        <div className="dashboard-shortcuts">
          <Link to="/doctor/patients" className="dashboard-shortcut">
            <span className="dashboard-shortcut-icon">
              <UserPlus size={24} strokeWidth={2} />
            </span>
            <span>Novo Paciente</span>
          </Link>
          <Link to="/doctor/medical-records" className="dashboard-shortcut">
            <span className="dashboard-shortcut-icon">
              <FileText size={24} strokeWidth={2} />
            </span>
            <span>Novo Prontuário</span>
          </Link>
        </div>
      </section>

      {patients.length > 0 && (
        <section className="dashboard-section">
          <h2>Pacientes recentes</h2>
          <Card>
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
                      <td>{p.full_name}</td>
                      <td>{p.email}</td>
                      <td>{p.cellphone}</td>
                      <td>
                        <Link to={`/doctor/patients/${p.id}`} className="dashboard-link">
                          Ver →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>
      )}

      <section className="dashboard-blockchain-info">
        <Card>
          <div className="blockchain-badge">
            <span className="blockchain-icon">
              <Link2 size={28} strokeWidth={2} />
            </span>
            <div>
              <strong>Blockchain ativo</strong>
              <p>Prontuários protegidos por hashes e registro imutável.</p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
