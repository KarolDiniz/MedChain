import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import './Layout.css';

export function Layout() {
  return (
    <div className="layout">
      <div className="layout-bg" aria-hidden>
        <div className="layout-bg-gradient" />
        <div className="layout-bg-grid" />
        <div className="layout-bg-particles" />
      </div>
      <Sidebar />
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  );
}
