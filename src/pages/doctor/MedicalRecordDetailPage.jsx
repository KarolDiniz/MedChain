import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Filter } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getMedicalRecordById,
  getPatientById,
  getDoctorById,
  addDiagnostic,
  addMedicalCertificate,
  addFile,
} from '../../services/medicalRecordService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { getHashTypePrefix } from '../../utils/hashUtils';
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
  const record = getMedicalRecordById(id);
  const [activeTab, setActiveTab] = useState('consultations');
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [sortOrder, setSortOrder] = useState(SORT_RECENT);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const sortDropdownRef = useRef(null);

  if (!record || record.doctor_id !== user?.id) {
    return (
      <div>
        <p>Prontuário não encontrado.</p>
        <Link to="/doctor/medical-records">← Voltar</Link>
      </div>
    );
  }

  const patient = getPatientById(record.patient_id);
  const doctor = getDoctorById(record.doctor_id);

  const tabs = [
    { id: 'consultations', label: 'Consultas', count: record.consultations?.length || 0 },
    { id: 'diagnostics', label: 'Diagnósticos', count: record.diagnostics?.length || 0 },
    { id: 'certificates', label: 'Atestados', count: record.medical_certificates?.length || 0 },
    { id: 'files', label: 'Arquivos', count: record.files?.length || 0 },
  ];

  const prefixToLabel = { con: 'Consulta', dia: 'Diagnóstico', cert: 'Atestado', file: 'Arquivo' };

  useEffect(() => {
    function handleClickOutside(e) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
        setSortDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortedConsultations = useMemo(() => {
    const list = record.consultations || [];
    return [...list].sort((a, b) => {
      if (sortOrder === SORT_RECENT || sortOrder === SORT_OLDEST) {
        const da = new Date(a.created_date).getTime();
        const db = new Date(b.created_date).getTime();
        return sortOrder === SORT_RECENT ? db - da : da - db;
      }
      const sa = (a.chief_complaint || a.diagnosis || '').toLowerCase();
      const sb = (b.chief_complaint || b.diagnosis || '').toLowerCase();
      return sortOrder === SORT_ALPHA_ASC ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
  }, [record.consultations, sortOrder]);

  const sortedDiagnostics = useMemo(() => {
    const list = record.diagnostics || [];
    return [...list].sort((a, b) => {
      if (sortOrder === SORT_RECENT || sortOrder === SORT_OLDEST) {
        const da = new Date(a.issue_date || a.created_date).getTime();
        const db = new Date(b.issue_date || b.created_date).getTime();
        return sortOrder === SORT_RECENT ? db - da : da - db;
      }
      const sa = (a.description || '').toLowerCase();
      const sb = (b.description || '').toLowerCase();
      return sortOrder === SORT_ALPHA_ASC ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
  }, [record.diagnostics, sortOrder]);

  const sortedCertificates = useMemo(() => {
    const list = record.medical_certificates || [];
    return [...list].sort((a, b) => {
      if (sortOrder === SORT_RECENT || sortOrder === SORT_OLDEST) {
        const da = new Date(a.created_date).getTime();
        const db = new Date(b.created_date).getTime();
        return sortOrder === SORT_RECENT ? db - da : da - db;
      }
      const sa = (a.purpose || '').toLowerCase();
      const sb = (b.purpose || '').toLowerCase();
      return sortOrder === SORT_ALPHA_ASC ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
  }, [record.medical_certificates, sortOrder]);

  const sortedFiles = useMemo(() => {
    const list = record.files || [];
    if (sortOrder === SORT_ALPHA_ASC || sortOrder === SORT_ALPHA_DESC) {
      return [...list].sort((a, b) => {
        const sa = (a.description || '').toLowerCase();
        const sb = (b.description || '').toLowerCase();
        return sortOrder === SORT_ALPHA_ASC ? sa.localeCompare(sb) : sb.localeCompare(sa);
      });
    }
    return sortOrder === SORT_OLDEST ? [...list] : [...list].reverse();
  }, [record.files, sortOrder]);

  const SortOrderControl = () => (
    <div className="sort-dropdown-wrap" ref={sortDropdownRef}>
      <button
        type="button"
        className={`sort-trigger-btn ${sortDropdownOpen ? 'sort-trigger-btn--open' : ''}`}
        onClick={() => setSortDropdownOpen((v) => !v)}
        aria-expanded={sortDropdownOpen}
        aria-haspopup="listbox"
        aria-label="Abrir ordenação"
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
  );

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

  return (
    <div className="record-detail-page">
      <header className="page-header">
        <Link to="/doctor/medical-records" className="back-link">← Voltar aos prontuários</Link>
        <div className="record-detail-header">
          <div className="record-detail-header-center">
            <h1>Prontuário — {patient?.full_name}</h1>
            <p>Paciente: {patient?.full_name} | Médico: {doctor?.full_name}</p>
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
                {sortedConsultations.length > 0 && <SortOrderControl />}
                <Button onClick={() => setShowConsultationModal(true)}>+ Nova Consulta</Button>
              </div>
            </div>
            {(!record.consultations || record.consultations.length === 0) ? (
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
                        {new Date(c.created_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    {c.hash && <HashBadge hash={c.hash} title="Consulta" />}
                    <div className="consultation-body">
                      <div><strong>Queixa principal:</strong> {c.chief_complaint}</div>
                      <div><strong>História:</strong> {c.history_of_present_illness}</div>
                      <div><strong>Diagnóstico:</strong> {c.diagnosis}</div>
                      <div><strong>Plano de tratamento:</strong> {c.treatment_plan}</div>
                    </div>
                    {c.prescriptions && c.prescriptions.length > 0 && (
                      <div className="prescriptions-mini">
                        <strong>Prescrições:</strong>
                        {c.prescriptions.map((p) => (
                          <div key={p.id} className="prescription-mini">
                            {p.items?.map((item, i) => (
                              <div key={i}>
                                {item.medication_name} - {item.dosage} {item.frequency}
                              </div>
                            ))}
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
                {sortedDiagnostics.length > 0 && <SortOrderControl />}
                <Button onClick={() => setShowDiagnosticModal(true)}>+ Novo Diagnóstico</Button>
              </div>
            </div>
            {(!record.diagnostics || record.diagnostics.length === 0) ? (
              <Card>
                <div className="empty-state small">
                  <p>Nenhum diagnóstico registrado.</p>
                  <Button onClick={() => setShowDiagnosticModal(true)}>Registrar diagnóstico</Button>
                </div>
              </Card>
            ) : (
              <div className="items-list">
                {sortedDiagnostics.map((d) => (
                  <Card key={d.id} className="diagnostic-card">
                    <span className="diagnostic-date">
                      {new Date(d.issue_date).toLocaleDateString('pt-BR')}
                    </span>
                    {d.hash && <HashBadge hash={d.hash} title="Diagnóstico" />}
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
                {sortedCertificates.length > 0 && <SortOrderControl />}
                <Button onClick={() => setShowCertificateModal(true)}>+ Novo Atestado</Button>
              </div>
            </div>
            {(!record.medical_certificates || record.medical_certificates.length === 0) ? (
              <Card>
                <div className="empty-state small">
                  <p>Nenhum atestado emitido.</p>
                  <Button onClick={() => setShowCertificateModal(true)}>Emitir atestado</Button>
                </div>
              </Card>
            ) : (
              <div className="items-list">
                {sortedCertificates.map((cert) => (
                  <Card key={cert.id} className="certificate-card">
                    <span className="cert-date">
                      {new Date(cert.created_date).toLocaleDateString('pt-BR')}
                    </span>
                    {cert.hash && <HashBadge hash={cert.hash} title="Atestado" />}
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
                {sortedFiles?.length > 0 && <SortOrderControl />}
                <Button onClick={() => setShowFileModal(true)}>+ Novo Arquivo</Button>
              </div>
            </div>
            {(!record.files || record.files.length === 0) ? (
              <Card>
                <div className="empty-state small">
                  <p>Nenhum arquivo anexado.</p>
                  <Button onClick={() => setShowFileModal(true)}>Anexar arquivo</Button>
                </div>
              </Card>
            ) : (
              <div className="items-list files-grid">
                {sortedFiles.map((f) => (
                  <Card key={f.id} className="file-card">
                    <span className="file-format">{f.format}</span>
                    <div className="file-desc">{f.description}</div>
                    {f.hash && <HashBadge hash={f.hash} title="Arquivo" />}
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {showConsultationModal && (
        <ConsultationModal
          recordId={record.id}
          onClose={() => setShowConsultationModal(false)}
          onSaved={() => setShowConsultationModal(false)}
        />
      )}
      {showDiagnosticModal && (
        <DiagnosticModal
          recordId={record.id}
          onClose={() => setShowDiagnosticModal(false)}
          onSaved={() => setShowDiagnosticModal(false)}
        />
      )}
      {showCertificateModal && (
        <CertificateModal
          recordId={record.id}
          onClose={() => setShowCertificateModal(false)}
          onSaved={() => setShowCertificateModal(false)}
        />
      )}
      {showFileModal && (
        <FileModal
          recordId={record.id}
          onClose={() => setShowFileModal(false)}
          onSaved={() => setShowFileModal(false)}
        />
      )}
    </div>
  );
}
