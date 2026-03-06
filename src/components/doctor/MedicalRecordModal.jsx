import { useState, useEffect } from 'react';
import { addMedicalRecord } from '../../services/medicalRecordService';
import { useNavigate } from 'react-router-dom';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import './Modal.css';

export function MedicalRecordModal({ doctorId, patients, preselectedPatientId, onClose, onSaved }) {
  const patientPublicId = (p) => p.patient_public_id || p.uid || p.id;
  const [patientId, setPatientId] = useState('');
  useEffect(() => {
    if (!preselectedPatientId) {
      setPatientId(patients[0] ? (patients[0].patient_public_id || patients[0].uid || patients[0].id) : '');
      return;
    }
    const found = patients.find(
      (p) => p.uid === preselectedPatientId || p.patient_public_id === preselectedPatientId || p.id === preselectedPatientId
    );
    setPatientId(found ? (found.patient_public_id || found.uid || found.id) : preselectedPatientId);
  }, [patients, preselectedPatientId]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientId || !doctorId) return;
    setSaving(true);
    setError(null);
    try {
      const recordId = await addMedicalRecord(doctorId, patientId, 'consultation', {
        chief_complaint: '',
        history_of_present_illness: '',
        diagnosis: '',
        treatment_plan: '',
      });
      onSaved();
      if (recordId) {
        navigate(`/doctor/medical-records/${recordId}`);
      }
    } catch (err) {
      setError(err?.message || 'Erro ao criar prontuário.');
    } finally {
      setSaving(false);
    }
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
          {error && <p className="modal-error">{error}</p>}
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
                <option key={p.uid || p.id} value={patientPublicId(p)}>{p.full_name} - {p.email}</option>
              ))}
            </select>
          </div>
          {patients.length === 0 && (
            <p className="modal-warning">
              Não há pacientes cadastrados. Cadastre um paciente primeiro.
            </p>
          )}
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={patients.length === 0 || saving}>{saving ? 'Criando...' : 'Criar Prontuário'}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
