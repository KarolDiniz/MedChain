import { useState } from 'react';
import { addFile } from '../../services/medicalRecordService';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import './Modal.css';

export function FileModal({ recordId, onClose, onSaved }) {
  const [form, setForm] = useState({
    description: '',
    format: 'PDF',
    url: '#',
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addFile(recordId, form);
    onSaved();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card card--padding" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Anexar Arquivo</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <p className="modal-note">
          Em ambiente de demonstração, o arquivo é registrado com descrição e formato. O hash é gerado para auditoria.
        </p>
        <form onSubmit={handleSubmit} className="modal-form">
          <Input
            label="Descrição"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Ex: Resultado hemograma"
            required
          />
          <div className="input-group">
            <label className="input-label">Formato</label>
            <select name="format" value={form.format} onChange={handleChange} className="input-field">
              <option value="PDF">PDF</option>
              <option value="PNG">PNG</option>
              <option value="JPG">JPG</option>
              <option value="DOC">DOC</option>
            </select>
          </div>
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Registrar</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
