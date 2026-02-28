import React, { useState, useEffect } from 'react';
import styles from './Profile.module.css';

// ─────────────────────────────────────────────────────────
// Mock Initial Data & Endpoints
// ─────────────────────────────────────────────────────────
const MOCK_PROFILE_DATA = {
    id: 'usr_123',
    firstName: 'Alex',
    lastName: 'Rivera',
    email: 'alex.rivera@intervai.com',
    phone: '+1 (555) 123-4567',
    role: 'Frontend Developer',
    level: 'Mid-Level',
    skills: ['React', 'TypeScript', 'CSS Modules', 'System Design'],
    preferences: {
        emailNotifications: true,
        smsNotifications: false,
        theme: 'System',
    }
};

/**
 * Backend Contract Specifications
 * --------------------------------
 * GET /api/users/profile
 * Returns: { user: ProfileObject }
 */
const mockFetchProfile = async () => {
    return new Promise((resolve) => {
        setTimeout(() => resolve({ user: MOCK_PROFILE_DATA }), 1000);
    });
};

/**
 * Backend Contract Specifications
 * --------------------------------
 * PUT /api/users/profile
 * Payload: Partial<ProfileObject>
 * Returns: { success: boolean, user: ProfileObject }
 */
const mockUpdateProfile = async (updates) => {
    console.log("--> PUT /api/users/profile", updates);
    return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, user: { ...MOCK_PROFILE_DATA, ...updates } }), 800);
    });
};

export default function Profile() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [formData, setFormData] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        mockFetchProfile().then(data => {
            setFormData(data.user);
            setIsLoading(false);
        });
    }, []);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name.includes('.')) {
            // Handle nested objects like preferences.emailNotifications
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: type === 'checkbox' ? checked : value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
        setSaveSuccess(false);
    };

    const handleInputArrayChange = (name, valStr) => {
        // Simple comma separated split for tag arrays
        const arr = valStr.split(',').map(s => s.trim()).filter(s => s);
        setFormData(prev => ({ ...prev, [name]: arr }));
        setSaveSuccess(false);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveSuccess(false);

        // Push the full form data to our mock backend endpoint
        const response = await mockUpdateProfile(formData);

        if (response.success) {
            setFormData(response.user);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000); // Hide success message after 3s
        }

        setIsSaving(false);
    };

    if (isLoading || !formData) {
        return (
            <div className={`${styles.profileContainer} u-page-enter`}>
                <div className={styles.header}>
                    <div className="u-skeleton" style={{ height: '36px', width: '250px' }}></div>
                    <div className="u-skeleton" style={{ height: '20px', width: '400px', marginTop: 'var(--sp-2)' }}></div>
                </div>
                <div className={styles.layout}>
                    <div className={`u-card ${styles.sidebar}`}>
                        {[1, 2, 3].map(i => <div key={i} className="u-skeleton" style={{ height: '40px', width: '100%', marginBottom: 'var(--sp-2)' }}></div>)}
                    </div>
                    <div className={`u-card ${styles.mainContent}`}>
                        <div className="u-skeleton" style={{ height: '300px', width: '100%' }}></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`${styles.profileContainer} u-page-enter`}>
            <div className={styles.header}>
                <h1 className="u-heading-1">Profile & Settings</h1>
                <p className="u-muted">Manage your personal details, professional role, and notification preferences.</p>
            </div>

            <div className={styles.layout}>
                {/* Navigation Sidebar */}
                <aside className={`u-card ${styles.sidebar}`}>
                    <nav className={styles.navMenu}>
                        <button
                            className={`${styles.navItem} ${activeTab === 'general' ? styles.active : ''}`}
                            onClick={() => setActiveTab('general')}
                        >
                            <span className={styles.navIcon}>👤</span> General Info
                        </button>
                        <button
                            className={`${styles.navItem} ${activeTab === 'professional' ? styles.active : ''}`}
                            onClick={() => setActiveTab('professional')}
                        >
                            <span className={styles.navIcon}>💼</span> Professional
                        </button>
                        <button
                            className={`${styles.navItem} ${activeTab === 'preferences' ? styles.active : ''}`}
                            onClick={() => setActiveTab('preferences')}
                        >
                            <span className={styles.navIcon}>⚙️</span> Preferences
                        </button>
                    </nav>
                </aside>

                {/* Form Content Area */}
                <div className={`u-card ${styles.mainContent}`}>
                    <form onSubmit={handleSave} className={styles.formContainer}>

                        {/* ─────────────────────────────────────────────────────────
                          * TAB: GENERAL INFO
                          * ───────────────────────────────────────────────────────── */}
                        {activeTab === 'general' && (
                            <div className={styles.formSection}>
                                <h2 className={styles.sectionTitle}>General Information</h2>

                                <div className={styles.avatarSection}>
                                    <div className={styles.avatarCircle}>
                                        {formData.firstName[0]}{formData.lastName[0]}
                                    </div>
                                    <div className={styles.avatarActions}>
                                        <button type="button" className={styles.secondaryBtn}>Upload new picture</button>
                                        <p className="u-muted" style={{ fontSize: 'var(--text-xs)', marginTop: 'var(--sp-2)' }}>JPG, GIF or PNG. Max size of 5MB.</p>
                                    </div>
                                </div>

                                <div className={styles.grid2Col}>
                                    <div className={styles.formGroup}>
                                        <label className="u-label">First Name</label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            className={styles.input}
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className="u-label">Last Name</label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            className={styles.input}
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className="u-label">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        className={styles.input}
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className="u-label">Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        className={styles.input}
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        )}

                        {/* ─────────────────────────────────────────────────────────
                          * TAB: PROFESSIONAL
                          * ───────────────────────────────────────────────────────── */}
                        {activeTab === 'professional' && (
                            <div className={styles.formSection}>
                                <h2 className={styles.sectionTitle}>Professional Profile</h2>
                                <p className="u-muted" style={{ marginBottom: 'var(--sp-6)' }}>
                                    This information helps IntervAI tailor your mock interviews and provide more accurate feedback.
                                </p>

                                <div className={styles.grid2Col}>
                                    <div className={styles.formGroup}>
                                        <label className="u-label">Target Role</label>
                                        <input
                                            type="text"
                                            name="role"
                                            className={styles.input}
                                            value={formData.role}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className="u-label">Experience Level</label>
                                        <select
                                            name="level"
                                            className={styles.select}
                                            value={formData.level}
                                            onChange={handleInputChange}
                                        >
                                            <option value="Entry-Level">Entry-Level</option>
                                            <option value="Mid-Level">Mid-Level</option>
                                            <option value="Senior">Senior</option>
                                            <option value="Lead/Manager">Lead/Manager</option>
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className="u-label">Core Skills (Comma separated)</label>
                                    <textarea
                                        name="skills"
                                        className={styles.textarea}
                                        rows="3"
                                        value={formData.skills.join(', ')}
                                        onChange={(e) => handleInputArrayChange('skills', e.target.value)}
                                        placeholder="e.g. React, Node.js, System Design"
                                    ></textarea>
                                </div>
                            </div>
                        )}

                        {/* ─────────────────────────────────────────────────────────
                          * TAB: PREFERENCES
                          * ───────────────────────────────────────────────────────── */}
                        {activeTab === 'preferences' && (
                            <div className={styles.formSection}>
                                <h2 className={styles.sectionTitle}>App Preferences</h2>

                                <div className={styles.formGroup}>
                                    <label className="u-label">Theme</label>
                                    <select
                                        name="preferences.theme"
                                        className={styles.select}
                                        value={formData.preferences.theme}
                                        onChange={handleInputChange}
                                    >
                                        <option value="System">System Default</option>
                                        <option value="Light">Light Mode</option>
                                        <option value="Dark">Dark Mode</option>
                                    </select>
                                </div>

                                <h3 className={styles.subsectionTitle}>Notifications</h3>

                                <label className={styles.toggleRow}>
                                    <div className={styles.toggleInfo}>
                                        <span className={styles.toggleLabel}>Email Notifications</span>
                                        <span className={styles.toggleSubtext}>Receive weekly performance digests and interview reminders.</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        name="preferences.emailNotifications"
                                        className={styles.checkbox}
                                        checked={formData.preferences.emailNotifications}
                                        onChange={handleInputChange}
                                    />
                                </label>

                                <label className={styles.toggleRow}>
                                    <div className={styles.toggleInfo}>
                                        <span className={styles.toggleLabel}>SMS Notifications</span>
                                        <span className={styles.toggleSubtext}>Get essential alerts regarding imminent booked sessions.</span>
                                    </div>
                                    <input
                                        type="checkbox"
                                        name="preferences.smsNotifications"
                                        className={styles.checkbox}
                                        checked={formData.preferences.smsNotifications}
                                        onChange={handleInputChange}
                                    />
                                </label>
                            </div>
                        )}

                        {/* Form Footer Actions */}
                        <div className={styles.formActions}>
                            {saveSuccess && <span className={styles.successMessage}>✓ Saved successfully</span>}
                            <button
                                type="submit"
                                className={styles.primaryBtn}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}
