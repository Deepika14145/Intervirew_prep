import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchProfile, updateProfile } from '../utils/profileApi';
import styles from './Profile.module.css'; // reuse same form styles

export default function Settings() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('appearance');
  const [formData, setFormData] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (!currentUser) { setIsLoading(false); return; }
    fetchProfile().then(data => {
      const defaults = {
        preferences: { emailNotifications: true, smsNotifications: false, theme: 'System' },
        security: { twoFactorEnabled: false },
      };
      setFormData(data?.user ? { ...defaults, ...data.user } : defaults);
      setIsLoading(false);
    }).catch(err => { setErrorMsg(err.message); setIsLoading(false); });
  }, [currentUser]);

  if (errorMsg) return (
    <div className={styles.profileContainer} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: 'var(--sp-4)' }}>
      <h2 style={{ color: 'var(--color-danger)' }}>Backend Connection Failed</h2>
      <p className="u-muted">{errorMsg}</p>
    </div>
  );

  if (isLoading || !formData) return (
    <div className={styles.profileContainer}>
      <div className="u-skeleton" style={{ height: '36px', width: '250px', marginBottom: 'var(--sp-4)' }} />
      <div className="u-skeleton" style={{ height: '300px', width: '100%' }} />
    </div>
  );

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: type === 'checkbox' ? checked : value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }
    setSaveSuccess(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) { console.error('Failed to save settings', err); }
    setIsSaving(false);
  };

  const handleLogout = async () => {
    try { await logout(); navigate('/login'); } catch (err) { console.error('Logout failed', err); }
  };

  const TABS = [
    ['appearance', '🎨 Appearance'],
    ['notifications', '🔔 Notifications'],
    ['account', '🔐 Account'],
  ];

  return (
    <div className={`${styles.profileContainer} u-page-enter`}>
      <div className={styles.header}>
        <h1 className="u-heading-1">Settings</h1>
        <p className="u-muted">Manage your app preferences, notifications, and account security.</p>
      </div>

      <div className={styles.layout}>
        <aside className={`u-card ${styles.sidebar}`}>
          <nav className={styles.navMenu}>
            {TABS.map(([tab, label]) => (
              <button
                key={tab}
                className={`${styles.navItem} ${activeTab === tab ? styles.active : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <div className={`u-card ${styles.mainContent}`}>
          <form onSubmit={handleSave} className={styles.formContainer}>

            {activeTab === 'appearance' && (
              <div className={styles.formSection}>
                <h2 className={styles.sectionTitle}>Appearance</h2>
                <div className={styles.formGroup}>
                  <label className="u-label">Theme</label>
                  <select
                    name="preferences.theme"
                    className={styles.select}
                    value={formData.preferences?.theme || 'System'}
                    onChange={handleChange}
                  >
                    <option value="System">System Default</option>
                    <option value="Light">Light Mode</option>
                    <option value="Dark">Dark Mode</option>
                  </select>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    Controls the color scheme across the entire app.
                  </span>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className={styles.formSection}>
                <h2 className={styles.sectionTitle}>Notification Preferences</h2>
                {[
                  ['emailNotifications', 'Email Notifications', 'Receive weekly performance digests and interview reminders.'],
                  ['smsNotifications', 'SMS Notifications', 'Get text alerts for upcoming sessions and score updates.'],
                ].map(([key, label, sub]) => (
                  <label key={key} className={styles.toggleRow}>
                    <div className={styles.toggleInfo}>
                      <span className={styles.toggleLabel}>{label}</span>
                      <span className={styles.toggleSubtext}>{sub}</span>
                    </div>
                    <input
                      type="checkbox"
                      name={`preferences.${key}`}
                      className={styles.checkbox}
                      checked={formData.preferences?.[key] ?? false}
                      onChange={handleChange}
                    />
                  </label>
                ))}
              </div>
            )}

            {activeTab === 'account' && (
              <div className={styles.formSection}>
                <h2 className={styles.sectionTitle}>Account</h2>

                <div className={styles.formGroup}>
                  <label className="u-label">Email Address</label>
                  <input
                    type="email"
                    className={styles.input}
                    value={currentUser?.email || ''}
                    disabled
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  />
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    Email is managed by Firebase and cannot be changed here.
                  </span>
                </div>

                <div style={{ marginTop: 'var(--sp-4)', padding: 'var(--sp-4)', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                  <h3 className={styles.subsectionTitle} style={{ marginTop: 0 }}>Danger Zone</h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--sp-3)' }}>
                    Sign out of your account on this device.
                  </p>
                  <button
                    type="button"
                    onClick={handleLogout}
                    style={{ padding: 'var(--sp-2) var(--sp-4)', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-sm)' }}
                  >
                    🚪 Sign Out
                  </button>
                </div>
              </div>
            )}

            {/* No save button needed on account tab */}
            {activeTab !== 'account' && (
              <div className={styles.formActions}>
                {saveSuccess && <span className={styles.successMessage}>✓ Saved successfully</span>}
                <button type="submit" className={styles.primaryBtn} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
