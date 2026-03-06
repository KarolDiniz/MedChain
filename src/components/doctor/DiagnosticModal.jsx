import { useState } from 'react';
import { addDiagnostic } from '../../services/medicalRecordService';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import './Modal.css';

export function DiagnosticModal({ doctorId, patientId, onClose, onSaved }) {
  const [form, setForm] = useState({
    description: '',
    issue_date: new Date().toISOString().slice(0, 10),
    result: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!doctorId || !patientId) return;
    setSaving(true);
    setError(null);
    try {
      await addDiagnostic(doctorId, patientId, form);
      onSaved();
    } catch (err) {
      setError(err?.message || 'Erro ao registrar diagnóstico.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card card--padding" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Novo Diagnóstico</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          {error && <p className="modal-error">{error}</p>}
          <Input label="Descrição" name="description" value={form.description} onChange={handleChange} required />
          <Input label="Data" name="issue_date" type="date" value={form.issue_date} onChange={handleChange} />
          <div className="input-group">
            <label className="input-label">Resultado</label>
            <textarea
              name="result"
              value={form.result}
              onChange={handleChange}
              className="input-field textarea"
              rows={3}
            />
          </div>
          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Registrar'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
