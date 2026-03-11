import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Filter } from 'lucide-react';
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

  if (loading) return <div className="patient-detail"><p>Carregando...</p></div>;
  if (!patient) {
    return (
      <div className="patient-detail">
        <p>Paciente não encontrado.</p>
        <Link to="/doctor/patients">← Voltar</Link>
      </div>
    );
  }

  return (
    <div className="patient-detail patient-detail--prontuarios">
      <header className="page-header">
        <Link to="/doctor/patients" className="back-link">← Voltar aos pacientes</Link>
        <h1>{patient.full_name}</h1>
        <p>Cadastre consultas, diagnósticos, atestados e arquivos</p>
      </header>

      <Card className="patient-info-card">
        <h2>Dados do paciente</h2>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">E-mail</span>
            <span className="detail-value">{patient.email}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Telefone</span>
            <span className="detail-value">{patient.cellphone || '-'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Data de nascimento</span>
            <span className="detail-value">
              {patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('pt-BR') : '-'}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Gênero</span>
            <span className="detail-value">{GENDER_LABELS[patient.gender] || patient.gender}</span>
          </div>
        </div>
      </Card>

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
                {sortedConsultations.length > 0 && <SortControl />}
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
                      {new Date(d.issue_date || d.created_date).toLocaleDateString('pt-BR')}
                    </span>
                    {d.hash && <HashBadge hash={d.hash} title="Diagnóstico" />}
                    <div><strong>Descrição:</strong> {d.description || '-'}</div>
                    <div><strong>Resultado:</strong> {d.result || '-'}</div>
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
                {sortedCertificates.length > 0 && <SortControl />}
                <Button onClick={() => setShowCertificateModal(true)}>+ Novo Atestado</Button>
              </div>
            </div>
            {sortedCertificates.length === 0 ? (
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
                    <div><strong>Finalidade:</strong> {cert.purpose || '-'}</div>
                    <div><strong>Dias de afastamento:</strong> {cert.period_of_leave ?? '-'}</div>
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
                {sortedFiles.length > 0 && <SortControl />}
                <Button onClick={() => setShowFileModal(true)}>+ Novo Arquivo</Button>
              </div>
            </div>
            {sortedFiles.length === 0 ? (
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
                    {f.created_date && (
                      <span className="file-date">{new Date(f.created_date).toLocaleDateString('pt-BR')}</span>
                    )}
                    <span className="file-format">{f.format || 'Arquivo'}</span>
                    <div className="file-desc">{f.description || '-'}</div>
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
    </div>
  );
}
