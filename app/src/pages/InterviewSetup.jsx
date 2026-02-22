import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './InterviewSetup.module.css';

const JOB_ROLES = [
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'DevOps Engineer',
    'Data Scientist',
    'Product Manager',
    'System Design Architect',
    'iOS / Android Developer',
];

const EXPERIENCE_LEVELS = ['Junior', 'Mid', 'Senior', 'Lead'];

const TRUST_BADGES = [
    {
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
        ),
        label: 'Secure Connection',
    },
    {
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
            </svg>
        ),
        label: 'Results Auto-saved',
    },
    {
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
        ),
        label: 'AI Insights Included',
    },
];

export default function InterviewSetup() {
    const navigate = useNavigate();
    const [role, setRole] = useState('Frontend Developer');
    const [level, setLevel] = useState('Mid');
    const [format, setFormat] = useState('text');
    const [timeLimit, setTimeLimit] = useState(3);

    const handleStart = () => {
        navigate('/interview/session', {
            state: { role, level, format, timeLimit },
        });
    };

    return (
        <div className={styles.page}>
            {/* Page heading */}
            <div className={styles.heading}>
                <h1 className={styles.title}>Set Up Your Mock Interview</h1>
                <p className={styles.subtitle}>
                    Configure your session and our AI will tailor a realistic interview
                    experience based on your preferences.
                </p>
            </div>

            {/* Setup Card */}
            <div className={styles.card}>
                {/* Job Role */}
                <section className={styles.section}>
                    <label className={styles.fieldLabel}>
                        <span className={styles.fieldIcon}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                            </svg>
                        </span>
                        JOB ROLE
                    </label>
                    <div className={styles.selectWrapper}>
                        <select
                            className={styles.select}
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            {JOB_ROLES.map((r) => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                        <span className={styles.selectArrow}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </span>
                    </div>
                </section>

                {/* Experience Level */}
                <section className={styles.section}>
                    <label className={styles.fieldLabel}>
                        <span className={styles.fieldIcon}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </span>
                        EXPERIENCE LEVEL
                    </label>
                    <div className={styles.toggleGroup}>
                        {EXPERIENCE_LEVELS.map((l) => (
                            <button
                                key={l}
                                className={`${styles.toggleBtn} ${level === l ? styles.toggleBtnActive : ''}`}
                                onClick={() => setLevel(l)}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Format & Time Row */}
                <div className={styles.row}>
                    {/* Interview Format */}
                    <section className={`${styles.section} ${styles.flex1}`}>
                        <label className={styles.fieldLabel}>
                            <span className={styles.fieldIcon}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                </svg>
                            </span>
                            INTERVIEW FORMAT
                        </label>
                        <div className={styles.formatGroup}>
                            <button
                                className={`${styles.formatBtn} ${format === 'text' ? styles.formatBtnActive : ''}`}
                                onClick={() => setFormat('text')}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                                Text
                            </button>
                            <button
                                className={`${styles.formatBtn} ${format === 'voice' ? styles.formatBtnActive : ''}`}
                                onClick={() => setFormat('voice')}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" />
                                    <line x1="8" y1="23" x2="16" y2="23" />
                                </svg>
                                Voice
                            </button>
                        </div>
                    </section>

                    {/* Time Limit */}
                    <section className={`${styles.section} ${styles.flex1}`}>
                        <label className={styles.fieldLabel}>
                            <span className={styles.fieldIcon}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                                </svg>
                            </span>
                            TIME LIMIT
                            <span className={styles.timeBadge}>{timeLimit} mins / Q</span>
                        </label>
                        <div className={styles.sliderWrapper}>
                            <span className={styles.sliderMin}>1M</span>
                            <input
                                type="range"
                                min={1}
                                max={5}
                                step={1}
                                value={timeLimit}
                                onChange={(e) => setTimeLimit(Number(e.target.value))}
                                className={styles.slider}
                            />
                            <span className={styles.sliderMax}>5M</span>
                        </div>
                    </section>
                </div>

                {/* CTA */}
                <button className={styles.startBtn} onClick={handleStart}>
                    Start Interview Session
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                </button>

                {/* Meta info below CTA */}
                <div className={styles.meta}>
                    <span className={styles.metaItem}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                        </svg>
                        EST. 15–20 MINS TOTAL
                    </span>
                    <span className={styles.metaDot}>·</span>
                    <span className={styles.metaItem}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        5 AI-GENERATED QUESTIONS
                    </span>
                </div>
            </div>

            {/* Trust badges */}
            <div className={styles.trustBar}>
                {TRUST_BADGES.map((b) => (
                    <span key={b.label} className={styles.trustItem}>
                        {b.icon}
                        {b.label}
                    </span>
                ))}
            </div>
        </div>
    );
}
