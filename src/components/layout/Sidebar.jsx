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
  Link2,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import './Sidebar.css';

const doctorNavItems = [
  { to: '/doctor', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/doctor/patients', label: 'Pacientes', Icon: Users },
  { to: '/doctor/medical-records', label: 'Prontuários', Icon: FolderOpen },
  { to: '/doctor/consultations', label: 'Consultas', Icon: Stethoscope },
  { to: '/doctor/blockchain', label: 'Blockchain', Icon: Link2 },
  { to: '/doctor/settings', label: 'Configurações', Icon: Settings },
];

const patientNavItems = [
  { to: '/patient', label: 'Meu Perfil', Icon: User },
  { to: '/patient/medical-records', label: 'Meus Prontuários', Icon: ClipboardList },
];

export function Sidebar() {
  const { user, logout, isDoctor } = useAuth();

  const items = isDoctor() ? doctorNavItems : patientNavItems;

  const [isDark, setIsDark] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleMouseEnter = useCallback(() => setIsExpanded(true), []);
  const handleMouseLeave = useCallback(() => setIsExpanded(false), []);

  useEffect(() => {
    const stored = window.localStorage.getItem('theme');
    if (stored === 'dark') {
      setIsDark(true);
      document.body.classList.add('theme-dark');
    }
  }, []);

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('theme-dark');
      window.localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('theme-dark');
      window.localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <aside
      className={`sidebar ${isExpanded ? 'sidebar--expanded' : 'sidebar--collapsed'}`}
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
      </div>
      <nav className="sidebar-nav">
        {items.map((item) => {
          const Icon = item.Icon;
          return (
            <NavLink
              key={`${item.to}-${item.label}`}
              to={item.to}
              end={item.to === '/doctor' || item.to === '/patient'}
              className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}
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
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            <span className="sidebar-theme-toggle-text">{isDark ? 'Modo claro' : 'Modo escuro'}</span>
          </button>
          <Button variant="ghost" size="sm" onClick={logout} className="sidebar-logout">
            Sair
          </Button>
        </div>
      </div>
    </aside>
  );
}
