import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FolderOpen } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getPatientsByDoctor, getMedicalRecordsByDoctor } from '../../services/medicalRecordService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { MedicalRecordModal } from '../../components/doctor/MedicalRecordModal';
import './MedicalRecordsPage.css';

export function MedicalRecordsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patient');
  const patients = getPatientsByDoctor(user?.id) || [];
  const records = getMedicalRecordsByDoctor(user?.id) || [];
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="medical-records-page">
      <header className="page-header">
        <div>
          <h1>Prontuários Médicos</h1>
          <p>Gerencie consultas, diagnósticos, prescrições e atestados</p>
        </div>
        <Button onClick={() => setShowModal(true)}>+ Novo Prontuário</Button>
      </header>

      <Card>
        {records.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state-icon">
              <FolderOpen size={48} strokeWidth={1.5} />
            </span>
            <h3>Nenhum prontuário cadastrado</h3>
            <p>Crie um prontuário vinculado a um paciente para começar.</p>
            <Button onClick={() => setShowModal(true)}>Criar Prontuário</Button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Hash</th>
                  <th>Paciente</th>
                  <th>Data</th>
                  <th>Consultas</th>
                  <th>Diagnósticos</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {records.map((mr) => {
                  const patient = patients.find((p) => p.id === mr.patient_id);
                  return (
                    <tr key={mr.id}>
                      <td>
                        <code className="record-id-cell">{mr.id}</code>
                      </td>
                      <td>{patient?.full_name || '-'}</td>
                      <td>{new Date(mr.created_date).toLocaleDateString('pt-BR')}</td>
                      <td>{mr.consultations?.length || 0}</td>
                      <td>{mr.diagnostics?.length || 0}</td>
                      <td>
                        <Link to={`/doctor/medical-records/${mr.id}`} className="table-action">
                          Ver →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showModal && (
        <MedicalRecordModal
          doctorId={user?.id}
          patients={patients}
          preselectedPatientId={patientId}
          onClose={() => setShowModal(false)}
          onSaved={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
