import { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Filter } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getMedicalRecordById,
  getPatientById,
  getDoctorById,
  getMedicalRecordsByDoctor,
} from '../../services/medicalRecordService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { IntegrityBadge } from '../../components/common/IntegrityBadge';
import { FileAttachment } from '../../components/common/FileAttachment';
import { formatDateBR, resolveItemDate } from '../../utils/dateUtils';
import { ConsultationModal } from '../../components/doctor/ConsultationModal';
import { DiagnosticModal } from '../../components/doctor/DiagnosticModal';
import { CertificateModal } from '../../components/doctor/CertificateModal';
import { FileModal } from '../../components/doctor/FileModal';
import './MedicalRecordDetailPage.css';

const SORT_RECENT = 'recent';
const SORT_OLDEST = 'oldest';
const SORT_ALPHA_ASC = 'alpha_asc';
const SORT_ALPHA_DESC = 'alpha_desc';

const SORT_OPTIONS = [
  { value: SORT_RECENT, label: 'Mais recentes' },
  { value: SORT_OLDEST, label: 'Mais antigos' },
  { value: SORT_ALPHA_ASC, label: 'Alfabética (A→Z)' },
  { value: SORT_ALPHA_DESC, label: 'Alfabética (Z→A)' },
];

export function MedicalRecordDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [record, setRecord] = useState(null);
  const [patient, setPatient] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('consultations');
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [sortOrder, setSortOrder] = useState(SORT_RECENT);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef(null);

  const doctorId = user?.id || user?.public_id;
  const isAuthorized = record && String(record.doctor_id) === String(doctorId);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const initial = await getMedicalRecordById(id);
      if (!initial || String(initial.doctor_id) !== String(doctorId)) {
        setRecord(null);
        setPatient(null);
        setDoctor(null);
        return;
      }
      const [recordsForDoctor, p, d] = await Promise.all([
        getMedicalRecordsByDoctor(doctorId),
        getPatientById(initial.patient_id),
        getDoctorById(initial.doctor_id),
      ]);
      const group = recordsForDoctor.find(
        (r) => String(r.patient_id) === String(initial.patient_id)
      ) || initial;
      setRecord(group);
      setPatient(p);
      setDoctor(d);
    } catch {
      setRecord(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, doctorId]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
        setSortDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaved = () => {
    setShowConsultationModal(false);
    setShowDiagnosticModal(false);
    setShowCertificateModal(false);
    setShowFileModal(false);
    loadData();
  };

  const tabs = useMemo(() => ([
    { id: 'consultations', label: 'Consultas', count: record?.consultations?.length || 0 },
    { id: 'diagnostics', label: 'Diagnósticos', count: record?.diagnostics?.length || 0 },
    { id: 'certificates', label: 'Atestados', count: record?.medical_certificates?.length || 0 },
    { id: 'files', label: 'Arquivos', count: record?.files?.length || 0 },
  ]), [record]);

  const sortedConsultations = useMemo(() => {
    const list = record?.consultations || [];
    return [...list].sort((a, b) => {
      if (sortOrder === SORT_RECENT || sortOrder === SORT_OLDEST) {
        const da = resolveItemDate(a)?.getTime() || 0;
        const db = resolveItemDate(b)?.getTime() || 0;
        return sortOrder === SORT_RECENT ? db - da : da - db;
      }
      const sa = (a.chief_complaint || a.diagnosis || '').toLowerCase();
      const sb = (b.chief_complaint || b.diagnosis || '').toLowerCase();
      return sortOrder === SORT_ALPHA_ASC ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
  }, [record?.consultations, sortOrder]);

  const sortedDiagnostics = useMemo(() => {
    const list = record?.diagnostics || [];
    return [...list].sort((a, b) => {
      if (sortOrder === SORT_RECENT || sortOrder === SORT_OLDEST) {
        const da = resolveItemDate(a, 'diagnostic')?.getTime() || 0;
        const db = resolveItemDate(b, 'diagnostic')?.getTime() || 0;
        return sortOrder === SORT_RECENT ? db - da : da - db;
      }
      const sa = (a.description || '').toLowerCase();
      const sb = (b.description || '').toLowerCase();
      return sortOrder === SORT_ALPHA_ASC ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
  }, [record?.diagnostics, sortOrder]);

  const sortedCertificates = useMemo(() => {
    const list = record?.medical_certificates || [];
    return [...list].sort((a, b) => {
      if (sortOrder === SORT_RECENT || sortOrder === SORT_OLDEST) {
        const da = resolveItemDate(a)?.getTime() || 0;
        const db = resolveItemDate(b)?.getTime() || 0;
        return sortOrder === SORT_RECENT ? db - da : da - db;
      }
      const sa = (a.purpose || '').toLowerCase();
      const sb = (b.purpose || '').toLowerCase();
      return sortOrder === SORT_ALPHA_ASC ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
  }, [record?.medical_certificates, sortOrder]);

  const sortedFiles = useMemo(() => {
    const list = [...(record?.files || [])];
    if (sortOrder === SORT_ALPHA_ASC || sortOrder === SORT_ALPHA_DESC) {
      return list.sort((a, b) => {
        const sa = (a.description || '').toLowerCase();
        const sb = (b.description || '').toLowerCase();
        return sortOrder === SORT_ALPHA_ASC ? sa.localeCompare(sb) : sb.localeCompare(sa);
      });
    }
    return list.sort((a, b) => {
      const da = resolveItemDate(a, 'file')?.getTime() || 0;
      const db = resolveItemDate(b, 'file')?.getTime() || 0;
      return sortOrder === SORT_RECENT ? db - da : da - db;
    });
  }, [record?.files, sortOrder]);

  if (loading) {
    return (
      <div className="record-detail-page">
        <p>Carregando...</p>
        <Link to="/doctor/medical-records">← Voltar</Link>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div>
        <p>Prontuário não encontrado.</p>
        <Link to="/doctor/medical-records">← Voltar</Link>
      </div>
    );
  }

  return (
    <div className="record-detail-page">
      <header className="page-header">
        <Link to={`/doctor/patients/${record.patient_id}`} className="back-link">← Voltar ao paciente</Link>
        <div className="record-detail-header">
          <div className="record-detail-header-center">
            <h1>Prontuário — {patient?.full_name}</h1>
            <p>Paciente: {patient?.full_name} | Médico: {doctor?.full_name || doctor?.user?.full_name || '—'}</p>
          </div>
        </div>
      </header>

      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab ${activeTab === tab.id ? 'tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'consultations' && (
          <section>
            <div className="section-header section-header--with-sort">
              <h2>Consultas</h2>
              <div className="section-actions">
                {sortedConsultations.length > 0 && (
                  <div className="sort-dropdown-wrap" ref={sortDropdownRef}>
                    <button
                      type="button"
                      className={`sort-trigger-btn ${sortDropdownOpen ? 'sort-trigger-btn--open' : ''}`}
                      onClick={() => setSortDropdownOpen((v) => !v)}
                      aria-expanded={sortDropdownOpen}
                    >
                      <Filter size={18} />
                    </button>
                    {sortDropdownOpen && (
                      <ul className="sort-dropdown-list" role="listbox">
                        {SORT_OPTIONS.map((opt) => (
                          <li key={opt.value} role="option" aria-selected={sortOrder === opt.value}>
                            <button
                              type="button"
                              className={`sort-dropdown-item ${sortOrder === opt.value ? 'sort-dropdown-item--active' : ''}`}
                              onClick={() => {
                                setSortOrder(opt.value);
                                setSortDropdownOpen(false);
                              }}
                            >
                              {opt.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                <Button onClick={() => setShowConsultationModal(true)}>+ Nova Consulta</Button>
              </div>
            </div>
            {sortedConsultations.length === 0 ? (
              <Card>
                <div className="empty-state small">
                  <p>Nenhuma consulta registrada.</p>
                  <Button onClick={() => setShowConsultationModal(true)}>Registrar consulta</Button>
                </div>
              </Card>
            ) : (
              <div className="items-list">
                {sortedConsultations.map((c) => (
                  <Card key={c.id} className="consultation-card">
                    <div className="consultation-header">
                      <span className="consultation-date">
                        {formatDateBR(resolveItemDate(c))}
                      </span>
                    </div>
                    <IntegrityBadge item={c} label="Consulta" />
                    <div className="consultation-body">
                      <div><strong>Queixa principal:</strong> {c.chief_complaint}</div>
                      <div><strong>História:</strong> {c.history_of_present_illness}</div>
                      <div><strong>Diagnóstico:</strong> {c.diagnosis}</div>
                      <div><strong>Plano de tratamento:</strong> {c.treatment_plan}</div>
                    </div>
                    {(c.prescription?.items?.length > 0 || c.prescriptions?.[0]?.items?.length > 0) && (
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
                <Button onClick={() => setShowDiagnosticModal(true)}>+ Novo Diagnóstico</Button>
              </div>
            </div>
            {sortedDiagnostics.length === 0 ? (
              <Card>
                <div className="empty-state small">
                  <p>Nenhum diagnóstico registrado.</p>
                </div>
              </Card>
            ) : (
              <div className="items-list">
                {sortedDiagnostics.map((d) => (
                  <Card key={d.id} className="diagnostic-card">
                    <span className="diagnostic-date">
                      {formatDateBR(resolveItemDate(d, 'diagnostic'))}
                    </span>
                    <IntegrityBadge item={d} label="Diagnóstico" />
                    <div><strong>Descrição:</strong> {d.description}</div>
                    <div><strong>Resultado:</strong> {d.result}</div>
                  </Card>
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
                <Button onClick={() => setShowCertificateModal(true)}>+ Novo Atestado</Button>
              </div>
            </div>
            {sortedCertificates.length === 0 ? (
              <Card>
                <div className="empty-state small">
                  <p>Nenhum atestado emitido.</p>
                </div>
              </Card>
            ) : (
              <div className="items-list">
                {sortedCertificates.map((cert) => (
                  <Card key={cert.id} className="certificate-card">
                    <span className="cert-date">
                      {formatDateBR(resolveItemDate(cert))}
                    </span>
                    <IntegrityBadge item={cert} label="Atestado" />
                    <div><strong>Finalidade:</strong> {cert.purpose}</div>
                    <div><strong>Dias de afastamento:</strong> {cert.period_of_leave}</div>
                  </Card>
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
                <Button onClick={() => setShowFileModal(true)}>+ Novo Arquivo</Button>
              </div>
            </div>
            {sortedFiles.length === 0 ? (
              <Card>
                <div className="empty-state small">
                  <p>Nenhum arquivo anexado.</p>
                </div>
              </Card>
            ) : (
              <div className="items-list files-grid">
                {sortedFiles.map((f) => (
                  <Card key={f.id} className="file-card">
                    <FileAttachment file={f} />
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {showConsultationModal && (
        <ConsultationModal
          doctorId={record.doctor_id}
          patientId={record.patient_id}
          onClose={() => setShowConsultationModal(false)}
          onSaved={handleSaved}
        />
      )}
      {showDiagnosticModal && (
        <DiagnosticModal
          doctorId={record.doctor_id}
          patientId={record.patient_id}
          onClose={() => setShowDiagnosticModal(false)}
          onSaved={handleSaved}
        />
      )}
      {showCertificateModal && (
        <CertificateModal
          doctorId={record.doctor_id}
          patientId={record.patient_id}
          onClose={() => setShowCertificateModal(false)}
          onSaved={handleSaved}
        />
      )}
      {showFileModal && (
        <FileModal
          patientId={record.patient_id}
          onClose={() => setShowFileModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
