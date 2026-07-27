import { useEffect, useState, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  User,
  ClipboardList,
  Stethoscope,
  Moon,
  Sun,
  Info,
  Settings,
  Shield,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import './Sidebar.css';

const doctorNavItems = [
  { to: '/doctor', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/doctor/patients', label: 'Pacientes', Icon: Users },
  { to: '/doctor/medical-records', label: 'Prontuários', Icon: FolderOpen },
  { to: '/doctor/auditoria', label: 'Auditoria', Icon: Shield },
  { to: '/doctor/sobre', label: 'Sobre', Icon: Info },
  { to: '/doctor/settings', label: 'Configurações', Icon: Settings },
];

const patientNavItems = [
  { to: '/patient', label: 'Meu Perfil', Icon: User },
  { to: '/patient/medical-records', label: 'Meus Prontuários', Icon: ClipboardList },
  { to: '/patient/auditoria', label: 'Auditoria', Icon: Shield },
];

const PIN_KEY = 'medchain_sidebar_pinned';

export function Sidebar() {
  const { user, logout, isDoctor } = useAuth();

  const items = isDoctor() ? doctorNavItems : patientNavItems;

  const [isDark, setIsDark] = useState(() => {
    try {
      return window.localStorage.getItem('theme') === 'dark';
    } catch {
      return false;
    }
  });
  const [pinned, setPinned] = useState(() => {
    try {
      return window.localStorage.getItem(PIN_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [hovered, setHovered] = useState(false);

  const isExpanded = pinned || hovered;

  const handleMouseEnter = useCallback(() => {
    if (!pinned) setHovered(true);
  }, [pinned]);
  const handleMouseLeave = useCallback(() => {
    if (!pinned) setHovered(false);
  }, [pinned]);

  const togglePinned = () => {
    setPinned((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(PIN_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      if (next) setHovered(false);
      return next;
    });
  };

  useEffect(() => {
    document.body.classList.toggle('theme-dark', isDark);
    try {
      window.localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <aside
      className={`sidebar ${isExpanded ? 'sidebar--expanded' : 'sidebar--collapsed'}${pinned ? ' sidebar--pinned' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="sidebar-header">
        <h1 className="sidebar-logo">
          <span className="sidebar-logo-icon">
            <Stethoscope size={24} strokeWidth={2} />
          </span>
          <span className="sidebar-logo-text">MedChain</span>
        </h1>
        <button
          type="button"
          className="sidebar-pin"
          onClick={togglePinned}
          aria-pressed={pinned}
          aria-label={pinned ? 'Recolher menu' : 'Fixar menu expandido'}
          title={pinned ? 'Recolher menu' : 'Fixar menu expandido'}
        >
          {pinned ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </button>
      </div>
      <nav className="sidebar-nav" aria-label="Navegação principal">
        {items.map((item) => {
          const Icon = item.Icon;
          return (
            <NavLink
              key={`${item.to}-${item.label}`}
              to={item.to}
              end={item.to === '/doctor' || item.to === '/patient'}
              className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}
              title={item.label}
            >
              <span className="sidebar-link-icon">
                <Icon size={20} strokeWidth={2} />
              </span>
              <span className="sidebar-link-text">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <Avatar
            userId={user?.id}
            isDoctor={isDoctor()}
            size={40}
            editable
            variant="sidebar"
          />
          <div className="sidebar-user-info sidebar-user-info--collapsible">
            <span className="sidebar-user-name">{user?.full_name}</span>
            <span className="sidebar-user-role">{isDoctor() ? 'Doutor' : 'Paciente'}</span>
          </div>
        </div>
        <div className="sidebar-footer-actions">
          <button
            type="button"
            className="sidebar-theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
            title={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
          >
            <span className="sidebar-theme-toggle-icon" aria-hidden>
              {isDark ? <Sun size={16} strokeWidth={2.25} /> : <Moon size={16} strokeWidth={2.25} />}
            </span>
            <span className="sidebar-theme-toggle-text">
              {isDark ? 'Modo claro' : 'Modo escuro'}
            </span>
          </button>
          <Button variant="ghost" size="sm" onClick={logout} className="sidebar-logout">
            Sair
          </Button>
        </div>
      </div>
    </aside>
  );
}
