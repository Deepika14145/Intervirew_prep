import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function MainLayout({ breadcrumbs, user }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 99, display: 'none'
          }}
          className="mobile-overlay"
        />
      )}

      <div className="main-content">
        <Topbar breadcrumbs={breadcrumbs} user={user} onMenuClick={() => setSidebarOpen(o => !o)} />
        <main className="main-body">
          <Outlet />
        </main>
      </div>

      <style>{`
        .main-content {
          margin-left: var(--sidebar-width);
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .main-body {
          margin-top: var(--topbar-height);
          padding: var(--sp-8);
          flex: 1;
        }
        @media (max-width: 768px) {
          .main-content { margin-left: 0; }
          .main-body { padding: var(--sp-4); }
          .mobile-overlay { display: block !important; }
        }
      `}</style>
    </div>
  );
}
