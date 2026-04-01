import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Topbar.module.css';

export default function Topbar({ breadcrumbs = [], user }) {
    const initials = (user?.name || 'Alex Rivera')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const navigate = useNavigate();
    const { logout } = useAuth();

    async function handleLogout() {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to log out', error);
        }
    }

    return (
        <header className={styles.topbar}>
            {/* Breadcrumb */}
            <nav className={styles.breadcrumb} aria-label="Breadcrumb">
                {breadcrumbs.map((crumb, i) => (
                    <span key={i} className={styles.breadcrumbItem}>
                        {i > 0 && <span className={styles.chevron} aria-hidden>›</span>}
                        <span className={i === breadcrumbs.length - 1 ? styles.crumbActive : styles.crumb}>
                            {crumb}
                        </span>
                    </span>
                ))}
            </nav>

            {/* Right side */}
            <div className={styles.right}>
                {/* Notifications */}
                <button
                    className={styles.iconBtn}
                    aria-label="Notifications"
                    onClick={() => navigate('/notifications')}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    <span className={styles.notifDot} />
                </button>

                <span className={styles.divider} aria-hidden />

                {/* User */}
                <div className={styles.user} role="button" aria-label="User menu" tabIndex={0}>
                    <div className={styles.userInfo}>
                        <span className={styles.userName}>{user?.name}</span>
                        <span className={styles.userRole}>{user?.role}</span>
                    </div>
                    <div className={styles.avatar} aria-hidden>{initials}</div>
                </div>

                <span className={styles.divider} style={{ margin: '0 var(--sp-2)' }} aria-hidden />

                <button
                    className={styles.iconBtn}
                    aria-label="Logout"
                    onClick={handleLogout}
                    title="Log Out"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                </button>
            </div>
        </header>
    );
}
