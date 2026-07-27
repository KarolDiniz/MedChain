import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/common/Card';
import { Avatar } from '../../components/common/Avatar';
import './PatientProfile.css';

const GENDER_LABELS = { FEMALE: 'Feminino', MALE: 'Masculino', OTHER: 'Outro' };

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

  return (
    <div className="patient-profile">
      <header className="page-header">
        <h1>Meu Perfil</h1>
        <p>Informações cadastradas pelo seu médico</p>
      </header>

      <div className="patient-profile-layout">
        <Card className="patient-profile-hero">
          <div className="profile-avatar">
            <Avatar
              userId={user?.id || user?.patient_public_id || user?.uid}
              isDoctor={false}
              size={96}
              editable
              variant="profile"
            />
          </div>
          <h2 className="profile-name">{user?.full_name || 'Paciente'}</h2>
          <p className="profile-email">{user?.email}</p>
          <p className="profile-readonly">
            Apenas visualização. Alterações devem ser solicitadas ao médico.
          </p>
        </Card>

        <Card className="patient-profile-details">
          <h3 className="patient-profile-section-title">Dados pessoais</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">E-mail</span>
              <span className="detail-value">{user?.email || '—'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Telefone</span>
              <span className="detail-value">{user?.cellphone || '—'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Data de nascimento</span>
              <span className="detail-value">
                {user?.birth_date ? new Date(user.birth_date).toLocaleDateString('pt-BR') : '—'}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Gênero</span>
              <span className="detail-value">{GENDER_LABELS[user?.gender] || user?.gender || '—'}</span>
            </div>
          </div>

          {addressText && (
            <>
              <h3 className="patient-profile-section-title">Endereço</h3>
              <p className="detail-address">{addressText}</p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
