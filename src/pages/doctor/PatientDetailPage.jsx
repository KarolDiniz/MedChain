import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  getPatientById,
  getMedicalRecordsByDoctor,
  getMedicalRecordById,
} from '../../services/medicalRecordService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import './PatientDetailPage.css';

const GENDER_LABELS = { FEMALE: 'Feminino', MALE: 'Masculino', OTHER: 'Outro' };

export function PatientDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const patient = getPatientById(id);
  const allRecords = getMedicalRecordsByDoctor(user?.id) || [];
  const records = allRecords.filter((r) => r.patient_id === id);

  if (!patient || patient.doctor_id !== user?.id) {
    return (
      <div className="patient-detail">
        <p>Paciente não encontrado.</p>
        <Link to="/doctor/patients">← Voltar</Link>
      </div>
    );
  }

  return (
    <div className="patient-detail">
      <header className="page-header">
        <Link to="/doctor/patients" className="back-link">← Voltar aos pacientes</Link>
        <h1>{patient.full_name}</h1>
        <p>Detalhes e prontuários do paciente</p>
      </header>

      <Card>
        <h2>Dados pessoais</h2>
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
        {patient.address && (patient.address.street || patient.address.city) && (
          <>
            <h3>Endereço</h3>
            <p className="detail-address">
              {[patient.address.street, patient.address.number, patient.address.complement]
                .filter(Boolean)
                .join(', ')}
              {patient.address.neighborhood && ` - ${patient.address.neighborhood}`}
              {patient.address.city && ` - ${patient.address.city}`}
              {patient.address.state && `/${patient.address.state}`}
            </p>
          </>
        )}
      </Card>

      <section className="patient-records-section">
        <div className="section-header">
          <h2>Prontuários médicos</h2>
          <Link to={`/doctor/medical-records?patient=${id}`}>
            <Button>+ Novo Prontuário</Button>
          </Link>
        </div>
        {records.length === 0 ? (
          <Card>
            <div className="empty-state">
              <p>Nenhum prontuário ainda.</p>
              <Link to={`/doctor/medical-records?patient=${id}`}>
                <Button>Criar primeiro prontuário</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="records-list">
            {records.map((mr) => (
              <Link key={mr.id} to={`/doctor/medical-records/${mr.id}`} className="record-card-link">
                <Card className="record-card">
                  <div className="record-card-header">
                    <span className="record-hash">#{mr.hash?.slice(0, 8)}...</span>
                    <span className="record-date">
                      {new Date(mr.created_date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="record-card-stats">
                    <span>📋 {mr.consultations?.length || 0} consultas</span>
                    <span>🔬 {mr.diagnostics?.length || 0} diagnósticos</span>
                    <span>💊 Prescrições</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
