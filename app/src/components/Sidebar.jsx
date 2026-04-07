import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/mock-interviews', label: 'Mock Interviews', icon: '🎤' },
  { to: '/hr-interview', label: 'HR Interview', icon: '🧑‍💼' },
  { to: '/performance', label: 'Performance', icon: '📈' },
  { to: '/resumes', label: 'Resume Analyzer', icon: '📄' },
  { to: '/career', label: 'Career Advice', icon: '💡' },
  { to: '/notifications', label: 'Notifications', icon: '🔔' },
];

const FOOTER_LINKS = [
  { to: '/profile', label: 'Profile', icon: '👤' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoArea}>
        <span className={styles.logoMark}>⚡</span>
        <span className={styles.logoText}>Interv<span>AI</span></span>
      </div>

      <nav className={styles.navSection} aria-label="Main navigation">
        <span className={styles.navGroupLabel}>Main Menu</span>
        {NAV_ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
          >
            <span className={styles.navIcon}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className={styles.proBanner}>
        <div className={styles.proLabel}>⭐ Pro Plan</div>
        <p className={styles.proDesc}>Unlimited voice interviews, AI feedback & priority support.</p>
        <button className={styles.upgradeBtn}>Upgrade Now</button>
      </div>

      <div className={styles.sidebarFooter}>
        {FOOTER_LINKS.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} className={styles.footerLink}>
            <span className={styles.navIcon}>{icon}</span>
            {label}
          </NavLink>
        ))}
        <button
          className={`${styles.footerLink} ${styles.footerLinkDanger}`}
          onClick={handleLogout}
          style={{ border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}
        >
          <span className={styles.navIcon}>🚪</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
