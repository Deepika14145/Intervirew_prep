import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Performance.css';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function Performance() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) { setLoading(false); return; }
    const token = localStorage.getItem('authToken');
    fetch(`${BACKEND}/api/dynamodb/answers`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : { answers: [] })
      .then(data => { setAnswers(data.answers || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [currentUser]);

  const avg = (key) => answers.length ? Math.round(answers.reduce((s, a) => s + (a[key] || 0), 0) / answers.length) : 0;
  const fluency = avg('nlpFluencyScore');
  const confidence = avg('nlpConfidenceLevel');
  const relevance = avg('nlpRelevanceScore');
  const fillerAvg = avg('nlpFillerWords');
  const overall = Math.round((fluency + confidence + relevance) / 3);

  return (
    <div className="page">
      <div className="container">
        <div className="header">
          <div>
            <h2>Post-Interview Analysis</h2>
            <p>{answers.length} answer{answers.length !== 1 ? 's' : ''} analyzed</p>
          </div>
          <div className="header-buttons">
            <Link to="/mock-interviews" className="btn-primary">New Mock Interview</Link>
          </div>
        </div>

        {loading ? (
          <p style={{ color: '#64748b', padding: '40px 0' }}>Loading your performance data…</p>
        ) : answers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ color: '#64748b', marginBottom: '16px' }}>No interview data yet.</p>
            <button className="btn-primary" onClick={() => navigate('/mock-interviews')}>Start Your First Interview</button>
          </div>
        ) : (
          <div className="grid">
            <div className="left">
              <div className="stats">
                <Stat title="Fluency Score" value={fluency} unit="/ 100" badge={fluency >= 80 ? 'EXCELLENT' : fluency >= 60 ? 'GOOD' : 'NEEDS WORK'} />
                <Stat title="Filler Words" value={fillerAvg} unit="avg" badge={fillerAvg <= 2 ? 'EXCELLENT' : fillerAvg <= 5 ? 'AVERAGE' : 'HIGH'} />
                <Stat title="Relevance" value={relevance} unit="/ 100" badge={relevance >= 80 ? 'EXCELLENT' : 'GOOD'} />
                <div className="card center">
                  <p className="label">Confidence Score</p>
                  <div className="circle">{confidence}%</div>
                </div>
              </div>

              <div className="card">
                <h3>Recent Answers</h3>
                {answers.slice(0, 5).map((a, i) => (
                  <div key={i} style={{ borderBottom: '1px solid #e2e8f0', padding: '12px 0' }}>
                    <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '4px' }}>{a.question?.slice(0, 80)}…</p>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem' }}>
                      <span>Fluency: <strong>{a.nlpFluencyScore || 0}</strong></span>
                      <span>Confidence: <strong>{a.nlpConfidenceLevel || 0}</strong></span>
                      <span>Relevance: <strong>{a.nlpRelevanceScore || 0}</strong></span>
                    </div>
                    {a.nlpFeedback && <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px', fontStyle: 'italic' }}>{a.nlpFeedback}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="right">
              <div className="card">
                <h3>Overall Score</h3>
                <div className="circle" style={{ margin: '16px auto', width: '100px', height: '100px', fontSize: '1.8rem' }}>{overall}%</div>
                <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                  {overall >= 80 ? 'Excellent performance!' : overall >= 60 ? 'Good progress. Keep practicing.' : 'Keep going — practice makes perfect.'}
                </p>
              </div>

              <div className="card tips">
                <h3>Improvement Tips</h3>
                {fluency < 70 && <Tip title="Work on fluency" />}
                {fillerAvg > 3 && <Tip title="Reduce filler words" />}
                {confidence < 70 && <Tip title="Build confidence" />}
                {relevance < 70 && <Tip title="Stay on topic" />}
                {overall >= 80 && <Tip title="Keep up the great work!" />}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ title, value, unit, badge }) {
  return (
    <div className="card">
      <div className="stat-header"><span>{title}</span><span className="badge">{badge}</span></div>
      <h2>{value} <small>{unit}</small></h2>
    </div>
  );
}

function Tip({ title }) {
  return (
    <div className="tip">
      <div className="tip-icon" />
      <div><p className="tip-title">{title}</p><p className="tip-text">Practice consistently to improve.</p></div>
    </div>
  );
}
