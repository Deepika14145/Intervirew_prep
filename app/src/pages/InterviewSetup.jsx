import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './InterviewSetup.module.css';

const JOB_ROLES = ['Frontend Developer','Backend Developer','Full Stack Developer','DevOps Engineer','Data Scientist','Product Manager','System Design Architect','iOS / Android Developer'];
const EXPERIENCE_LEVELS = ['Junior', 'Mid', 'Senior', 'Lead'];

export default function InterviewSetup() {
  const navigate = useNavigate();
  const [role, setRole] = useState('Frontend Developer');
  const [level, setLevel] = useState('Mid');
  const [format, setFormat] = useState('text');
  const [timeLimit, setTimeLimit] = useState(3);

  const handleStart = () => navigate('/interview/session', { state: { role, level, format, timeLimit } });

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <h1 className={styles.title}>Set Up Your Mock Interview</h1>
        <p className={styles.subtitle}>Configure your session and our AI will tailor a realistic interview experience.</p>
      </div>

      <div className={styles.card}>
        <section className={styles.section}>
          <label className={styles.fieldLabel}>JOB ROLE</label>
          <div className={styles.selectWrapper}>
            <select className={styles.select} value={role} onChange={e => setRole(e.target.value)}>
              {JOB_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </section>

        <section className={styles.section}>
          <label className={styles.fieldLabel}>EXPERIENCE LEVEL</label>
          <div className={styles.toggleGroup}>
            {EXPERIENCE_LEVELS.map(l => (
              <button key={l} className={`${styles.toggleBtn} ${level === l ? styles.toggleBtnActive : ''}`} onClick={() => setLevel(l)}>{l}</button>
            ))}
          </div>
        </section>

        <div className={styles.row}>
          <section className={`${styles.section} ${styles.flex1}`}>
            <label className={styles.fieldLabel}>INTERVIEW FORMAT</label>
            <div className={styles.formatGroup}>
              {['text','voice'].map(f => (
                <button key={f} className={`${styles.formatBtn} ${format === f ? styles.formatBtnActive : ''}`} onClick={() => setFormat(f)}>
                  {f === 'text' ? '💬' : '🎤'} {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </section>

          <section className={`${styles.section} ${styles.flex1}`}>
            <label className={styles.fieldLabel}>TIME LIMIT <span className={styles.timeBadge}>{timeLimit} mins / Q</span></label>
            <div className={styles.sliderWrapper}>
              <span className={styles.sliderMin}>1M</span>
              <input type="range" min={1} max={5} step={1} value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))} className={styles.slider} />
              <span className={styles.sliderMax}>5M</span>
            </div>
          </section>
        </div>

        <button className={styles.startBtn} onClick={handleStart}>
          Start Interview Session →
        </button>

        <div className={styles.meta}>
          <span className={styles.metaItem}>⏱ EST. 15–20 MINS TOTAL</span>
          <span className={styles.metaDot}>·</span>
          <span className={styles.metaItem}>💬 5 AI-GENERATED QUESTIONS</span>
        </div>
      </div>
    </div>
  );
}
