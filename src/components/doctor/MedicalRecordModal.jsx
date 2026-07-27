import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../common/Button';
import { ModalShell } from './ModalShell';
import { resolvePatientRouteId, findPatientByAnyId } from '../../utils/ids';
import './Modal.css';

function resolveInitialPatientId(patients, preselectedPatientId) {
  if (preselectedPatientId) {
    const found = findPatientByAnyId(patients, preselectedPatientId);
    return found ? resolvePatientRouteId(found) : preselectedPatientId;
  }
  return patients[0] ? resolvePatientRouteId(patients[0]) : '';
}

/**
 * Atalho para abrir a ficha do paciente (onde se registram itens clínicos).
 * Pacientes já estão carregados ao abrir o modal — estado inicial basta.
 */
export function MedicalRecordModal({ patients, preselectedPatientId, onClose, onSaved }) {
  const [patientId, setPatientId] = useState(() =>
    resolveInitialPatientId(patients, preselectedPatientId),
  );
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!patientId) return;
    onSaved?.();
    navigate(`/doctor/patients/${patientId}`);
  };

  return (
    <ModalShell title="Abrir ficha do paciente" onClose={onClose}>
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
              <option key={resolvePatientRouteId(p) || p.email} value={resolvePatientRouteId(p)}>
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
    </ModalShell>
  );
}
