import { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ClipboardList,
  Search,
  X,
  ArrowUpDown,
  ChevronRight,
  Stethoscope,
  FileText,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getPatientsByDoctor, getMedicalRecordsByDoctor } from '../../services/medicalRecordService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { MedicalRecordModal } from '../../components/doctor/MedicalRecordModal';
import './MedicalRecordsPage.css';

const SORT_RECENT = 'recent';
const SORT_OLDEST = 'oldest';
const SORT_NAME_ASC = 'name_asc';
const SORT_NAME_DESC = 'name_desc';

const SORT_OPTIONS = [
  { value: SORT_RECENT, label: 'Mais recentes' },
  { value: SORT_OLDEST, label: 'Mais antigos' },
  { value: SORT_NAME_ASC, label: 'Nome (A → Z)' },
  { value: SORT_NAME_DESC, label: 'Nome (Z → A)' },
];

function getInitials(name) {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function MedicalRecordsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patient');
  const [patients, setPatients] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const doctorId = user?.public_id || user?.id;
    if (!doctorId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const [p, r] = await Promise.all([
          getPatientsByDoctor(doctorId),
          getMedicalRecordsByDoctor(doctorId),
        ]);
        setPatients(p || []);
        setRecords(r || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.public_id, user?.id]);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState(SORT_RECENT);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
        setSortDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredRecords = useMemo(() => {
    if (loading) return [];
    let list = records;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = records.filter((mr) => {
        const patient = patients.find((p) => (p.patient_public_id || p.id) === mr.patient_id);
        const name = (patient?.full_name || '').toLowerCase();
        const email = (patient?.email || '').toLowerCase();
        const dateStr = new Date(mr.created_date).toLocaleDateString('pt-BR');
        return name.includes(q) || email.includes(q) || dateStr.includes(q);
      });
    }
    const getPatientName = (mr) => (patients.find((p) => (p.patient_public_id || p.id) === mr.patient_id)?.full_name || '').toLowerCase();
    const sorted = [...list].sort((a, b) => {
      if (sortOrder === SORT_RECENT || sortOrder === SORT_OLDEST) {
        const da = new Date(a.created_date).getTime();
        const db = new Date(b.created_date).getTime();
        return sortOrder === SORT_RECENT ? db - da : da - db;
      }
      const na = getPatientName(a);
      const nb = getPatientName(b);
      const cmp = na.localeCompare(nb);
      return sortOrder === SORT_NAME_ASC ? cmp : -cmp;
    });
    return sorted;
  }, [records, patients, searchQuery, sortOrder, loading]);

  const stats = useMemo(() => {
    const totalRecords = records.length;
    const totalConsultations = records.reduce((acc, r) => acc + (r.consultations?.length || 0), 0);
    const totalDiagnostics = records.reduce((acc, r) => acc + (r.diagnostics?.length || 0), 0);
    const totalCertificates = records.reduce((acc, r) => acc + (r.medical_certificates?.length || 0), 0);
    return { totalRecords, totalConsultations, totalDiagnostics, totalCertificates };
  }, [records]);

  const hasActiveFilters = Boolean(searchQuery);
  const clearAllFilters = () => setSearchQuery('');

  return (
    <div className="medical-records-page">
      <header className="records-header">
        <div className="records-header-content">
          <div className="records-header-icon-wrap" aria-hidden>
            <ClipboardList size={28} strokeWidth={1.8} />
          </div>
          <div className="records-header-title">
            <h1>Prontuários Médicos</h1>
            <p>Gerencie consultas, diagnósticos, prescrições e atestados em um só lugar</p>
          </div>
        </div>
      </header>

      {loading ? (
        <motion.div
          className="records-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="records-loading-card">
            <div className="records-loading">
              <div className="records-loading-spinner" />
              <p>Carregando prontuários...</p>
            </div>
          </Card>
        </motion.div>
      ) : records.length === 0 ? (
        <motion.div
          className="records-content"
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="records-empty-card">
            <div className="records-empty-state">
              <div className="records-empty-icon-wrap" aria-hidden>
                <ClipboardList size={56} strokeWidth={1.5} />
              </div>
              <h3>Nenhum prontuário cadastrado</h3>
              <p>Crie um prontuário vinculado a um paciente para começar a registrar consultas, diagnósticos e atestados.</p>
              <Button onClick={() => setShowModal(true)} className="records-empty-cta">
                + Criar Prontuário
              </Button>
            </div>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          className="records-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
        >
          <div className="records-stats">
            <div className="records-stat-card records-stat-card--primary">
              <div className="records-stat-icon">
                <ClipboardList size={22} strokeWidth={2} />
              </div>
              <div className="records-stat-body">
                <span className="records-stat-value">{stats.totalRecords}</span>
                <span className="records-stat-label">Prontuários</span>
              </div>
            </div>
            <div className="records-stat-card">
              <div className="records-stat-icon records-stat-icon--teal">
                <Stethoscope size={20} strokeWidth={2} />
              </div>
              <div className="records-stat-body">
                <span className="records-stat-value">{stats.totalConsultations}</span>
                <span className="records-stat-label">Consultas</span>
              </div>
            </div>
            <div className="records-stat-card">
              <div className="records-stat-icon records-stat-icon--accent">
                <FileText size={20} strokeWidth={2} />
              </div>
              <div className="records-stat-body">
                <span className="records-stat-value">{stats.totalDiagnostics}</span>
                <span className="records-stat-label">Diagnósticos</span>
              </div>
            </div>
            <div className="records-stat-card">
              <div className="records-stat-icon records-stat-icon--success">
                <FileText size={20} strokeWidth={2} />
              </div>
              <div className="records-stat-body">
                <span className="records-stat-value">{stats.totalCertificates}</span>
                <span className="records-stat-label">Atestados</span>
              </div>
            </div>
          </div>

          <div className="records-toolbar">
            <div className="records-toolbar-row">
              <div className="records-search-bar">
                <Search size={18} className="records-search-icon" />
                <input
                  type="text"
                  className="records-search-input"
                  placeholder="Buscar por nome do paciente, e-mail ou data..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Buscar prontuários"
                />
                {searchQuery && (
                  <button type="button" className="records-search-clear" onClick={() => setSearchQuery('')} aria-label="Limpar busca">
                    <X size={16} />
                  </button>
                )}
                <span className="records-search-count">
                  {filteredRecords.length} de {records.length}
                </span>
                {hasActiveFilters && (
                  <button type="button" className="records-filter-clear" onClick={clearAllFilters} title="Limpar filtros">
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>
              <div className="records-toolbar-actions">
                <div className="records-sort-wrap" ref={sortDropdownRef}>
                  <button
                    type="button"
                    className={`records-sort-trigger ${sortDropdownOpen ? 'records-sort-trigger--open' : ''}`}
                    onClick={() => setSortDropdownOpen((v) => !v)}
                    aria-expanded={sortDropdownOpen}
                    aria-label="Ordenar prontuários"
                  >
                    <ArrowUpDown size={20} />
                  </button>
                <AnimatePresence>
                  {sortDropdownOpen && (
                    <motion.ul
                      className="records-sort-dropdown"
                      role="listbox"
                      initial={reducedMotion ? false : { opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={reducedMotion ? undefined : { opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <li key={opt.value} role="option">
                          <button
                            type="button"
                            className={`records-sort-item ${sortOrder === opt.value ? 'records-sort-item--active' : ''}`}
                            onClick={() => {
                              setSortOrder(opt.value);
                              setSortDropdownOpen(false);
                            }}
                          >
                            {opt.label}
                          </button>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
                </div>
                <Button onClick={() => setShowModal(true)}>+ Novo Prontuário</Button>
              </div>
            </div>
          </div>

          {filteredRecords.length === 0 ? (
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <div className="records-no-results">
                  <p>
                    {hasActiveFilters
                      ? `Nenhum prontuário encontrado${searchQuery ? ` para "${searchQuery}"` : ''}.`
                      : 'Nenhum prontuário cadastrado.'}
                  </p>
                  {hasActiveFilters && (
                    <button type="button" className="records-filter-clear-btn" onClick={clearAllFilters} title="Limpar filtros">
                      <RotateCcw size={16} />
                    </button>
                  )}
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              className="records-grid"
              variants={reducedMotion ? {} : {
                visible: { transition: { staggerChildren: 0.035, delayChildren: 0.05 } },
              }}
              initial={reducedMotion ? false : 'hidden'}
              animate={reducedMotion ? false : 'visible'}
            >
              {filteredRecords.map((mr) => {
                const patient = patients.find((p) => (p.patient_public_id || p.id) === mr.patient_id);
                const consultationsCount = mr.consultations?.length || 0;
                const diagnosticsCount = mr.diagnostics?.length || 0;
                const certificatesCount = mr.medical_certificates?.length || 0;

                return (
                  <motion.div
                    key={mr.id}
                    variants={reducedMotion ? {} : {
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0 },
                    }}
                    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <Link to={`/doctor/patients/${mr.patient_id}`} className="record-card">
                      <div className="record-card-avatar">
                        <Avatar
                          userId={mr.patient_id}
                          isDoctor={false}
                          size={52}
                          editable={false}
                          variant="profile"
                          initials={getInitials(patient?.full_name)}
                        />
                      </div>
                      <div className="record-card-body">
                        <h3 className="record-card-name">{patient?.full_name || 'Paciente'}</h3>
                        <div className="record-card-date">
                          <Calendar size={14} />
                          <span>{new Date(mr.created_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div className="record-card-badges">
                          <span className="record-badge record-badge--consult">
                            <Stethoscope size={12} />
                            {consultationsCount}
                          </span>
                          <span className="record-badge record-badge--diagnostic">
                            <FileText size={12} />
                            {diagnosticsCount}
                          </span>
                          {certificatesCount > 0 && (
                            <span className="record-badge record-badge--cert">
                              {certificatesCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="record-card-arrow">
                        <ChevronRight size={20} strokeWidth={2.5} />
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </motion.div>
      )}

      {showModal && (
        <MedicalRecordModal
          doctorId={user?.public_id || user?.id}
          patients={patients}
          preselectedPatientId={patientId}
          onClose={() => setShowModal(false)}
          onSaved={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
