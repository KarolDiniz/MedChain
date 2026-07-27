import { User, Palette, Shield, Mail, BadgeCheck, Stethoscope, AtSign, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../services/api';
import { Card } from '../../components/common/Card';
import { Avatar } from '../../components/common/Avatar';
import { useToast } from '../../contexts/ToastContext';
import './SettingsPage.css';

const SPECIALTY_LABELS = {
  GENERAL: 'Clínica Geral',
  CARDIOLOGY: 'Cardiologia',
  DERMATOLOGY: 'Dermatologia',
  PEDIATRICS: 'Pediatria',
  ORTHOPEDICS: 'Ortopedia',
  NEUROLOGY: 'Neurologia',
  PSYCHIATRY: 'Psiquiatria',
  GYNECOLOGY: 'Ginecologia',
  OTHER: 'Outra',
};

function formatSpecialty(value) {
  if (!value) return '—';
  const key = String(value).toUpperCase();
  return SPECIALTY_LABELS[key] || String(value);
}

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
  const doctor = isDoctor();

  return (
    <div className="settings-page">
      <header className="page-header">
        <div>
          <h1>Configurações</h1>
          <p>
            Gerencie sua conta e preferências
            {loadingMe ? ' · sincronizando…' : ''}
          </p>
        </div>
      </header>

      <div className="settings-grid">
        <Card className="settings-card settings-card--profile">
          <div className="settings-profile-top">
            <div className="settings-profile-identity">
              <Avatar
                userId={display?.id || display?.patient_public_id}
                isDoctor={doctor}
                size={88}
                editable
                variant="profile"
              />
              <div className="settings-profile-identity-text">
                <div className="settings-profile-title-row">
                  <h2 className="settings-profile-name">
                    {display?.full_name || display?.username || 'Usuário'}
                  </h2>
                  <span className="settings-role-badge">
                    {doctor ? 'Médico' : 'Paciente'}
                  </span>
                </div>
                <p className="settings-profile-subtitle">
                  Clique na foto para alterar o avatar neste dispositivo
                </p>
              </div>
            </div>
            <div className="settings-profile-section-label" aria-hidden>
              <User size={16} />
              <span>Perfil</span>
            </div>
          </div>

          <div className={`settings-fields ${doctor ? 'settings-fields--doctor' : 'settings-fields--patient'}`}>
            <div className="settings-field">
              <span className="settings-field-icon" aria-hidden>
                <Mail size={16} />
              </span>
              <div className="settings-field-body">
                <span className="settings-field-label">E-mail</span>
                <span className="settings-field-value">{display?.email || '—'}</span>
              </div>
            </div>

            <div className="settings-field">
              <span className="settings-field-icon" aria-hidden>
                <AtSign size={16} />
              </span>
              <div className="settings-field-body">
                <span className="settings-field-label">Usuário</span>
                <span className="settings-field-value">{display?.username || '—'}</span>
              </div>
            </div>

            {doctor && (
              <div className="settings-field">
                <span className="settings-field-icon" aria-hidden>
                  <BadgeCheck size={16} />
                </span>
                <div className="settings-field-body">
                  <span className="settings-field-label">CRM</span>
                  <span className="settings-field-value">{display?.CRM || '—'}</span>
                </div>
              </div>
            )}

            {doctor && (
              <div className="settings-field">
                <span className="settings-field-icon" aria-hidden>
                  <Stethoscope size={16} />
                </span>
                <div className="settings-field-body">
                  <span className="settings-field-label">Especialidade</span>
                  <span className="settings-field-value">{formatSpecialty(display?.specialty)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="settings-profile-note" role="note">
            <Info size={16} className="settings-profile-note-icon" />
            <p>
              A foto de perfil fica salva apenas neste dispositivo. Os dados cadastrais
              oficiais são mantidos pelo sistema e podem ser consultados nesta página.
            </p>
          </div>
        </Card>

        <Card className="settings-card settings-card--half">
          <div className="settings-card-header">
            <span className="settings-card-icon-wrap">
              <Palette size={20} />
            </span>
            <div>
              <h2>Aparência</h2>
              <p className="settings-card-lede">Tema do aplicativo</p>
            </div>
          </div>
          <p className="settings-card-desc">
            Alterne entre o tema claro e o escuro pelo botão Sol/Lua no menu lateral.
            A preferência é lembrada automaticamente neste dispositivo.
          </p>
        </Card>

        <Card className="settings-card settings-card--half">
          <div className="settings-card-header">
            <span className="settings-card-icon-wrap">
              <Shield size={20} />
            </span>
            <div>
              <h2>Segurança</h2>
              <p className="settings-card-lede">Acesso à conta</p>
            </div>
          </div>
          <p className="settings-card-desc">
            Proteja o acesso à sua conta mantendo a senha em sigilo e evitando
            compartilhar credenciais. Não solicite dados sensíveis por canais externos
            à plataforma.
          </p>
        </Card>
      </div>
    </div>
  );
}
