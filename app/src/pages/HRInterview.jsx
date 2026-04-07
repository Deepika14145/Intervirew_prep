import { useNavigate } from 'react-router-dom';
import styles from './InterviewSetup.module.css';

export default function HRInterview() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/interview/session', {
      state: { role: 'HR Interview', level: 'General', format: 'text', timeLimit: 3, isHR: true }
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <h1 className={styles.title}>HR Behavioral Interview</h1>
        <p className={styles.subtitle}>
          Practice 10 real-world behavioral questions used by HR teams. Answers are evaluated for communication, confidence, and relevance using AI.
        </p>
      </div>

      <div className={styles.card}>
        <div className={styles.section}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { icon: '🎯', label: '10 Behavioral Questions', desc: 'Covering teamwork, leadership, conflict, adaptability and more' },
              { icon: '⏱', label: '3 Minutes Per Question', desc: 'Enough time to give a structured STAR-method answer' },
              { icon: '🤖', label: 'AI Evaluation', desc: 'Each answer scored on relevance, fluency, and confidence' },
              { icon: '📊', label: 'Full Report', desc: 'Download a PDF report with feedback and suggested answers' },
            ].map(({ icon, label, desc }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', padding: '14px', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)', color: 'var(--color-text)' }}>{label}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '2px' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className={styles.startBtn} onClick={handleStart}>
          Start HR Interview →
        </button>

        <div className={styles.meta}>
          <span className={styles.metaItem}>⏱ EST. 30 MINS TOTAL</span>
          <span className={styles.metaDot}>·</span>
          <span className={styles.metaItem}>💬 10 BEHAVIORAL QUESTIONS</span>
        </div>
      </div>
    </div>
  );
}
