import { useState } from 'react';
import { addPrescription } from '../../services/medicalRecordService';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import './Modal.css';

export function PrescriptionModal({ recordId, consultationId, onClose, onSaved }) {
  const [items, setItems] = useState([
    { medication_name: '', dosage: '', frequency: '', treatment_duration: '' },
  ]);

  const addItem = () => {
    setItems((prev) => [...prev, { medication_name: '', dosage: '', frequency: '', treatment_duration: '' }]);
  };

  const updateItem = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validItems = items.filter((i) => i.medication_name.trim());
    if (validItems.length === 0) return;
    addPrescription(consultationId, recordId, {
      issue_date: new Date().toISOString(),
      items: validItems,
    });
    onSaved();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card card--padding modal-content--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nova Prescrição</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          {items.map((item, i) => (
            <div key={i} className="prescription-item">
              <h4>Medicamento {i + 1}</h4>
              <Input
                label="Nome do medicamento"
                value={item.medication_name}
                onChange={(e) => updateItem(i, 'medication_name', e.target.value)}
                placeholder="Ex: Paracetamol 750mg"
              />
              <div className="form-row">
                <Input
                  label="Dosagem"
                  value={item.dosage}
                  onChange={(e) => updateItem(i, 'dosage', e.target.value)}
                  placeholder="1 comprimido"
                />
                <Input
                  label="Frequência"
                  value={item.frequency}
                  onChange={(e) => updateItem(i, 'frequency', e.target.value)}
                  placeholder="8/8h"
                />
              </div>
              <Input
                label="Duração do tratamento"
                value={item.treatment_duration}
                onChange={(e) => updateItem(i, 'treatment_duration', e.target.value)}
                placeholder="5 dias"
              />
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            + Adicionar medicamento
          </Button>
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Salvar prescrição</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
