import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  User,
  MapPin,
  CalendarPlus,
  Stethoscope,
  ClipboardList,
  FileCheck,
  Paperclip,
  Filter,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getPatientById,
  getMedicalRecordsByDoctor,
} from '../../services/medicalRecordService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { getHashTypePrefix } from '../../utils/hashUtils';
import { ConsultationModal } from '../../components/doctor/ConsultationModal';
import { DiagnosticModal } from '../../components/doctor/DiagnosticModal';
import { CertificateModal } from '../../components/doctor/CertificateModal';
import { FileModal } from '../../components/doctor/FileModal';
import './PatientDetailPage.css';

const GENDER_LABELS = { FEMALE: 'Feminino', MALE: 'Masculino', OTHER: 'Outro', 0: 'Masculino', 1: 'Feminino', 2: 'Outro' };

const SORT_RECENT = 'recent';
const SORT_OLDEST = 'oldest';
const SORT_OPTIONS = [
  { value: SORT_RECENT, label: 'Mais recentes' },
  { value: SORT_OLDEST, label: 'Mais antigos' },
];

const prefixToLabel = { con: 'Consulta', dia: 'Diagnóstico', cert: 'Atestado', file: 'Arquivo' };

export function PatientDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('consultations');
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [sortOrder, setSortOrder] = useState(SORT_RECENT);

  const doctorId = user?.id || user?.public_id;
  const patientId = patient?.patient_public_id || patient?.uid || patient?.id || id;

  const loadData = async () => {
    const [p, allRecords] = await Promise.all([
      getPatientById(id),
      getMedicalRecordsByDoctor(doctorId),
    ]);
    setPatient(p);
    const pid = p?.patient_public_id || p?.uid || id;
    const grouped = (allRecords || []).find((r) => String(r.patient_id) === String(pid));
    setRecord(grouped || { consultations: [], diagnostics: [], medical_certificates: [], files: [] });
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, doctorId]);

  const handleSaved = () => {
    setShowConsultationModal(false);
    setShowDiagnosticModal(false);
    setShowCertificateModal(false);
    setShowFileModal(false);
    loadData();
  };

  const tabs = [
    { id: 'consultations', label: 'Consultas', count: record?.consultations?.length || 0 },
    { id: 'diagnostics', label: 'Diagnósticos', count: record?.diagnostics?.length || 0 },
    { id: 'certificates', label: 'Atestados', count: record?.medical_certificates?.length || 0 },
    { id: 'files', label: 'Arquivos', count: record?.files?.length || 0 },
  ];

  const sortedConsultations = useMemo(() => {
    const list = record?.consultations || [];
    return [...list].sort((a, b) => {
      const da = new Date(a.created_date).getTime();
      const db = new Date(b.created_date).getTime();
      return sortOrder === SORT_RECENT ? db - da : da - db;
    });
  }, [record?.consultations, sortOrder]);

  const sortedDiagnostics = useMemo(() => {
    const list = record?.diagnostics || [];
    return [...list].sort((a, b) => {
      const da = new Date(a.issue_date || a.created_date).getTime();
      const db = new Date(b.issue_date || b.created_date).getTime();
      return sortOrder === SORT_RECENT ? db - da : da - db;
    });
  }, [record?.diagnostics, sortOrder]);

  const sortedCertificates = useMemo(() => {
    const list = record?.medical_certificates || [];
    return [...list].sort((a, b) => {
      const da = new Date(a.created_date).getTime();
      const db = new Date(b.created_date).getTime();
      return sortOrder === SORT_RECENT ? db - da : da - db;
    });
  }, [record?.medical_certificates, sortOrder]);

  const sortedFiles = useMemo(() => {
    const list = record?.files || [];
    return sortOrder === SORT_OLDEST ? [...list] : [...list].reverse();
  }, [record?.files, sortOrder]);

  const HashBadge = ({ hash, title }) => {
    if (!hash) return null;
    const prefix = getHashTypePrefix(hash);
    const label = prefixToLabel[prefix] || title || 'Hash';
    return (
      <div className="item-hash-badge" title={`Hash de auditoria — ${label}`}>
        <span className="hash-type-prefix" data-type={prefix}>{prefix || '—'}</span>
        <code className="item-hash-value">{hash}</code>
      </div>
    );
  };

  const SortControl = () => (
    <div className="sort-dropdown-wrap">
      <button
        type="button"
        className="sort-trigger-btn"
        onClick={() => setSortOrder((o) => (o === SORT_RECENT ? SORT_OLDEST : SORT_RECENT))}
      >
        <Filter size={18} />
        {sortOrder === SORT_RECENT ? 'Recentes' : 'Antigos'}
      </button>
    </div>
  );

  const formatPhone = (phone) => {
    if (!phone) return '-';
    const d = phone.replace(/\D/g, '');
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return phone;
  };

  const formatAddress = (addr) => {
    if (!addr || typeof addr !== 'object') return null;
    const trim = (v) => (v != null && String(v).trim() ? String(v).trim() : null);
    const linha1 = [addr.street, addr.number, addr.complement].map(trim).filter(Boolean).join(', ');
    const bairro = trim(addr.neighborhood);
    const cidade = trim(addr.city);
    const estado = trim(addr.state);
    const linha2 = [bairro, cidade ? (estado ? `${cidade} - ${estado}` : cidade) : estado].filter(Boolean).join(', ');
    const parts = [linha1, linha2].filter(Boolean);
    return parts.length ? parts.join('. ') : null;
  };

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return '?';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const tabIcons = { consultations: Stethoscope, diagnostics: ClipboardList, certificates: FileCheck, files: Paperclip };

  if (loading) {
    return (
      <motion.div
        className="patient-detail patient-detail--loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="patient-detail-skeleton">
          <div className="patient-detail-skeleton-header" />
          <div className="patient-detail-skeleton-card" />
          <div className="patient-detail-skeleton-tabs" />
        </div>
      </motion.div>
    );
  }
  if (!patient) {
    return (
      <motion.div
        className="patient-detail patient-detail--not-found"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="patient-not-found">
          <User size={48} strokeWidth={1.5} />
          <h2>Paciente não encontrado</h2>
          <p>Verifique o link ou retorne à listagem.</p>
          <Link to="/doctor/patients" className="back-link">
            <ArrowLeft size={18} />
            Voltar aos pacientes
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="patient-detail patient-detail--prontuarios"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <header className="patient-detail-header">
        <Link to="/doctor/patients" className="back-link">
          <ArrowLeft size={18} />
          Voltar aos pacientes
        </Link>
        <div className="patient-detail-hero">
          <div className="patient-detail-avatar">{getInitials(patient.full_name)}</div>
          <div className="patient-detail-hero-text">
            <h1>{patient.full_name}</h1>
            <p>Cadastre consultas, diagnósticos, atestados e arquivos</p>
          </div>
        </div>
      </header>

      <Card className="patient-info-card">
        <h2 className="patient-info-title">
          <User size={20} />
          Dados do paciente
        </h2>
        <div className="patient-info-grid">
          <div className="patient-info-item patient-info-item--wide">
            <div className="patient-info-icon">
              <Mail size={18} />
            </div>
            <div className="patient-info-content">
              <span className="patient-info-label">E-mail</span>
              <span className="patient-info-value">{patient.email}</span>
            </div>
          </div>
          <div className="patient-info-item">
            <div className="patient-info-icon">
              <Phone size={18} />
            </div>
            <div className="patient-info-content">
              <span className="patient-info-label">Telefone</span>
              <span className="patient-info-value">{formatPhone(patient.cellphone)}</span>
            </div>
          </div>
          <div className="patient-info-item patient-info-item--wide">
            <div className="patient-info-icon">
              <Calendar size={18} />
            </div>
            <div className="patient-info-content">
              <span className="patient-info-label">Data de nascimento</span>
              <span className="patient-info-value">
                {patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('pt-BR') : '-'}
              </span>
            </div>
          </div>
          <div className="patient-info-item">
            <div className="patient-info-icon">
              <User size={18} />
            </div>
            <div className="patient-info-content">
              <span className="patient-info-label">Gênero</span>
              <span className="patient-info-value">{GENDER_LABELS[patient.gender] || patient.gender}</span>
            </div>
          </div>
          <div className="patient-info-item patient-info-item--wide">
            <div className="patient-info-icon">
              <MapPin size={18} />
            </div>
            <div className="patient-info-content">
              <span className="patient-info-label">Endereço</span>
              <span className="patient-info-value">{formatAddress(patient.address) || '-'}</span>
            </div>
          </div>
          <div className="patient-info-item">
            <div className="patient-info-icon">
              <CalendarPlus size={18} />
            </div>
            <div className="patient-info-content">
              <span className="patient-info-label">Cadastrado em</span>
              <span className="patient-info-value">
                {patient.created_at
                  ? new Date(patient.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '-'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="tabs">
        {tabs.map((tab) => {
          const Icon = tabIcons[tab.id];
          return (
            <button
              key={tab.id}
              type="button"
              className={`tab ${activeTab === tab.id ? 'tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {Icon && <Icon size={18} />}
              <span>{tab.label}</span>
              <span className="tab-count">{tab.count}</span>
            </button>
          );
        })}
      </div>

      <div className="tab-content">
        {activeTab === 'consultations' && (
          <section>
            <div className="section-header section-header--with-sort">
              <h2>Consultas</h2>
              <div className="section-actions">
                {sortedConsultations.length > 0 && <SortControl />}
                <Button onClick={() => setShowConsultationModal(true)}>+ Nova Consulta</Button>
              </div>
            </div>
            {sortedConsultations.length === 0 ? (
              <Card>
                <div className="empty-state empty-state--enhanced">
                  <Stethoscope size={40} strokeWidth={1.5} className="empty-state-icon" />
                  <p>Nenhuma consulta registrada.</p>
                  <Button onClick={() => setShowConsultationModal(true)}>+ Registrar consulta</Button>
                </div>
              </Card>
            ) : (
              <div className="items-list">
                {sortedConsultations.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
                  >
                  <Card className="consultation-card">
                    <div className="consultation-header">
                      <span className="consultation-date">
                        {new Date(c.created_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    {c.hash && <HashBadge hash={c.hash} title="Consulta" />}
                    <div className="consultation-body">
                      <div><strong>Queixa principal:</strong> {c.chief_complaint || '-'}</div>
                      <div><strong>História:</strong> {c.history_of_present_illness || '-'}</div>
                      <div><strong>Diagnóstico:</strong> {c.diagnosis || '-'}</div>
                      <div><strong>Plano de tratamento:</strong> {c.treatment_plan || '-'}</div>
                    </div>
                    {(c.prescription?.items?.length > 0 || (c.prescriptions && c.prescriptions[0]?.items?.length > 0)) && (
                      <div className="prescriptions-mini">
                        <strong>Prescrições:</strong>
                        {(c.prescription?.items || c.prescriptions?.[0]?.items || []).map((item, i) => (
                          <div key={i} className="prescription-mini">
                            {item.medication_name} - {item.dosage} {item.frequency}
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'diagnostics' && (
          <section>
            <div className="section-header section-header--with-sort">
              <h2>Diagnósticos</h2>
              <div className="section-actions">
                {sortedDiagnostics.length > 0 && <SortControl />}
                <Button onClick={() => setShowDiagnosticModal(true)}>+ Novo Diagnóstico</Button>
              </div>
            </div>
            {sortedDiagnostics.length === 0 ? (
              <Card>
                <div className="empty-state empty-state--enhanced">
                  <ClipboardList size={40} strokeWidth={1.5} className="empty-state-icon" />
                  <p>Nenhum diagnóstico registrado.</p>
                  <Button onClick={() => setShowDiagnosticModal(true)}>+ Registrar diagnóstico</Button>
                </div>
              </Card>
            ) : (
              <div className="items-list">
                {sortedDiagnostics.map((d, i) => (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
                  >
                  <Card className="diagnostic-card">
                    <span className="diagnostic-date">
                      {new Date(d.issue_date || d.created_date).toLocaleDateString('pt-BR')}
                    </span>
                    {d.hash && <HashBadge hash={d.hash} title="Diagnóstico" />}
                    <div><strong>Descrição:</strong> {d.description || '-'}</div>
                    <div><strong>Resultado:</strong> {d.result || '-'}</div>
                  </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'certificates' && (
          <section>
            <div className="section-header section-header--with-sort">
              <h2>Atestados</h2>
              <div className="section-actions">
                {sortedCertificates.length > 0 && <SortControl />}
                <Button onClick={() => setShowCertificateModal(true)}>+ Novo Atestado</Button>
              </div>
            </div>
            {sortedCertificates.length === 0 ? (
              <Card>
                <div className="empty-state empty-state--enhanced">
                  <FileCheck size={40} strokeWidth={1.5} className="empty-state-icon" />
                  <p>Nenhum atestado emitido.</p>
                  <Button onClick={() => setShowCertificateModal(true)}>+ Emitir atestado</Button>
                </div>
              </Card>
            ) : (
              <div className="items-list">
                {sortedCertificates.map((cert, i) => (
                  <motion.div
                    key={cert.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
                  >
                  <Card className="certificate-card">
                    <span className="cert-date">
                      {new Date(cert.created_date).toLocaleDateString('pt-BR')}
                    </span>
                    {cert.hash && <HashBadge hash={cert.hash} title="Atestado" />}
                    <div><strong>Finalidade:</strong> {cert.purpose || '-'}</div>
                    <div><strong>Dias de afastamento:</strong> {cert.period_of_leave ?? '-'}</div>
                  </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'files' && (
          <section>
            <div className="section-header section-header--with-sort">
              <h2>Arquivos</h2>
              <div className="section-actions">
                {sortedFiles.length > 0 && <SortControl />}
                <Button onClick={() => setShowFileModal(true)}>+ Novo Arquivo</Button>
              </div>
            </div>
            {sortedFiles.length === 0 ? (
              <Card>
                <div className="empty-state empty-state--enhanced">
                  <Paperclip size={40} strokeWidth={1.5} className="empty-state-icon" />
                  <p>Nenhum arquivo anexado.</p>
                  <Button onClick={() => setShowFileModal(true)}>+ Anexar arquivo</Button>
                </div>
              </Card>
            ) : (
              <div className="items-list files-grid">
                {sortedFiles.map((f, i) => (
                  <motion.div
                    key={f.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
                  >
                  <Card className="file-card">
                    {f.created_date && (
                      <span className="file-date">{new Date(f.created_date).toLocaleDateString('pt-BR')}</span>
                    )}
                    <span className="file-format">{f.format || 'Arquivo'}</span>
                    <div className="file-desc">{f.description || '-'}</div>
                    {f.hash && <HashBadge hash={f.hash} title="Arquivo" />}
                  </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {showConsultationModal && (
        <ConsultationModal
          doctorId={doctorId}
          patientId={patientId}
          onClose={() => setShowConsultationModal(false)}
          onSaved={handleSaved}
        />
      )}
      {showDiagnosticModal && (
        <DiagnosticModal
          doctorId={doctorId}
          patientId={patientId}
          onClose={() => setShowDiagnosticModal(false)}
          onSaved={handleSaved}
        />
      )}
      {showCertificateModal && (
        <CertificateModal
          doctorId={doctorId}
          patientId={patientId}
          onClose={() => setShowCertificateModal(false)}
          onSaved={handleSaved}
        />
      )}
      {showFileModal && (
        <FileModal
          patientId={patientId}
          onClose={() => setShowFileModal(false)}
          onSaved={handleSaved}
        />
      )}
    </motion.div>
  );
}
