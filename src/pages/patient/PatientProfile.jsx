import { Link } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Info,
  ClipboardList,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/common/Card';
import { Avatar } from '../../components/common/Avatar';
import './PatientProfile.css';

const GENDER_LABELS = {
  FEMALE: 'Feminino',
  MALE: 'Masculino',
  OTHER: 'Outro',
  0: 'Masculino',
  1: 'Feminino',
  2: 'Outro',
};

function formatPhone(phone) {
  if (!phone) return null;
  const d = String(phone).replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
}

export function PatientProfile() {
  const { user } = useAuth();
  const address = user?.address || {};

  const formatAddress = () => {
    const parts = [];
    const line1 = [address.street, address.number, address.complement].filter(Boolean).join(', ');
    if (line1) parts.push(line1);
    if (address.neighborhood) parts.push(address.neighborhood);
    const cityState = [address.city, address.state].filter(Boolean).join(' / ');
    if (cityState) parts.push(cityState);
    return parts.length ? parts.join(' · ') : null;
  };

  const addressText = formatAddress();
  const birthLabel = user?.birth_date
    ? new Date(user.birth_date).toLocaleDateString('pt-BR')
    : null;
  const phoneLabel = formatPhone(user?.cellphone);
  const genderLabel = GENDER_LABELS[user?.gender] || user?.gender || null;

  return (
    <div className="patient-profile">
      <header className="patient-profile-header">
        <div className="patient-profile-header-content">
          <div className="patient-profile-header-icon" aria-hidden>
            <User size={28} strokeWidth={1.8} />
          </div>
          <div className="patient-profile-header-text">
            <h1>Meu perfil</h1>
            <p>Seus dados cadastrais e atalhos para o histórico clínico</p>
          </div>
        </div>
      </header>

      <div className="patient-profile-layout">
        <Card className="patient-profile-hero">
          <div className="patient-profile-hero-accent" aria-hidden />
          <div className="profile-avatar">
            <Avatar
              userId={user?.id || user?.patient_public_id || user?.uid}
              isDoctor={false}
              size={96}
              editable
              variant="profile"
            />
          </div>
          <span className="patient-profile-role">Paciente</span>
          <h2 className="profile-name">{user?.full_name || 'Paciente'}</h2>
          <p className="profile-email">{user?.email || '—'}</p>
          <p className="profile-avatar-hint">Clique na foto para alterar o avatar neste dispositivo</p>

          <div className="patient-profile-note" role="note">
            <Info size={16} aria-hidden />
            <p>
              Este perfil é somente leitura. Para atualizar dados cadastrais,
              solicite ao seu médico responsável.
            </p>
          </div>
        </Card>

        <div className="patient-profile-main">
          <Card className="patient-profile-details">
            <h3 className="patient-profile-section-title">Dados pessoais</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-item-icon" aria-hidden>
                  <Mail size={16} />
                </span>
                <div className="detail-item-body">
                  <span className="detail-label">E-mail</span>
                  <span className="detail-value">{user?.email || '—'}</span>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-item-icon" aria-hidden>
                  <Phone size={16} />
                </span>
                <div className="detail-item-body">
                  <span className="detail-label">Telefone</span>
                  <span className="detail-value">{phoneLabel || '—'}</span>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-item-icon" aria-hidden>
                  <Calendar size={16} />
                </span>
                <div className="detail-item-body">
                  <span className="detail-label">Data de nascimento</span>
                  <span className="detail-value">{birthLabel || '—'}</span>
                </div>
              </div>
              <div className="detail-item">
                <span className="detail-item-icon" aria-hidden>
                  <User size={16} />
                </span>
                <div className="detail-item-body">
                  <span className="detail-label">Gênero</span>
                  <span className="detail-value">{genderLabel || '—'}</span>
                </div>
              </div>
            </div>

            {addressText && (
              <>
                <h3 className="patient-profile-section-title">Endereço</h3>
                <div className="detail-address">
                  <span className="detail-item-icon" aria-hidden>
                    <MapPin size={16} />
                  </span>
                  <p>{addressText}</p>
                </div>
              </>
            )}
          </Card>

          <div className="patient-profile-shortcuts" aria-label="Atalhos">
            <Link to="/patient/medical-records" className="patient-profile-shortcut">
              <span className="patient-profile-shortcut-icon" aria-hidden>
                <ClipboardList size={20} strokeWidth={1.8} />
              </span>
              <span className="patient-profile-shortcut-text">
                <strong>Meus prontuários</strong>
                <span>Ver atendimentos e documentos clínicos</span>
              </span>
              <ChevronRight size={18} className="patient-profile-shortcut-chevron" aria-hidden />
            </Link>
            <Link to="/patient/auditoria" className="patient-profile-shortcut">
              <span className="patient-profile-shortcut-icon" aria-hidden>
                <Shield size={20} strokeWidth={1.8} />
              </span>
              <span className="patient-profile-shortcut-text">
                <strong>Auditoria</strong>
                <span>Confirmar a integridade dos seus registros</span>
              </span>
              <ChevronRight size={18} className="patient-profile-shortcut-chevron" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
