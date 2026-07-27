import { User, Palette, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Avatar } from '../../components/common/Avatar';
import { useToast } from '../../contexts/ToastContext';
import './SettingsPage.css';

export function SettingsPage() {
  const { user, isDoctor } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(user);
  const [loadingMe, setLoadingMe] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingMe(true);
      try {
        const me = await authApi.me();
        if (cancelled) return;
        const next = { ...user, ...me };
        setProfile(next);
        localStorage.setItem('medchain_user', JSON.stringify({
          ...JSON.parse(localStorage.getItem('medchain_user') || '{}'),
          ...me,
          access_token: user?.access_token,
          refresh_token: user?.refresh_token,
          type: user?.type,
        }));
        window.dispatchEvent(new CustomEvent('medchain:user-updated', {
          detail: {
            ...user,
            ...me,
            type: user?.type,
            access_token: user?.access_token,
            refresh_token: user?.refresh_token,
          },
        }));
      } catch (err) {
        if (!cancelled) {
          setProfile(user);
          toast.warning(err?.message || 'Não foi possível atualizar o perfil do servidor.');
        }
      } finally {
        if (!cancelled) setLoadingMe(false);
      }
    };
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const display = profile || user;

  return (
    <div className="settings-page">
      <header className="page-header">
        <div>
          <h1>Configurações</h1>
          <p>Dados da conta sincronizados com o servidor{loadingMe ? '…' : ''}</p>
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
              userId={display?.id || display?.patient_public_id}
              isDoctor={isDoctor()}
              size={64}
              editable
              variant="profile"
            />
            <div className="settings-profile-info">
              <strong>{display?.full_name || display?.username || 'Usuário'}</strong>
              <span>{display?.email}</span>
              <span className="settings-profile-role">{isDoctor() ? 'Médico' : 'Paciente'}</span>
              {isDoctor() && display?.CRM && (
                <span className="settings-profile-meta">CRM {display.CRM}</span>
              )}
              {isDoctor() && display?.specialty && (
                <span className="settings-profile-meta">{display.specialty}</span>
              )}
            </div>
          </div>
          <p className="settings-card-desc">
            Foto de perfil fica apenas neste navegador (local). Edição cadastral completa pode ser feita pelo fluxo clínico do médico.
          </p>
        </Card>

        <Card className="settings-card">
          <div className="settings-card-header">
            <Palette size={22} className="settings-card-icon" />
            <h2>Aparência</h2>
          </div>
          <p className="settings-card-desc">
            O tema claro/escuro é alterado no menu lateral (botão Sol/Lua). A preferência é salva neste dispositivo.
          </p>
        </Card>

        <Card className="settings-card">
          <div className="settings-card-header">
            <Shield size={22} className="settings-card-icon" />
            <h2>Segurança</h2>
          </div>
          <p className="settings-card-desc">
            Troca de senha e autenticação em dois fatores ficam fora do escopo atual do TCC.
            Pacientes recebem a senha inicial definida no cadastro pelo médico — recomenda-se alterar em produção.
          </p>
        </Card>
      </div>
    </div>
  );
}
