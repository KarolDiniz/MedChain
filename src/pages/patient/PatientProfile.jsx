import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/common/Card';
import { Avatar } from '../../components/common/Avatar';
import './PatientProfile.css';

const GENDER_LABELS = { FEMALE: 'Feminino', MALE: 'Masculino', OTHER: 'Outro' };

export function PatientProfile() {
  const { user } = useAuth();
  const address = user?.address || {};

  return (
    <div className="patient-profile">
      <header className="page-header">
        <h1>Meu Perfil</h1>
        <p>Informações cadastradas pelo seu médico</p>
      </header>

      <Card>
        <div className="profile-avatar">
          <Avatar
            userId={user?.id}
            isDoctor={false}
            size={96}
            editable
            variant="profile"
          />
        </div>
        <h2 className="profile-name">{user?.full_name}</h2>
        <div className="detail-grid">
          <div className="detail-item">
            <span className="detail-label">E-mail</span>
            <span className="detail-value">{user?.email}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Telefone</span>
            <span className="detail-value">{user?.cellphone || '-'}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Data de nascimento</span>
            <span className="detail-value">
              {user?.birth_date ? new Date(user.birth_date).toLocaleDateString('pt-BR') : '-'}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Gênero</span>
            <span className="detail-value">{GENDER_LABELS[user?.gender] || user?.gender || '-'}</span>
          </div>
        </div>
        {(address.street || address.city) && (
          <>
            <h3>Endereço</h3>
            <p className="detail-address">
              {[address.street, address.number, address.complement].filter(Boolean).join(', ')}
              {address.neighborhood && ` - ${address.neighborhood}`}
              {address.city && ` - ${address.city}`}
              {address.state && `/${address.state}`}
            </p>
          </>
        )}
        <p className="profile-readonly">Apenas visualização. Alterações devem ser solicitadas ao médico.</p>
      </Card>
    </div>
  );
}
