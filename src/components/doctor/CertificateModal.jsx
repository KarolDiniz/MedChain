import { useState } from 'react';
import { addMedicalCertificate } from '../../services/medicalRecordService';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import './Modal.css';

export function CertificateModal({ recordId, onClose, onSaved }) {
  const [form, setForm] = useState({
    purpose: '',
    period_of_leave: '',
  });

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.name === 'period_of_leave' ? parseInt(e.target.value, 10) || 0 : e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addMedicalCertificate(recordId, {
      purpose: form.purpose,
      period_of_leave: parseInt(form.period_of_leave, 10) || 0,
    });
    onSaved();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card card--padding" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Novo Atestado</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <Input
            label="Finalidade"
            name="purpose"
            value={form.purpose}
            onChange={handleChange}
            placeholder="Ex: Afastamento laboral"
            required
          />
          <Input
            label="Dias de afastamento"
            name="period_of_leave"
            type="number"
            min="1"
            value={form.period_of_leave}
            onChange={handleChange}
            required
          />
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Emitir atestado</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
