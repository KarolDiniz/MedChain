import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
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
  BarChart3,
  ClipboardList,
  Database,
  HeartPulse,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getPatientsByDoctor, getMedicalRecordsByDoctor, getDoctorById, getDashboardStats } from '../../services/medicalRecordService';
import { Card } from '../../components/common/Card';
import { AnimatedCounter } from '../../components/dashboard/AnimatedCounter';
import { DashboardSkeleton } from '../../components/dashboard/DashboardSkeleton';
import './DoctorDashboard.css';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const MotionLink = motion(Link);

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

function getWeekKey(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

function buildLastWeeks(count) {
  const weeks = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - 7 * i);
    const key = getWeekKey(d);
    const start = new Date(key);
    const label = start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    weeks.push({ key, label });
  }
  return weeks;
}

export function DoctorDashboard() {
  const { user } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [doctor, setDoctor] = useState(null);
  const [patients, setPatients] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const docId = user?.id || user?.public_id;
      if (!docId) {
        setLoading(false);
        return;
      }
      try {
        const [d, p, mr, st] = await Promise.all([
          getDoctorById(docId),
          getPatientsByDoctor(docId),
          getMedicalRecordsByDoctor(docId),
          getDashboardStats(docId),
        ]);
        setDoctor(d);
        setPatients(p || []);
        setMedicalRecords(mr || []);
        setStats(st || null);
      } catch {
        setPatients([]);
        setMedicalRecords([]);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.id, user?.public_id]);

  const totalConsultations = medicalRecords.reduce(
    (acc, mr) => acc + (mr.consultations?.length || 0),
    0
  );

  const totalDiagnostics = medicalRecords.reduce(
    (acc, mr) => acc + (mr.diagnostics?.length || 0),
    0
  );
  const totalFiles = medicalRecords.reduce(
    (acc, mr) => acc + (mr.files?.length || 0),
    0
  );
  const totalCertificates = medicalRecords.reduce(
    (acc, mr) => acc + (mr.medical_certificates?.length || 0),
    0
  );

  const consultationsByWeek = (() => {
    const allDates = medicalRecords.flatMap((mr) =>
      (mr.consultations || []).map((c) => c.created_date || mr.updated_date)
    );
    const byWeek = {};
    allDates.forEach((dateStr) => {
      const key = getWeekKey(dateStr);
      byWeek[key] = (byWeek[key] || 0) + 1;
    });
    return byWeek;
  })();

  const lastWeeks = buildLastWeeks(5);
  const activityByWeek = lastWeeks.map(({ key, label }) => ({
    label,
    value: consultationsByWeek[key] || 0,
  }));
  const activityMax = Math.max(...activityByWeek.map((w) => w.value), 1);

  const contentData = [
    { label: 'Consultas', value: totalConsultations, color: 'primary' },
    { label: 'Diagnósticos', value: totalDiagnostics, color: 'accent' },
    { label: 'Anexos', value: totalFiles, color: 'secondary' },
    { label: 'Certificados', value: totalCertificates, color: 'success' },
  ];
  const contentMax = Math.max(...contentData.map((d) => d.value), 1);

  const displayName = doctor?.full_name || user?.full_name || user?.username || 'Médico';
  const firstName = displayName.split(' ')[0] || displayName;
  const specialty = doctor?.specialty || 'Medicina';

  const statsCards = [
    {
      label: 'Pacientes',
      Icon: Users,
      value: stats?.patients ?? patients.length,
      to: '/doctor/patients',
      color: 'primary',
      subtitle: 'cadastrados',
    },
    {
      label: 'Prontuários',
      Icon: FolderOpen,
      value: stats?.medical_records ?? medicalRecords.length,
      to: '/doctor/medical-records',
      color: 'secondary',
      subtitle: 'ativos',
    },
    {
      label: 'Consultas',
      Icon: Stethoscope,
      value: stats?.consultations ?? totalConsultations,
      to: '/doctor/medical-records',
      color: 'accent',
      subtitle: 'registradas',
    },
  ];

  const getPatientName = (patientId) => {
    const p = patients.find((x) => (x.patient_public_id || x.uid || x.id) === String(patientId));
    return p?.full_name || 'Paciente';
  };

  const recentActivity = medicalRecords
    .flatMap((mr) => {
      const patientName = getPatientName(mr.patient_id);
      const items = [];
      (mr.consultations || []).forEach((c) => {
        items.push({
          id: `con-${mr.id}-${c.id}`,
          type: 'consultation',
          title: c.chief_complaint || 'Consulta',
          patientName,
          date: c.created_date || mr.updated_date,
        });
      });
      (mr.diagnostics || []).forEach((d) => {
        items.push({
          id: `dia-${mr.id}-${d.id}`,
          type: 'diagnostic',
          title: d.description || 'Diagnóstico',
          patientName,
          date: d.issue_date || d.created_date || mr.updated_date,
        });
      });
      (mr.medical_certificates || []).forEach((cert) => {
        items.push({
          id: `cert-${mr.id}-${cert.id}`,
          type: 'certificate',
          title: cert.purpose || 'Atestado',
          patientName,
          date: cert.created_date || mr.updated_date,
        });
      });
      return items;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const todayFormatted = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const patientLinkId = (p) => p.uid || p.patient_public_id || p.id;

  const getActivityIcon = (type) => {
    switch (type) {
      case 'consultation': return Stethoscope;
      case 'diagnostic': return ClipboardList;
      case 'certificate': return FileText;
      default: return Activity;
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <DashboardSkeleton />
      </div>
    );
  }

  const shouldAnimate = !prefersReducedMotion;

  return (
    <motion.div
      className="dashboard"
      initial={shouldAnimate ? 'hidden' : false}
      animate={shouldAnimate ? 'visible' : false}
      variants={shouldAnimate ? containerVariants : {}}
    >
      <div className="dashboard-accent dashboard-accent--hero" aria-hidden />
      <div className="dashboard-accent dashboard-accent--bottom-left" aria-hidden />
      <div className="dashboard-accent dashboard-accent--top-right" aria-hidden />
      <div className="dashboard-accent dashboard-accent--bottom-right" aria-hidden />
      <div className="dashboard-layout">
        <div className="dashboard-left-column">
          <motion.header
            className="dashboard-hero"
            variants={itemVariants}
          >
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
                <HeartPulse size={18} strokeWidth={2} className="dashboard-hero-desc-icon" aria-hidden />
                Gerencie seus pacientes e prontuários com segurança blockchain e praticidade.
              </p>
            </div>
            <div className="dashboard-hero-accent" aria-hidden />
          </motion.header>

          <motion.section
            className="dashboard-stats"
            aria-label="Resumo"
            variants={itemVariants}
          >
            {statsCards.map((stat, index) => {
              const StatIcon = stat.Icon;
              return (
                <motion.div key={stat.label} variants={itemVariants}>
                  <MotionLink
                    to={stat.to}
                    className="dashboard-stat-card"
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className={`dashboard-stat-icon dashboard-stat-icon--${stat.color}`}>
                      <StatIcon size={24} strokeWidth={2} />
                    </span>
                    <div className="dashboard-stat-content">
                      <span className="dashboard-stat-value">
                        <AnimatedCounter value={stat.value} duration={1} />
                      </span>
                    <span className="dashboard-stat-label">{stat.label}</span>
                    {stat.subtitle && (
                      <span className="dashboard-stat-subtitle">{stat.subtitle}</span>
                    )}
                  </div>
                  <ChevronRight className="dashboard-stat-chevron" size={20} strokeWidth={2} />
                </MotionLink>
                </motion.div>
              );
            })}
          </motion.section>

          <motion.section
            className="dashboard-section dashboard-shortcuts-section"
            variants={itemVariants}
          >
            <h2 className="dashboard-section-title">
              <Activity size={22} strokeWidth={2} />
              Atalhos rápidos
            </h2>
            <div className="dashboard-shortcuts">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link to="/doctor/patients" className="dashboard-shortcut dashboard-shortcut--primary">
                  <span className="dashboard-shortcut-icon">
                    <UserPlus size={22} strokeWidth={2} />
                  </span>
                  <span>Novo Paciente</span>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link to="/doctor/medical-records" className="dashboard-shortcut dashboard-shortcut--secondary">
                  <span className="dashboard-shortcut-icon">
                    <FileText size={22} strokeWidth={2} />
                  </span>
                  <span>Novo Prontuário</span>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link to="/doctor/medical-records" className="dashboard-shortcut dashboard-shortcut--accent">
                  <span className="dashboard-shortcut-icon">
                    <Stethoscope size={22} strokeWidth={2} />
                  </span>
                  <span>Nova Consulta</span>
                </Link>
              </motion.div>
            </div>
          </motion.section>

          {recentActivity.length > 0 && (
            <motion.section
              className="dashboard-section dashboard-activity-section"
              variants={itemVariants}
            >
              <h2 className="dashboard-section-title">
                <Calendar size={22} strokeWidth={2} />
                Atividade recente
              </h2>
              <Card className="dashboard-activity-card">
                <ul className="dashboard-activity-list">
                  {recentActivity.map((item, i) => {
                    const ActivityIcon = getActivityIcon(item.type);
                    return (
                      <motion.li
                        key={item.id}
                        className={`dashboard-activity-item dashboard-activity-item--${item.type}`}
                        initial={shouldAnimate ? { opacity: 0, x: -12 } : false}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: shouldAnimate ? 0.05 * i : 0, duration: shouldAnimate ? 0.3 : 0 }}
                      >
                        <span className="dashboard-activity-icon">
                          <ActivityIcon size={16} strokeWidth={2} />
                        </span>
                        <div className="dashboard-activity-content">
                          <strong>{item.title}</strong>
                          <span className="dashboard-activity-meta">
                            {item.patientName} · {formatDate(item.date)}
                          </span>
                        </div>
                      </motion.li>
                    );
                  })}
                </ul>
              </Card>
            </motion.section>
          )}

          {patients.length > 0 && (
            <motion.section
              className="dashboard-section dashboard-patients-section"
              variants={itemVariants}
            >
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
                            <Link to={`/doctor/patients/${patientLinkId(p)}`} className="dashboard-link">
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
            </motion.section>
          )}
        </div>

        <div className="dashboard-charts-column">
          <motion.section
            className="dashboard-section dashboard-chart-section"
            variants={itemVariants}
          >
            <h2 className="dashboard-section-title">
              <BarChart3 size={22} strokeWidth={2} />
              Consultas nas últimas semanas
            </h2>
            <Card className="dashboard-chart-card dashboard-chart-card--vertical">
              <div className="dashboard-chart-vertical" role="img" aria-label="Consultas por semana">
                {activityByWeek.map((week, i) => (
                  <motion.div
                    key={week.label}
                    className="dashboard-chart-vertical-bar-wrap"
                    initial={shouldAnimate ? { opacity: 0, y: 10 } : false}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: shouldAnimate ? 0.1 * i + 0.3 : 0, duration: shouldAnimate ? 0.4 : 0 }}
                  >
                    <span className="dashboard-chart-vertical-value">{week.value}</span>
                    <div className="dashboard-chart-vertical-bar-inner">
                      <motion.div
                        className="dashboard-chart-vertical-bar"
                        initial={shouldAnimate ? { height: 0 } : false}
                        animate={{ height: `${(week.value / activityMax) * 100}%` }}
                        transition={{ delay: shouldAnimate ? 0.2 * i + 0.5 : 0, duration: shouldAnimate ? 0.7 : 0, ease: [0.25, 0.46, 0.45, 0.94] }}
                        title={`${week.label}: ${week.value} consulta(s)`}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="dashboard-chart-vertical-labels">
                {activityByWeek.map((week) => (
                  <span key={week.label} className="dashboard-chart-vertical-label">
                    {week.label}
                  </span>
                ))}
              </div>
            </Card>
          </motion.section>

          <motion.section
            className="dashboard-section dashboard-chart-section"
            variants={itemVariants}
          >
            <h2 className="dashboard-section-title">
              <Database size={22} strokeWidth={2} />
              Conteúdo nos prontuários
            </h2>
            <Card className="dashboard-chart-card">
              <div className="dashboard-chart" role="img" aria-label="Consultas, Diagnósticos, Anexos e Certificados nos prontuários">
                {contentData.map((item, i) => (
                  <motion.div
                    key={item.label}
                    className="dashboard-chart-row"
                    initial={shouldAnimate ? { opacity: 0, x: -10 } : false}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: shouldAnimate ? 0.1 * i + 0.2 : 0, duration: shouldAnimate ? 0.35 : 0 }}
                  >
                    <span className="dashboard-chart-label">{item.label}</span>
                    <div className="dashboard-chart-bar-wrap">
                      <motion.div
                        className={`dashboard-chart-bar dashboard-chart-bar--${item.color}`}
                        initial={shouldAnimate ? { width: 0 } : false}
                        animate={{ width: `${(item.value / contentMax) * 100}%` }}
                        transition={{ delay: shouldAnimate ? 0.15 * i + 0.4 : 0, duration: shouldAnimate ? 0.6 : 0, ease: [0.25, 0.46, 0.45, 0.94] }}
                      />
                    </div>
                    <span className="dashboard-chart-value">{item.value}</span>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.section>

          <motion.section
            className="dashboard-section dashboard-blockchain-section"
            variants={itemVariants}
          >
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
          </motion.section>
        </div>
      </div>
    </motion.div>
  );
}
