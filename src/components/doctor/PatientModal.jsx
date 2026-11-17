import { useState } from 'react';
import { KeyRound, MapPin, UserRound } from 'lucide-react';
import { addPatient } from '../../services/medicalRecordService';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { ModalShell } from './ModalShell';
import './Modal.css';
import './PatientModal.css';

const GENDERS = [
  { value: 'FEMALE', label: 'Feminino' },
  { value: 'MALE', label: 'Masculino' },
  { value: 'OTHER', label: 'Outro' },
];

export function PatientModal({ doctorId, onClose, onSaved }) {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
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
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await addPatient(doctorId, form);
      onSaved?.('patient');
    } catch (err) {
      setError(err?.message || 'Erro ao cadastrar paciente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell
      title="Novo paciente"
      subtitle="Cadastre os dados clínicos e de acesso. O paciente entra com o e-mail e a senha definidos aqui."
      onClose={onClose}
      wide
      contentClassName="patient-modal"
      initialFocusSelector='input[name="full_name"]'
    >
      {error && (
        <p className="modal-error patient-modal-error" role="alert">
          {error}
        </p>
      )}

      <aside className="patient-modal-callout" aria-label="Acesso do paciente">
        <span className="patient-modal-callout-icon" aria-hidden>
          <KeyRound size={16} strokeWidth={2} />
        </span>
        <div className="patient-modal-callout-body">
          <strong>Acesso inicial</strong>
          <p>
            A senha abaixo é temporária. Oriente o paciente a trocá-la no primeiro acesso.
          </p>
        </div>
      </aside>

      <form onSubmit={handleSubmit} className="modal-form patient-modal-form" noValidate={false}>
        <section className="patient-modal-section" aria-labelledby="patient-personal-heading">
          <header className="patient-modal-section-head">
            <span className="patient-modal-section-icon" aria-hidden>
              <UserRound size={16} strokeWidth={2} />
            </span>
            <div>
              <h3 id="patient-personal-heading">Dados pessoais</h3>
              <p>Identificação e credenciais de login</p>
            </div>
          </header>

          <div className="patient-modal-fields">
            <Input
              label="Nome completo"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              required
              autoComplete="name"
              placeholder="Ex.: Ana Beatriz Nogueira"
            />

            <div className="patient-modal-grid patient-modal-grid--2">
              <Input
                label="E-mail"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                placeholder="paciente@email.com"
              />
              <Input
                label="Senha inicial"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className="patient-modal-grid patient-modal-grid--3">
              <Input
                label="Telefone"
                name="cellphone"
                value={form.cellphone}
                onChange={handleChange}
                autoComplete="tel"
                inputMode="tel"
                placeholder="(11) 99999-9999"
              />
              <Input
                label="Data de nascimento"
                name="birth_date"
                type="date"
                value={form.birth_date}
                onChange={handleChange}
                autoComplete="bday"
              />
              <div className="input-group">
                <label className="input-label" htmlFor="patient-gender">
                  Gênero
                </label>
                <select
                  id="patient-gender"
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="input-field"
                >
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className="patient-modal-section" aria-labelledby="patient-address-heading">
          <header className="patient-modal-section-head">
            <span className="patient-modal-section-icon" aria-hidden>
              <MapPin size={16} strokeWidth={2} />
            </span>
            <div>
              <h3 id="patient-address-heading">Endereço</h3>
              <p>Opcional — ajuda na identificação do prontuário</p>
            </div>
          </header>

          <div className="patient-modal-fields">
            <Input
              label="Rua"
              name="address.street"
              value={form.address.street}
              onChange={handleChange}
              autoComplete="street-address"
              placeholder="Rua, avenida…"
            />

            <div className="patient-modal-grid patient-modal-grid--address-line">
              <Input
                label="Número"
                name="address.number"
                value={form.address.number}
                onChange={handleChange}
                placeholder="123"
              />
              <Input
                label="Complemento"
                name="address.complement"
                value={form.address.complement}
                onChange={handleChange}
                placeholder="Apto, bloco…"
              />
              <Input
                label="Bairro"
                name="address.neighborhood"
                value={form.address.neighborhood}
                onChange={handleChange}
              />
            </div>

            <div className="patient-modal-grid patient-modal-grid--city">
              <Input
                label="Cidade"
                name="address.city"
                value={form.address.city}
                onChange={handleChange}
                autoComplete="address-level2"
              />
              <Input
                label="Estado"
                name="address.state"
                value={form.address.state}
                onChange={handleChange}
                autoComplete="address-level1"
                placeholder="SP"
                maxLength={2}
              />
            </div>
          </div>
        </section>

        <div className="modal-actions patient-modal-actions">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Cadastrando…' : 'Cadastrar paciente'}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
}
