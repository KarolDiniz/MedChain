import { useState } from 'react';
import { addMedicalRecord } from '../../services/medicalRecordService';
import { useNavigate } from 'react-router-dom';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Card } from '../common/Card';
import './Modal.css';

export function MedicalRecordModal({ doctorId, patients, preselectedPatientId, onClose, onSaved }) {
  const [patientId, setPatientId] = useState(preselectedPatientId || (patients[0]?.id || ''));
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!patientId) return;
    const record = addMedicalRecord(doctorId, patientId);
    onSaved();
    navigate(`/doctor/medical-records/${record.id}`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <Card className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Novo Prontuário Médico</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <p className="modal-note">
          Um novo prontuário será criado e vinculado ao paciente. O hash e o registro na blockchain
          são gerados automaticamente.
        </p>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="input-group">
            <label className="input-label">Paciente *</label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="input-field"
              required
            >
              <option value="">Selecione um paciente</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name} - {p.email}</option>
              ))}
            </select>
          </div>
          {patients.length === 0 && (
            <p className="modal-warning">
              Não há pacientes cadastrados. Cadastre um paciente primeiro.
            </p>
          )}
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={patients.length === 0}>Criar Prontuário</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
