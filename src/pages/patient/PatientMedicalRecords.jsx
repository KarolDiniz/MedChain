import { useState } from 'react';
import { ClipboardList, ChevronDown, ChevronUp, Link2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getMedicalRecordsByPatient, getDoctorById } from '../../services/medicalRecordService';
import { Card } from '../../components/common/Card';
import './PatientMedicalRecords.css';

export function PatientMedicalRecords() {
  const { user } = useAuth();
  const records = getMedicalRecordsByPatient(user?.id) || [];
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div className="patient-records">
      <header className="page-header">
        <h1>Meus Prontuários</h1>
        <p>Visualize seus registros médicos. Dados protegidos por blockchain.</p>
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
            const doctor = getDoctorById(mr.doctor_id);
            const isExpanded = expandedId === mr.id;
            return (
              <Card key={mr.id} className="record-accordion-item">
                <button
                  type="button"
                  className="record-accordion-header"
                  onClick={() => setExpandedId(isExpanded ? null : mr.id)}
                >
                  <div className="record-accordion-title">
                    <span className="record-hash-badge">#{mr.hash?.slice(0, 8)}...</span>
                    <span>{new Date(mr.created_date).toLocaleDateString('pt-BR')}</span>
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
                    <p className="record-doctor">Médico: {doctor?.full_name}</p>

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
                            {c.prescriptions?.length > 0 && (
                              <div className="prescriptions-list">
                                <strong>Prescrições:</strong>
                                {c.prescriptions.flatMap((p) =>
                                  (p.items || []).map((item, i) => (
                                    <div key={i}>
                                      {item.medication_name} - {item.dosage} {item.frequency} ({item.treatment_duration})
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
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
                              {new Date(d.issue_date).toLocaleDateString('pt-BR')}
                            </span>
                            <div><strong>{d.description}</strong></div>
                            <div>Resultado: {d.result}</div>
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
                          </div>
                        ))}
                      </section>
                    )}

                    {mr.files?.length > 0 && (
                      <section className="record-section">
                        <h4>Arquivos</h4>
                        {mr.files.map((f) => (
                          <div key={f.id} className="record-block file-block">
                            <span className="file-format">{f.format}</span> - {f.description}
                          </div>
                        ))}
                      </section>
                    )}

                    <div className="record-blockchain">
                      <span className="record-blockchain-label">
                        <Link2 size={16} strokeWidth={2} />
                        Registro blockchain
                      </span>
                      <code>Hash: {mr.hash?.slice(0, 16)}...</code>
                    </div>
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
