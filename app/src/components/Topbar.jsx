import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Topbar.module.css';

export default function Topbar({ breadcrumbs = [], user }) {
  const initials = (user?.name || 'U')
    .split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const navigate = useNavigate();

  return (
    <header className={styles.topbar}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className={styles.breadcrumbItem}>
            {i > 0 && <span className={styles.chevron}>›</span>}
            <span className={i === breadcrumbs.length - 1 ? styles.crumbActive : styles.crumb}>{crumb}</span>
          </span>
        ))}
      </nav>

      <div className={styles.right}>
        <button className={styles.iconBtn} aria-label="Notifications" onClick={() => navigate('/notifications')}>
          🔔
        </button>
        <span className={styles.divider} />
        {/* Avatar navigates to profile */}
        <div className={styles.user} onClick={() => navigate('/profile')} title="View Profile">
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.name}</span>
            <span className={styles.userRole}>{user?.role}</span>
          </div>
          <div className={styles.avatar}>{initials}</div>
        </div>
      </div>
    </header>
  );
}
