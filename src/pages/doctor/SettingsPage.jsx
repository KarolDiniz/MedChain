import { User, Bell, Shield, Palette } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/common/Card';
import { Avatar } from '../../components/common/Avatar';
import './SettingsPage.css';

export function SettingsPage() {
  const { user, isDoctor } = useAuth();

  return (
    <div className="settings-page">
      <header className="page-header">
        <div>
          <h1>Configurações</h1>
          <p>Gerencie sua conta e preferências</p>
        </div>
      </header>

      <div className="settings-grid">
        <Card className="settings-card">
          <div className="settings-card-header">
            <User size={22} className="settings-card-icon" />
            <h2>Perfil</h2>
          </div>
          <div className="settings-profile">
            <Avatar
              userId={user?.id}
              isDoctor={isDoctor()}
              size={64}
              editable
              variant="profile"
            />
            <div className="settings-profile-info">
              <strong>{user?.full_name || user?.username || 'Usuário'}</strong>
              <span>{user?.email}</span>
              <span className="settings-profile-role">{isDoctor() ? 'Médico' : 'Paciente'}</span>
            </div>
          </div>
        </Card>

        <Card className="settings-card">
          <div className="settings-card-header">
            <Bell size={22} className="settings-card-icon" />
            <h2>Notificações</h2>
          </div>
          <p className="settings-card-desc">Preferências de notificações em breve.</p>
        </Card>

        <Card className="settings-card">
          <div className="settings-card-header">
            <Shield size={22} className="settings-card-icon" />
            <h2>Segurança</h2>
          </div>
          <p className="settings-card-desc">Alteração de senha e autenticação em breve.</p>
        </Card>

        <Card className="settings-card">
          <div className="settings-card-header">
            <Palette size={22} className="settings-card-icon" />
            <h2>Aparência</h2>
          </div>
          <p className="settings-card-desc">O tema claro/escuro pode ser alterado no menu lateral.</p>
        </Card>
      </div>
    </div>
  );
}
