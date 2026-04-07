import { useState } from 'react';
import styles from './Notifications.module.css';

// Notifications are generated from real interview activity.
// These defaults show until a /api/notifications backend endpoint is implemented.
const buildDefaultNotifications = () => [
  {
    id: 'n_welcome',
    type: 'system',
    title: 'Welcome to IntervAI!',
    message: 'Complete your first mock interview to start receiving personalized feedback and performance notifications.',
    timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    isRead: false,
  },
];

const TYPE_ICON = { interview: '📅', success: '✅', system: '⚠️' };

export default function Notifications() {
  const [notifications, setNotifications] = useState(buildDefaultNotifications);
  const [activeFilter, setActiveFilter] = useState('all');

  const markAsRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

  const filtered = notifications.filter(n => {
    if (activeFilter === 'unread') return !n.isRead;
    if (activeFilter === 'system') return n.type === 'system';
    if (activeFilter === 'interview') return n.type === 'interview';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className={`${styles.notificationsContainer} u-page-enter`}>
      <div className={styles.header}>
        <div className={styles.headerTitles}>
          <h1 className="u-heading-1">Notifications</h1>
          {unreadCount > 0 && <span className={styles.badge}>{unreadCount} unread</span>}
        </div>
        {unreadCount > 0 && <button className={styles.textBtn} onClick={markAllRead}>Mark all as read</button>}
      </div>

      <div className={styles.layout}>
        <aside className={styles.filterSidebar}>
          <nav className={styles.navMenu}>
            {[['all','📥 All'],['unread','🔵 Unread'],['interview','📅 Interviews'],['system','⚙️ System']].map(([f, label]) => (
              <button key={f} className={`${styles.navItem} ${activeFilter === f ? styles.active : ''}`} onClick={() => setActiveFilter(f)}>{label}</button>
            ))}
          </nav>
        </aside>

        <div className={`u-card ${styles.listArea}`}>
          {filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📭</div>
              <h3>No notifications found</h3>
              <p className="u-muted">You're all caught up!</p>
            </div>
          ) : (
            <div className={styles.notificationList}>
              {filtered.map(n => (
                <div key={n.id} className={`${styles.notificationItem} ${!n.isRead ? styles.itemUnread : ''}`} onClick={() => markAsRead(n.id)}>
                  <div className={styles.itemIcon}>{TYPE_ICON[n.type] || '🔔'}</div>
                  <div className={styles.itemContent}>
                    <div className={styles.itemHeader}>
                      <h3 className={styles.itemTitle}>{n.title}</h3>
                      <span className={styles.itemTime}>{n.timestamp}</span>
                    </div>
                    <p className={styles.itemMessage}>{n.message}</p>
                  </div>
                  {!n.isRead && <div className={styles.unreadIndicator} />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
