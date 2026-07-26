import { useState, useEffect } from 'react';
import { ClipboardList, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getMedicalRecordsByPatient, getDoctorById } from '../../services/medicalRecordService';
import { Card } from '../../components/common/Card';
import { IntegrityBadge } from '../../components/common/IntegrityBadge';
import { FileAttachment } from '../../components/common/FileAttachment';
import './PatientMedicalRecords.css';

function DoctorName({ doctorId }) {
  const [name, setName] = useState('-');
  useEffect(() => {
    if (!doctorId) return;
    getDoctorById(doctorId).then((d) => setName(d?.full_name || d?.user?.full_name || '-'));
  }, [doctorId]);
  return <>{name}</>;
}

export function PatientMedicalRecords() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const patientId = user?.patient_public_id || user?.id || user?.uid;

  useEffect(() => {
    const load = async () => {
      if (!patientId) {
        setRecords([]);
        setLoading(false);
        return;
      }
      try {
        const list = await getMedicalRecordsByPatient(patientId);
        setRecords(list || []);
      } catch {
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [patientId]);

  if (loading) {
    return (
      <div className="patient-records">
        <header className="page-header">
          <h1>Meus Prontuários</h1>
          <p>Carregando...</p>
        </header>
        <Card><div className="empty-state"><p>Carregando prontuários...</p></div></Card>
      </div>
    );
  }

  return (
    <div className="patient-records">
      <header className="page-header">
        <h1>Meus Prontuários</h1>
        <p>
          Visualize seus registros e verifique a integridade (hash SHA-256 ancorado na Solana).
        </p>
      </header>

      {records.length === 0 ? (
        <Card>
          <div className="empty-state">
            <span className="empty-state-icon">
              <ClipboardList size={48} strokeWidth={1.5} />
            </span>
            <h3>Nenhum prontuário</h3>
            <p>Seus prontuários aparecerão aqui após serem cadastrados pelo médico.</p>
          </div>
        </Card>
      ) : (
        <div className="records-accordion">
          {records.map((mr) => {
            const isExpanded = expandedId === mr.id;
            return (
              <Card key={mr.id} className="record-accordion-item">
                <button
                  type="button"
                  className="record-accordion-header"
                  onClick={() => setExpandedId(isExpanded ? null : mr.id)}
                >
                  <div className="record-accordion-title">
                    <span className="record-id-badge">{String(mr.id).slice(0, 8)}</span>
                    <span>{mr.created_date ? new Date(mr.created_date).toLocaleDateString('pt-BR') : '-'}</span>
                  </div>
                  <span className="record-accordion-icon">
                    {isExpanded ? (
                      <ChevronUp size={20} strokeWidth={2} />
                    ) : (
                      <ChevronDown size={20} strokeWidth={2} />
                    )}
                  </span>
                </button>
                {isExpanded && (
                  <div className="record-accordion-body">
                    <p className="record-doctor">
                      Médico:{' '}
                      {mr.consultations?.[0]?.medical_record?.doctor?.user?.full_name
                        || mr.diagnostics?.[0]?.medical_record?.doctor?.user?.full_name
                        || mr.medical_certificates?.[0]?.medical_record?.doctor?.user?.full_name
                        || <DoctorName doctorId={mr.doctor_id} />}
                    </p>

                    {mr.consultations?.length > 0 && (
                      <section className="record-section">
                        <h4>Consultas</h4>
                        {mr.consultations.map((c) => (
                          <div key={c.id} className="record-block">
                            <span className="record-date">
                              {new Date(c.created_date).toLocaleDateString('pt-BR')}
                            </span>
                            <div><strong>Queixa:</strong> {c.chief_complaint}</div>
                            <div><strong>Diagnóstico:</strong> {c.diagnosis}</div>
                            <div><strong>Tratamento:</strong> {c.treatment_plan}</div>
                            {(c.prescription?.items?.length > 0 || c.prescriptions?.[0]?.items?.length > 0) && (
                              <div className="prescriptions-list">
                                <strong>Prescrições:</strong>
                                {(c.prescription?.items || c.prescriptions?.flatMap((p) => p.items || []) || []).map((item, i) => (
                                  <div key={i}>
                                    {item.medication_name} - {item.dosage} {item.frequency} ({item.treatment_duration})
                                  </div>
                                ))}
                              </div>
                            )}
                            <IntegrityBadge item={c} label="Consulta" />
                          </div>
                        ))}
                      </section>
                    )}

                    {mr.diagnostics?.length > 0 && (
                      <section className="record-section">
                        <h4>Diagnósticos</h4>
                        {mr.diagnostics.map((d) => (
                          <div key={d.id} className="record-block">
                            <span className="record-date">
                              {new Date(d.issue_date || d.created_date).toLocaleDateString('pt-BR')}
                            </span>
                            <div><strong>{d.description}</strong></div>
                            <div>Resultado: {d.result}</div>
                            <IntegrityBadge item={d} label="Diagnóstico" />
                          </div>
                        ))}
                      </section>
                    )}

                    {mr.medical_certificates?.length > 0 && (
                      <section className="record-section">
                        <h4>Atestados</h4>
                        {mr.medical_certificates.map((cert) => (
                          <div key={cert.id} className="record-block">
                            <span className="record-date">
                              {new Date(cert.created_date).toLocaleDateString('pt-BR')}
                            </span>
                            <div>{cert.purpose} - {cert.period_of_leave} dia(s)</div>
                            <IntegrityBadge item={cert} label="Atestado" />
                          </div>
                        ))}
                      </section>
                    )}

                    {mr.files?.length > 0 && (
                      <section className="record-section">
                        <h4>Arquivos</h4>
                        <div className="patient-files-grid">
                          {mr.files.map((f) => (
                            <div key={f.id} className="record-block file-block">
                              <FileAttachment file={f} />
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
