import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import './Modal.css';

/**
 * Atalho para abrir a ficha do paciente (onde se registram itens clínicos).
 * Não cria um prontuário no servidor — o registro clínico é criado ao salvar
 * consulta/diagnóstico/atestado.
 */
export function MedicalRecordModal({ patients, preselectedPatientId, onClose, onSaved }) {
  const patientPublicId = (p) => p.patient_public_id || p.uid || p.id;
  const [patientId, setPatientId] = useState('');
  useEffect(() => {
    if (!preselectedPatientId) {
      setPatientId(patients[0] ? patientPublicId(patients[0]) : '');
      return;
    }
    const found = patients.find(
      (p) =>
        p.uid === preselectedPatientId
        || p.patient_public_id === preselectedPatientId
        || p.id === preselectedPatientId
    );
    setPatientId(found ? patientPublicId(found) : preselectedPatientId);
  }, [patients, preselectedPatientId]);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!patientId) return;
    onSaved?.();
    navigate(`/doctor/patients/${patientId}`);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <Card className="modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="open-patient-title">
        <div className="modal-header">
          <h2 id="open-patient-title">Abrir ficha do paciente</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar">×</button>
        </div>
        <p className="modal-note">
          Escolha o paciente para registrar consultas, diagnósticos, atestados e arquivos.
          Cada novo registro clínico é criado e ancorado naquele momento — este atalho não gera um prontuário vazio.
        </p>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="input-group">
            <label className="input-label" htmlFor="open-patient-select">Paciente *</label>
            <select
              id="open-patient-select"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="input-field"
              required
            >
              <option value="">Selecione um paciente</option>
              {patients.map((p) => (
                <option key={p.uid || p.id} value={patientPublicId(p)}>
                  {p.full_name} - {p.email}
                </option>
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
            <Button type="submit" disabled={patients.length === 0}>Abrir ficha</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
