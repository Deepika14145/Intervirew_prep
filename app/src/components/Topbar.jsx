import styles from './Topbar.module.css';

export default function Topbar({ breadcrumbs = [], user }) {
    const initials = (user?.name || 'Alex Rivera')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

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
                <button className={styles.iconBtn} aria-label="Notifications">
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
                        <span className={styles.userName}>{user?.name || 'Alex Rivera'}</span>
                        <span className={styles.userRole}>{user?.role || 'Frontend Dev'}</span>
                    </div>
                    <div className={styles.avatar} aria-hidden>{initials}</div>
                </div>
            </div>
        </header>
    );
}
