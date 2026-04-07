import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ResumePreview.css';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function ResumePreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const s3Key = location.state?.s3Key;
  const analysis = location.state?.analysis;
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    if (!s3Key) return;
    fetch(`${BACKEND}/api/s3/generate-read-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      body: JSON.stringify({ objectKey: s3Key }),
    }).then(r => r.json()).then(data => { if (data.readUrl) setPdfUrl(data.readUrl); })
      .catch(err => console.error('Could not fetch S3 URL:', err));
  }, [s3Key]);

  if (!s3Key) return <div style={{ padding: '40px', textAlign: 'center' }}>No resume uploaded. <button onClick={() => navigate('/resumes')}>Go back</button></div>;

  return (
    <div className="preview-page">
      <div className="preview-header">
        <h2>Resume & AI Analysis</h2>
        <div className="actions">
          <button className="back" onClick={() => navigate(-1)}>Back</button>
          <button className="continue" onClick={() => navigate('/mock-interviews')}>Continue to Interview</button>
        </div>
      </div>

      <div className="pdf-container">
        {analysis && (
          <div className="analysis-panel">
            <h3>AI ATS Analysis</h3>
            <div className="ats-score">
              <strong>ATS Score: </strong>
              <span style={{ fontSize: '1.8rem', fontWeight: 900, color: analysis.atsScore > 75 ? '#10b981' : '#f59e0b' }}>{analysis.atsScore}/100</span>
            </div>
            <h4>🔥 Strengths</h4>
            <ul>{analysis.strengths?.map((s, i) => <li key={i}>{s}</li>)}</ul>
            <h4>⚠️ Improvements</h4>
            <ul>{analysis.weaknesses?.map((w, i) => <li key={i}>{w}</li>)}</ul>
            <h4>💼 Suggested Roles</h4>
            <div className="roles">{analysis.suggestedRoles?.map((r, i) => <span key={i} className="role-tag">{r}</span>)}</div>
            <div className="feedback-box"><h4>Recruiter Feedback</h4><p>{analysis.overallFeedback}</p></div>
          </div>
        )}
        <div className="pdf-panel">
          {pdfUrl ? <iframe src={pdfUrl} title="Resume Preview" width="100%" height="100%" style={{ border: 'none' }} /> : <p className="loading-text">Fetching resume from S3…</p>}
        </div>
      </div>
    </div>
  );
}
