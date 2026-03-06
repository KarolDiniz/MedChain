import { useState } from 'react';
import { addFile } from '../../services/medicalRecordService';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import './Modal.css';

export function FileModal({ patientId, onClose, onSaved }) {
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientId || !file) {
      setError('Selecione um arquivo (PDF, PNG ou JPEG).');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await addFile(patientId, file, description);
      onSaved();
    } catch (err) {
      setError(err?.message || 'Erro ao enviar arquivo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card card--padding" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Anexar Arquivo</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <p className="modal-note">
          Envie arquivos em PDF, PNG ou JPEG. O hash é gerado para auditoria na blockchain.
        </p>
        <form onSubmit={handleSubmit} className="modal-form">
          {error && <p className="modal-error">{error}</p>}
          <Input
            label="Descrição"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Resultado hemograma"
          />
          <div className="input-group">
            <label className="input-label">Arquivo *</label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="input-field"
            />
          </div>
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving || !file}>{saving ? 'Enviando...' : 'Enviar'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
