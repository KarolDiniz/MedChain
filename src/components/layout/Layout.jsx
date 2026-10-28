import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import './Layout.css';

export function Layout() {
  return (
    <div className="layout">
      <div className="layout-bg" aria-hidden>
        <span className="layout-blob layout-blob--a" />
        <span className="layout-blob layout-blob--b" />
      </div>
      <Sidebar />
      <main className="layout-main">
        <div className="layout-main-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
