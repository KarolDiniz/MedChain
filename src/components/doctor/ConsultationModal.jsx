import { useState } from 'react';
import { addConsultation } from '../../services/medicalRecordService';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { ModalShell } from './ModalShell';
import './Modal.css';

const initialPrescriptionItem = () => ({ medication_name: '', dosage: '', frequency: '', treatment_duration: '' });

export function ConsultationModal({ doctorId, patientId, onClose, onSaved }) {
  const [form, setForm] = useState({
    chief_complaint: '',
    history_of_present_illness: '',
    diagnosis: '',
    treatment_plan: '',
  });
  const [prescriptionItems, setPrescriptionItems] = useState([initialPrescriptionItem()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!doctorId || !patientId) {
      setError('Paciente ou médico inválido. Recarregue a página e tente novamente.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const items = prescriptionItems.filter((i) => i.medication_name?.trim());
      await addConsultation(doctorId, patientId, {
        ...form,
        prescription_items: items.length > 0 ? items : undefined,
      });
      onSaved?.('consultation');
    } catch (err) {
      setError(err?.message || 'Erro ao registrar consulta.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Nova Consulta" onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="modal-form">
        {error && <p className="modal-error" role="alert">{error}</p>}
        <Input
          label="Queixa principal"
          name="chief_complaint"
          value={form.chief_complaint}
          onChange={handleChange}
          required
        />
        <div className="input-group">
          <label className="input-label" htmlFor="consultation-hpi">História da doença atual</label>
          <textarea
            id="consultation-hpi"
            name="history_of_present_illness"
            value={form.history_of_present_illness}
            onChange={handleChange}
            className="input-field textarea"
            rows={3}
          />
        </div>
        <Input label="Diagnóstico" name="diagnosis" value={form.diagnosis} onChange={handleChange} required />
        <div className="input-group">
          <label className="input-label" htmlFor="consultation-plan">Plano de tratamento</label>
          <textarea
            id="consultation-plan"
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
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Registrar consulta'}</Button>
        </div>
      </form>
    </ModalShell>
  );
}
