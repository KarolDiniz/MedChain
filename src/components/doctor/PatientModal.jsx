import { useState } from 'react';
import { addPatient } from '../../services/medicalRecordService';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Card } from '../common/Card';
import './Modal.css';

const GENDERS = [
  { value: 'FEMALE', label: 'Feminino' },
  { value: 'MALE', label: 'Masculino' },
  { value: 'OTHER', label: 'Outro' },
];

export function PatientModal({ doctorId, onClose, onSaved }) {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    cellphone: '',
    birth_date: '',
    gender: 'OTHER',
    address: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const field = name.split('.')[1];
      setForm((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addPatient(doctorId, form);
    onSaved();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <Card className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Novo Paciente</h2>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <p className="modal-note">
          O paciente será cadastrado com senha padrão <strong>12345</strong> para acesso.
        </p>
        <form onSubmit={handleSubmit} className="modal-form">
          <h3>Dados pessoais</h3>
          <Input label="Nome completo" name="full_name" value={form.full_name} onChange={handleChange} required />
          <Input label="E-mail" name="email" type="email" value={form.email} onChange={handleChange} required />
          <Input label="Telefone" name="cellphone" value={form.cellphone} onChange={handleChange} placeholder="(11) 99999-9999" />
          <Input label="Data de nascimento" name="birth_date" type="date" value={form.birth_date} onChange={handleChange} />
          <div className="input-group">
            <label className="input-label">Gênero</label>
            <select name="gender" value={form.gender} onChange={handleChange} className="input-field">
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>

          <h3>Endereço</h3>
          <Input label="Rua" name="address.street" value={form.address.street} onChange={handleChange} />
          <div className="form-row">
            <Input label="Número" name="address.number" value={form.address.number} onChange={handleChange} />
            <Input label="Complemento" name="address.complement" value={form.address.complement} onChange={handleChange} />
          </div>
          <Input label="Bairro" name="address.neighborhood" value={form.address.neighborhood} onChange={handleChange} />
          <div className="form-row">
            <Input label="Cidade" name="address.city" value={form.address.city} onChange={handleChange} />
            <Input label="Estado" name="address.state" value={form.address.state} onChange={handleChange} placeholder="SP" />
          </div>

          <div className="modal-actions">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Cadastrar</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
