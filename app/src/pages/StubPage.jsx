import styles from './StubPage.module.css';

export default function StubPage({ title, description, icon, scope = [] }) {
  return (
    <div className={styles.page}>
      <div className={styles.icon}>{icon}</div>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>{description}</p>
      {scope.length > 0 && (
        <div className={styles.scope}>
          <h3>Implementation Scope</h3>
          <ul>{scope.map((item, i) => <li key={i}>{item}</li>)}</ul>
        </div>
      )}
      <div className={styles.badge}>🚧 Coming Soon</div>
    </div>
  );
}
