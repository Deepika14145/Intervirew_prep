import React, { useState, useEffect } from 'react';
import styles from './Notifications.module.css';

// ─────────────────────────────────────────────────────────
// Mock Initial Data & Endpoints
// ─────────────────────────────────────────────────────────
const MOCK_NOTIFICATIONS = [
    {
        id: 'n_1',
        type: 'interview',  // 'interview', 'system', 'success'
        title: 'Interview Reminder: React Developer',
        message: 'Your mock interview for the Mid-Level React Developer role starts in 2 hours. Click here to review your preparation materials.',
        timestamp: '2 hours ago',
        isRead: false
    },
    {
        id: 'n_2',
        type: 'success',
        title: 'Feedback Analysis Complete',
        message: 'The AI feedback for your recent System Design mock interview is now available. You scored an 82%!',
        timestamp: '1 day ago',
        isRead: false
    },
    {
        id: 'n_3',
        type: 'system',
        title: 'Platform Maintenance',
        message: 'IntervAI will undergo scheduled maintenance on Sunday from 2 AM to 4 AM UTC. Mock interview sessions will be unavailable.',
        timestamp: '3 days ago',
        isRead: true
    },
    {
        id: 'n_4',
        type: 'interview',
        title: 'New Role Roadmap Available',
        message: 'Based on your recent performance, a new personalized roadmap for Senior Frontend Engineer has been generated.',
        timestamp: '1 week ago',
        isRead: true
    }
];

/**
 * Backend Contract Specifications
 * --------------------------------
 * GET /api/notifications
 * Returns: { notifications: Array<NotificationObject> }
 */
const mockFetchNotifications = async () => {
    return new Promise((resolve) => {
        setTimeout(() => resolve({ notifications: MOCK_NOTIFICATIONS }), 1000);
    });
};

/**
 * Backend Contract Specifications
 * --------------------------------
 * PUT /api/notifications/:id/read
 * Returns: { success: true }
 */
const mockMarkAsRead = async (id) => {
    console.log(`--> PUT /api/notifications/${id}/read`);
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 300));
};

/**
 * Backend Contract Specifications
 * --------------------------------
 * PUT /api/notifications/read-all
 * Returns: { success: true }
 */
const mockMarkAllAsRead = async () => {
    console.log("--> PUT /api/notifications/read-all");
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 500));
};

// Helper to determine Icons
const getIconForType = (type) => {
    switch (type) {
        case 'interview': return <span className={`${styles.iconBase} ${styles.iconInfo}`}>📅</span>;
        case 'success': return <span className={`${styles.iconBase} ${styles.iconSuccess}`}>✅</span>;
        case 'system': return <span className={`${styles.iconBase} ${styles.iconWarning}`}>⚠️</span>;
        default: return <span className={`${styles.iconBase} ${styles.iconInfo}`}>🔔</span>;
    }
}

export default function Notifications() {
    const [isLoading, setIsLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'unread', 'system', 'interview'

    useEffect(() => {
        mockFetchNotifications().then(data => {
            setNotifications(data.notifications);
            setIsLoading(false);
        });
    }, []);

    const handleMarkAsRead = async (id) => {
        const notif = notifications.find(n => n.id === id);
        if (notif && !notif.isRead) {
            // Optimistic update
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            await mockMarkAsRead(id);
        }
    };

    const handleMarkAllAsRead = async () => {
        const hasUnread = notifications.some(n => !n.isRead);
        if (!hasUnread) return;

        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        await mockMarkAllAsRead();
    };

    const getFilteredNotifications = () => {
        switch (activeFilter) {
            case 'unread': return notifications.filter(n => !n.isRead);
            case 'system': return notifications.filter(n => n.type === 'system');
            case 'interview': return notifications.filter(n => n.type === 'interview');
            default: return notifications;
        }
    };

    const displayedNotifications = getFilteredNotifications();
    const unreadCount = notifications.filter(n => !n.isRead).length;

    if (isLoading) {
        return (
            <div className={`${styles.notificationsContainer} u-page-enter`}>
                <div className={styles.header}>
                    <div className="u-skeleton" style={{ height: '36px', width: '200px' }}></div>
                    <div className="u-skeleton" style={{ height: '36px', width: '150px' }}></div>
                </div>
                <div className={`u-card ${styles.listContainer}`}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className={styles.notificationItem} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <div className="u-skeleton" style={{ height: '48px', width: '48px', borderRadius: 'var(--radius-md)' }}></div>
                            <div style={{ flex: 1 }}>
                                <div className="u-skeleton" style={{ height: '20px', width: '40%', marginBottom: '8px' }}></div>
                                <div className="u-skeleton" style={{ height: '16px', width: '80%', marginBottom: '4px' }}></div>
                                <div className="u-skeleton" style={{ height: '16px', width: '60%' }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={`${styles.notificationsContainer} u-page-enter`}>
            {/* Header Area */}
            <div className={styles.header}>
                <div className={styles.headerTitles}>
                    <h1 className="u-heading-1">Notifications</h1>
                    {unreadCount > 0 && (
                        <span className={styles.badge}>{unreadCount} unread</span>
                    )}
                </div>
                {unreadCount > 0 && (
                    <button className={styles.textBtn} onClick={handleMarkAllAsRead}>
                        Mark all as read
                    </button>
                )}
            </div>

            <div className={styles.layout}>
                {/* Filter Sidebar */}
                <aside className={styles.filterSidebar}>
                    <nav className={styles.navMenu}>
                        <button
                            className={`${styles.navItem} ${activeFilter === 'all' ? styles.active : ''}`}
                            onClick={() => setActiveFilter('all')}
                        >
                            <span className={styles.navIcon}>📥</span> All
                        </button>
                        <button
                            className={`${styles.navItem} ${activeFilter === 'unread' ? styles.active : ''}`}
                            onClick={() => setActiveFilter('unread')}
                        >
                            <span className={styles.navIcon}>🔵</span> Unread
                        </button>
                        <button
                            className={`${styles.navItem} ${activeFilter === 'interview' ? styles.active : ''}`}
                            onClick={() => setActiveFilter('interview')}
                        >
                            <span className={styles.navIcon}>📅</span> Interviews
                        </button>
                        <button
                            className={`${styles.navItem} ${activeFilter === 'system' ? styles.active : ''}`}
                            onClick={() => setActiveFilter('system')}
                        >
                            <span className={styles.navIcon}>⚙️</span> System Alerts
                        </button>
                    </nav>
                </aside>

                {/* Main List Area */}
                <div className={`u-card ${styles.listArea}`}>
                    {displayedNotifications.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>📭</div>
                            <h3>No notifications found</h3>
                            <p className="u-muted">You're all caught up with your alerts!</p>
                        </div>
                    ) : (
                        <div className={styles.notificationList}>
                            {displayedNotifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`${styles.notificationItem} ${!notification.isRead ? styles.itemUnread : ''}`}
                                    onClick={() => handleMarkAsRead(notification.id)}
                                >
                                    <div className={styles.itemIcon}>
                                        {getIconForType(notification.type)}
                                    </div>
                                    <div className={styles.itemContent}>
                                        <div className={styles.itemHeader}>
                                            <h3 className={styles.itemTitle}>{notification.title}</h3>
                                            <span className={styles.itemTime}>{notification.timestamp}</span>
                                        </div>
                                        <p className={styles.itemMessage}>{notification.message}</p>
                                    </div>
                                    {!notification.isRead && (
                                        <div className={styles.unreadIndicator}></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
