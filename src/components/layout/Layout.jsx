import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import './Layout.css';

export function Layout() {
  return (
    <div className="layout">
      <div className="layout-bg" aria-hidden>
        <div className="layout-bg-base" />
        <div className="layout-bg-orb layout-bg-orb--1" />
        <div className="layout-bg-orb layout-bg-orb--2" />
        <div className="layout-bg-orb layout-bg-orb--3" />
        <div className="layout-bg-orb layout-bg-orb--4" />
        <div className="layout-bg-mesh" />
        <div className="layout-bg-fade" />
        <div className="layout-bg-grid" />
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
