import { useState } from 'react';
import { addConsultation } from '../../services/medicalRecordService';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Card } from '../common/Card';
import './Modal.css';

const initialPrescriptionItem = () => ({ medication_name: '', dosage: '', frequency: '', treatment_duration: '' });

export function ConsultationModal({ recordId, onClose, onSaved }) {
  const [form, setForm] = useState({
    chief_complaint: '',
    history_of_present_illness: '',
    diagnosis: '',
    treatment_plan: '',
  });
  const [prescriptionItems, setPrescriptionItems] = useState([initialPrescriptionItem()]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const addPrescriptionItem = () => {
    setPrescriptionItems((prev) => [...prev, initialPrescriptionItem()]);
  };

  const updatePrescriptionItem = (index, field, value) => {
    setPrescriptionItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const items = prescriptionItems.filter((i) => i.medication_name?.trim());
    addConsultation(recordId, {
      ...form,
      prescription_items: items.length > 0 ? items : undefined,
    });
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

          <div className="consultation-modal-prescription">
            <h3 className="prescription-section-title">Prescrição (opcional)</h3>
            <p className="prescription-section-hint">A prescrição é registrada junto com a consulta e não poderá ser alterada depois.</p>
            {prescriptionItems.map((item, i) => (
              <div key={i} className="prescription-item">
                <h4>Medicamento {i + 1}</h4>
                <Input
                  label="Nome do medicamento"
                  value={item.medication_name}
                  onChange={(e) => updatePrescriptionItem(i, 'medication_name', e.target.value)}
                  placeholder="Ex: Paracetamol 750mg"
                />
                <div className="form-row">
                  <Input
                    label="Dosagem"
                    value={item.dosage}
                    onChange={(e) => updatePrescriptionItem(i, 'dosage', e.target.value)}
                    placeholder="1 comprimido"
                  />
                  <Input
                    label="Frequência"
                    value={item.frequency}
                    onChange={(e) => updatePrescriptionItem(i, 'frequency', e.target.value)}
                    placeholder="8/8h"
                  />
                </div>
                <Input
                  label="Duração do tratamento"
                  value={item.treatment_duration}
                  onChange={(e) => updatePrescriptionItem(i, 'treatment_duration', e.target.value)}
                  placeholder="5 dias"
                />
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addPrescriptionItem}>
              + Adicionar medicamento
            </Button>
          </div>

          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Registrar consulta</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
