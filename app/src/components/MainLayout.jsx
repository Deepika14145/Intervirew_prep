import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

/**
 * MainLayout — wraps Sidebar + Topbar around all paged routes.
 * Layout uses inline CSS variables so no separate .module.css is needed.
 */
export default function MainLayout({ breadcrumbs, user }) {
    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <div style={{ marginLeft: 'var(--sidebar-width)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Topbar breadcrumbs={breadcrumbs} user={user} />
                <main style={{
                    marginTop: 'var(--topbar-height)',
                    padding: 'var(--sp-8)',
                    flex: 1,
                }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
