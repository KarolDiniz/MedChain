import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  getMedicalRecordById,
  getPatientById,
  getDoctorById,
  addConsultation,
  addDiagnostic,
  addPrescription,
  addMedicalCertificate,
  addFile,
} from '../../services/medicalRecordService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ConsultationModal } from '../../components/doctor/ConsultationModal';
import { DiagnosticModal } from '../../components/doctor/DiagnosticModal';
import { PrescriptionModal } from '../../components/doctor/PrescriptionModal';
import { CertificateModal } from '../../components/doctor/CertificateModal';
import { FileModal } from '../../components/doctor/FileModal';
import './MedicalRecordDetailPage.css';

export function MedicalRecordDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const record = getMedicalRecordById(id);
  const [activeTab, setActiveTab] = useState('consultations');
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionConsultationId, setPrescriptionConsultationId] = useState(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);

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

  const openPrescriptionModal = (consultationId) => {
    setPrescriptionConsultationId(consultationId);
    setShowPrescriptionModal(true);
  };

  const tabs = [
    { id: 'consultations', label: 'Consultas', count: record.consultations?.length || 0 },
    { id: 'diagnostics', label: 'Diagnósticos', count: record.diagnostics?.length || 0 },
    { id: 'certificates', label: 'Atestados', count: record.medical_certificates?.length || 0 },
    { id: 'files', label: 'Arquivos', count: record.files?.length || 0 },
  ];

  return (
    <div className="record-detail-page">
      <header className="page-header">
        <Link to="/doctor/medical-records" className="back-link">← Voltar aos prontuários</Link>
        <div className="record-detail-header">
          <div>
            <h1>Prontuário #{record.hash?.slice(0, 12)}...</h1>
            <p>Paciente: {patient?.full_name} | Médico: {doctor?.full_name}</p>
          </div>
          <div className="blockchain-info">
            <span className="blockchain-badge-small">🔗 Blockchain</span>
          </div>
        </div>
      </header>

      <Card className="record-hash-card">
        <div className="hash-info">
          <span className="hash-label">Hash do prontuário (auditoria)</span>
          <code className="hash-value">{record.hash}</code>
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
            <div className="section-header">
              <h2>Consultas</h2>
              <Button onClick={() => setShowConsultationModal(true)}>+ Nova Consulta</Button>
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
                {record.consultations.map((c) => (
                  <Card key={c.id} className="consultation-card">
                    <div className="consultation-header">
                      <span className="consultation-date">
                        {new Date(c.created_date).toLocaleDateString('pt-BR')}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openPrescriptionModal(c.id)}
                      >
                        + Prescrição
                      </Button>
                    </div>
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
            <div className="section-header">
              <h2>Diagnósticos</h2>
              <Button onClick={() => setShowDiagnosticModal(true)}>+ Novo Diagnóstico</Button>
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
                {record.diagnostics.map((d) => (
                  <Card key={d.id} className="diagnostic-card">
                    <span className="diagnostic-date">
                      {new Date(d.issue_date).toLocaleDateString('pt-BR')}
                    </span>
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
            <div className="section-header">
              <h2>Atestados</h2>
              <Button onClick={() => setShowCertificateModal(true)}>+ Novo Atestado</Button>
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
                {record.medical_certificates.map((cert) => (
                  <Card key={cert.id} className="certificate-card">
                    <span className="cert-date">
                      {new Date(cert.created_date).toLocaleDateString('pt-BR')}
                    </span>
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
            <div className="section-header">
              <h2>Arquivos</h2>
              <Button onClick={() => setShowFileModal(true)}>+ Novo Arquivo</Button>
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
                {record.files.map((f) => (
                  <Card key={f.id} className="file-card">
                    <span className="file-format">{f.format}</span>
                    <div className="file-desc">{f.description}</div>
                    <code className="file-hash">#{f.hash?.slice(0, 8)}...</code>
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
      {showPrescriptionModal && prescriptionConsultationId && (
        <PrescriptionModal
          recordId={record.id}
          consultationId={prescriptionConsultationId}
          onClose={() => {
            setShowPrescriptionModal(false);
            setPrescriptionConsultationId(null);
          }}
          onSaved={() => {
            setShowPrescriptionModal(false);
            setPrescriptionConsultationId(null);
          }}
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
