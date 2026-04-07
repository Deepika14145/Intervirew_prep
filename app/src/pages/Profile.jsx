import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchProfile, updateProfile } from '../utils/profileApi';
import styles from './Profile.module.css';

// Remove unused BACKEND constant — now handled by profileApi

export default function Profile() {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (!currentUser) { setIsLoading(false); return; }
    fetchProfile().then(data => {
      if (!data?.user) {
        setFormData({ firstName: '', lastName: '', email: currentUser.email || '', phone: '', role: '', level: 'Entry-Level', skills: '', preferences: { emailNotifications: true, smsNotifications: false, theme: 'System' } });
      } else {
        setFormData({ ...data.user, skills: (data.user.skills || []).join(', ') });
      }
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

  const handleInputChange = (e) => {
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
      const payload = { ...formData };
      if (typeof payload.skills === 'string') payload.skills = payload.skills.split(',').map(s => s.trim()).filter(Boolean);
      const data = await updateProfile(payload);
      setFormData({ ...data.user, skills: (data.user.skills || []).join(', ') });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) { console.error('Failed to save profile', err); }
    setIsSaving(false);
  };

  return (
    <div className={`${styles.profileContainer} u-page-enter`}>
      <div className={styles.header}>
        <h1 className="u-heading-1">My Profile</h1>
        <p className="u-muted">Manage your personal details and professional information.</p>
      </div>

      <div className={styles.layout}>
        <aside className={`u-card ${styles.sidebar}`}>
          <nav className={styles.navMenu}>
            {[['general','👤 General Info'],['professional','💼 Professional']].map(([tab, label]) => (
              <button key={tab} className={`${styles.navItem} ${activeTab === tab ? styles.active : ''}`} onClick={() => setActiveTab(tab)}>{label}</button>
            ))}
          </nav>
        </aside>

        <div className={`u-card ${styles.mainContent}`}>
          <form onSubmit={handleSave} className={styles.formContainer}>
            {activeTab === 'general' && (
              <div className={styles.formSection}>
                <h2 className={styles.sectionTitle}>General Information</h2>
                <div className={styles.grid2Col}>
                  <div className={styles.formGroup}>
                    <label className="u-label">First Name</label>
                    <input type="text" name="firstName" className={styles.input} value={formData.firstName || ''} onChange={handleInputChange} required />
                  </div>
                  <div className={styles.formGroup}>
                    <label className="u-label">Last Name</label>
                    <input type="text" name="lastName" className={styles.input} value={formData.lastName || ''} onChange={handleInputChange} required />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className="u-label">Email Address</label>
                  <input type="email" name="email" className={styles.input} value={formData.email || ''} onChange={handleInputChange} required />
                </div>
                <div className={styles.formGroup}>
                  <label className="u-label">Phone Number</label>
                  <input type="tel" name="phone" className={styles.input} value={formData.phone || ''} onChange={handleInputChange} />
                </div>
              </div>
            )}

            {activeTab === 'professional' && (
              <div className={styles.formSection}>
                <h2 className={styles.sectionTitle}>Professional Profile</h2>
                <div className={styles.grid2Col}>
                  <div className={styles.formGroup}>
                    <label className="u-label">Target Role</label>
                    <input type="text" name="role" className={styles.input} value={formData.role || ''} onChange={handleInputChange} />
                  </div>
                  <div className={styles.formGroup}>
                    <label className="u-label">Experience Level</label>
                    <select name="level" className={styles.select} value={formData.level || 'Entry-Level'} onChange={handleInputChange}>
                      {['Entry-Level','Mid-Level','Senior','Lead/Manager'].map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label className="u-label">Core Skills (Comma separated)</label>
                  <textarea name="skills" className={styles.textarea} rows="3" value={formData.skills || ''} onChange={handleInputChange} placeholder="e.g. React, Node.js, System Design" />
                </div>
              </div>
            )}

            <div className={styles.formActions}>
              {saveSuccess && <span className={styles.successMessage}>✓ Saved successfully</span>}
              <button type="submit" className={styles.primaryBtn} disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
