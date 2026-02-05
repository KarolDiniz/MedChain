import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  User,
  ClipboardList,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common/Button';
import { Avatar } from '../common/Avatar';
import './Sidebar.css';

const doctorNavItems = [
  { to: '/doctor', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/doctor/patients', label: 'Pacientes', Icon: Users },
  { to: '/doctor/medical-records', label: 'Prontuários', Icon: FolderOpen },
];

const patientNavItems = [
  { to: '/patient', label: 'Meu Perfil', Icon: User },
  { to: '/patient/medical-records', label: 'Meus Prontuários', Icon: ClipboardList },
];

export function Sidebar() {
  const { user, logout, isDoctor } = useAuth();

  const items = isDoctor() ? doctorNavItems : patientNavItems;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-logo">
          <span className="sidebar-logo-icon">
            <Stethoscope size={24} strokeWidth={2} />
          </span>
          MedChain
        </h1>
      </div>
      <nav className="sidebar-nav">
        {items.map((item) => {
          const Icon = item.Icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/doctor' || item.to === '/patient'}
              className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}
            >
              <span className="sidebar-link-icon">
                <Icon size={20} strokeWidth={2} />
              </span>
              {item.label}
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
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.full_name}</span>
            <span className="sidebar-user-role">{isDoctor() ? 'Doutor' : 'Paciente'}</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={logout} className="sidebar-logout">
          Sair
        </Button>
      </div>
    </aside>
  );
}
