import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Dashboard.module.css';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const FALLBACK = (name) => ({
  user: { name, role: 'Software Engineer', level: 'Mid-Level', readinessScore: 0 },
  stats: { interviewsCompleted: 0, technicalScore: 0, communicationScore: 0, confidenceScore: 0 },
  recentInterviews: [],
  topicAnalysis: [
    { topic: 'React Fundamentals', progress: 0 },
    { topic: 'System Design', progress: 0 },
    { topic: 'Data Structures', progress: 0 },
    { topic: 'Behavioral', progress: 0 },
  ],
});

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashData, setDashData] = useState(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) { setIsLoading(false); return; }

    const token = localStorage.getItem('authToken');
    const name = currentUser.displayName || currentUser.email?.split('@')[0] || 'Candidate';

    Promise.all([
      fetch(`${BACKEND}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : { user: {} }),
      fetch(`${BACKEND}/api/dynamodb/sessions`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : { sessions: [] }),
      fetch(`${BACKEND}/api/dynamodb/answers`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : { answers: [] }),
    ]).then(([profileData, sessionsData, answersData]) => {
      const profile = profileData.user || {};
      const sessions = sessionsData.sessions || [];
      const answers = answersData.answers || [];

      const displayName = profile.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : name;

      const avg = (arr, key) => arr.length ? Math.round(arr.reduce((s, a) => s + (a[key] || 0), 0) / arr.length) : 0;
      const technicalScore = avg(answers, 'nlpRelevanceScore');
      const communicationScore = avg(answers, 'nlpFluencyScore');
      const confidenceScore = avg(answers, 'nlpConfidenceLevel');
      const readinessScore = Math.round((technicalScore + communicationScore + confidenceScore) / 3) || 0;

      const recentInterviews = sessions.slice(0, 5).map((s, i) => ({
        id: s.sessionId || i,
        role: s.targetRole || 'Mock Interview',
        date: s.timestamp ? new Date(s.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
        score: Math.round(avg(answers.filter(a => a.sessionId === s.sessionId), 'nlpRelevanceScore')),
        status: s.status === 'COMPLETED' || answers.some(a => a.sessionId === s.sessionId && a.nlpRelevanceScore) ? 'Completed' : 'In Progress',
      }));

      // Build topic analysis from the most recent session's role
      const latestRole = sessions[0]?.targetRole || '';
      const topicAnalysis = latestRole.includes('Frontend') ? [
        { topic: 'React & Frontend', progress: technicalScore || 0 },
        { topic: 'JavaScript', progress: Math.round(technicalScore * 0.9) || 0 },
        { topic: 'CSS & Layout', progress: Math.round(technicalScore * 0.8) || 0 },
        { topic: 'Behavioral', progress: communicationScore || 0 },
      ] : latestRole.includes('Backend') ? [
        { topic: 'APIs & REST', progress: technicalScore || 0 },
        { topic: 'Databases', progress: Math.round(technicalScore * 0.85) || 0 },
        { topic: 'System Design', progress: Math.round(technicalScore * 0.7) || 0 },
        { topic: 'Behavioral', progress: communicationScore || 0 },
      ] : [
        { topic: 'Technical Skills', progress: technicalScore || 0 },
        { topic: 'System Design', progress: Math.round(technicalScore * 0.7) || 0 },
        { topic: 'Problem Solving', progress: Math.round(technicalScore * 0.85) || 0 },
        { topic: 'Behavioral', progress: communicationScore || 0 },
      ];

      setDashData({
        user: { name: displayName, role: profile.role || latestRole || 'Software Engineer', level: profile.level || 'Mid-Level', readinessScore },
        stats: { interviewsCompleted: sessions.length, technicalScore, communicationScore, confidenceScore },
        recentInterviews,
        topicAnalysis,
      });
    }).catch(err => {
      console.error('Dashboard fetch failed:', err);
      setDashData(FALLBACK(name));
    }).finally(() => setIsLoading(false));
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className={styles.dashboardContainer}>
        <div className={styles.statsGrid}>
          {[1,2,3,4].map(i => (
            <div key={i} className={`u-card ${styles.statCard}`}>
              <div className="u-skeleton" style={{ height: '20px', width: '120px', marginBottom: 'var(--sp-4)' }} />
              <div className="u-skeleton" style={{ height: '40px', width: '60px' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!dashData) return null;

  return (
    <div className={`${styles.dashboardContainer} u-page-enter`}>
      <div className={styles.banner}>
        <div className={styles.bannerInfo}>
          <h1 className="u-heading-1">Welcome back, {dashData.user.name.split(' ')[0]} 👋</h1>
          <p className={styles.bannerSubtext}>Preparing for: <strong>{dashData.user.level} {dashData.user.role}</strong></p>
          <div className={styles.quickActions}>
            <button className={styles.primaryBtn} onClick={() => navigate('/mock-interviews')}>Start Mock Interview</button>
            <button className={styles.secondaryBtn} onClick={() => navigate('/resumes')}>Analyze Resume</button>
          </div>
        </div>
        <div className={styles.readinessWidget}>
          <svg viewBox="0 0 36 36" className={styles.circularChart}>
            <path className={styles.circleBg} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path className={styles.circle} strokeDasharray={`${dashData.user.readinessScore}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <text x="18" y="18" dominantBaseline="central" className={styles.percentage}>{dashData.user.readinessScore}%</text>
          </svg>
          <div className={styles.readinessText}>
            <span className={styles.readinessLabel}>Overall Readiness</span>
            <span className={styles.readinessSubtext}>Target: 80%</span>
          </div>
        </div>
      </div>

      <div className={styles.statsGrid}>
        {[
          { icon: '📝', label: 'Interviews Completed', value: dashData.stats.interviewsCompleted },
          { icon: '💻', label: 'Technical Score', value: `${dashData.stats.technicalScore}%` },
          { icon: '🗣️', label: 'Communication', value: `${dashData.stats.communicationScore}%` },
          { icon: '🎯', label: 'Confidence', value: `${dashData.stats.confidenceScore}%` },
        ].map(({ icon, label, value }) => (
          <div key={label} className={`u-card ${styles.statCard}`}>
            <div className={styles.statIcon}>{icon}</div>
            <div className={styles.statContent}>
              <div className={styles.statLabel}>{label}</div>
              <div className={styles.statValue}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.mainGrid}>
        <div className={`u-card ${styles.gridSpan2}`}>
          <div className={styles.cardHeader}>
            <h2 className="u-label">Recent Interviews</h2>
            <button className={styles.textBtn} onClick={() => navigate('/performance')}>View All</button>
          </div>
          {dashData.recentInterviews.length === 0 ? (
            <p className="u-muted" style={{ padding: 'var(--sp-4) 0' }}>No interviews yet. <button className={styles.textBtn} onClick={() => navigate('/mock-interviews')}>Start one now →</button></p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead><tr><th>Role</th><th>Date</th><th>Score</th><th>Status</th></tr></thead>
                <tbody>
                  {dashData.recentInterviews.map(iv => (
                    <tr key={iv.id}>
                      <td className={styles.primaryCell}>{iv.role}</td>
                      <td className="u-muted">{iv.date}</td>
                      <td><span className={`${styles.scorePill} ${iv.score >= 80 ? styles.scoreHigh : iv.score >= 60 ? styles.scoreMed : styles.scoreLow}`}>{iv.score}%</span></td>
                      <td><span className={iv.status === 'Completed' ? 'u-chip u-chip--success' : 'u-chip u-chip--warning'}>{iv.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={`u-card ${styles.gridSpan1}`}>
          <div className={styles.cardHeader}><h2 className="u-label">Topic Analysis</h2></div>
          <div className={styles.topicsList}>
            {dashData.topicAnalysis.map((topic, i) => (
              <div key={i} className={styles.topicItem}>
                <div className={styles.topicHeader}>
                  <span className={styles.topicName}>{topic.topic}</span>
                  <span className={styles.topicScore}>{topic.progress}%</span>
                </div>
                <div className={styles.progressBarBg}>
                  <div
                    className={`${styles.progressBarFill} ${topic.progress >= 80 ? styles.bgSuccess : topic.progress >= 60 ? styles.bgWarning : styles.bgDanger}`}
                    style={{ width: `${topic.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
