/**
 * StubPage — Reusable placeholder for pages not yet built.
 *
 * COLLABORATOR NOTE:
 * When implementing this page for real, replace StubPage with
 * the actual page component. Keep the page inside src/pages/
 * and use a CSS Module named <PageName>.module.css.
 *
 * Props:
 *   title       {string}   — Page heading
 *   description {string}   — One-line page description
 *   scope       {string[]} — Bullet list of features to implement
 *   icon        {ReactNode} — Icon SVG to show in header
 */
import styles from './StubPage.module.css';

export default function StubPage({ title, description, scope = [], icon }) {
    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.titleGroup}>
                    <span className={styles.badge}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        Coming Soon
                    </span>
                    <h1 className={styles.title}>{title}</h1>
                    <p className={styles.subtitle}>{description}</p>
                </div>
                {icon && (
                    <div style={{ color: 'var(--color-primary-muted)', opacity: 0.4, flexShrink: 0 }}>
                        {icon}
                    </div>
                )}
            </div>

            {/* Shimmer skeleton cards */}
            <div className={styles.grid}>
                {[...Array(6)].map((_, i) => (
                    <div key={i} className={styles.skeletonCard} style={{ opacity: 1 - i * 0.08 }}>
                        <div className={styles.skeletonIcon} />
                        <div className={`${styles.skeletonLine} ${styles['skeletonLine--short']}`} />
                        <div className={`${styles.skeletonLine} ${styles['skeletonLine--full']}`} />
                        <div className={`${styles.skeletonLine} ${styles['skeletonLine--medium']}`} />
                    </div>
                ))}
            </div>

            {/* Scope task card for collaborators */}
            {scope.length > 0 && (
                <div className={styles.scopeCard}>
                    <h2 className={styles.scopeTitle}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 11 12 14 22 4" />
                            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                        </svg>
                        Implementation Scope
                    </h2>
                    <ul className={styles.scopeList}>
                        {scope.map((item, i) => (
                            <li key={i} className={styles.scopeItem}>
                                <span className={styles.scopeBullet}>
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
