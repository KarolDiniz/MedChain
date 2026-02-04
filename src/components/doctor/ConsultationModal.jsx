import { useState } from 'react';
import { addConsultation } from '../../services/medicalRecordService';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Card } from '../common/Card';
import './Modal.css';

export function ConsultationModal({ recordId, onClose, onSaved }) {
  const [form, setForm] = useState({
    chief_complaint: '',
    history_of_present_illness: '',
    diagnosis: '',
    treatment_plan: '',
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addConsultation(recordId, form);
    onSaved();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <Card className="modal-content modal-content--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nova Consulta</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <Input
            label="Queixa principal"
            name="chief_complaint"
            value={form.chief_complaint}
            onChange={handleChange}
            required
          />
          <div className="input-group">
            <label className="input-label">História da doença atual</label>
            <textarea
              name="history_of_present_illness"
              value={form.history_of_present_illness}
              onChange={handleChange}
              className="input-field textarea"
              rows={3}
            />
          </div>
          <Input label="Diagnóstico" name="diagnosis" value={form.diagnosis} onChange={handleChange} required />
          <div className="input-group">
            <label className="input-label">Plano de tratamento</label>
            <textarea
              name="treatment_plan"
              value={form.treatment_plan}
              onChange={handleChange}
              className="input-field textarea"
              rows={3}
            />
          </div>
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Registrar</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
