import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ResumeUpload.css';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const JOB_ROLES = [
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'DevOps Engineer', 'Data Scientist', 'System Design Architect',
  'Product Manager', 'iOS / Android Developer',
];

export default function ResumeUpload() {
  const fileInputRef = useRef();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [s3Key, setS3Key] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [targetRole, setTargetRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  const performUpload = async (uploadFile) => {
    setUploading(true); setProgress(20); setErrorMsg(null); setAnalysis(null);
    try {
      const formData = new FormData();
      formData.append('resume', uploadFile);
      if (targetRole) formData.append('targetRole', targetRole);
      if (jobDescription) formData.append('jobDescription', jobDescription);
      const res = await fetch(`${BACKEND}/api/s3/upload-resume`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        body: formData,
      });
      const data = await res.json();
      setProgress(60);
      if (!res.ok) throw new Error(`Backend Error (${res.status}): ${data.error || JSON.stringify(data)}`);
      setProgress(100);
      setS3Key(data.objectKey);
      if (data.analysis) setAnalysis(data.analysis);
    } catch (err) {
      setProgress(0);
      setErrorMsg(err.message || 'Upload failed.');
    } finally { setUploading(false); }
  };

  const handleFile = (f) => { if (!f) return; setFile(f); };

  return (
    <div className="upload-page">
      <div className="title-section">
        <h1>Optimize Your Interview Prep</h1>
        <p>Upload your resume and our AI will tailor practice sessions to your professional experience.</p>
      </div>

      <div className="upload-card">
        {/* Role + JD selectors */}
        <div className="role-section">
          <label className="field-label">TARGET ROLE (optional)</label>
          <select className="role-select" value={targetRole} onChange={e => setTargetRole(e.target.value)}>
            <option value="">— Select a role —</option>
            {JOB_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="role-section">
          <label className="field-label">JOB DESCRIPTION (optional)</label>
          <textarea
            className="jd-textarea"
            placeholder="Paste the job description here to check if your resume is a fit for this role…"
            value={jobDescription}
            onChange={e => setJobDescription(e.target.value)}
            rows={4}
          />
        </div>

        <input type="file" ref={fileInputRef} className="hidden-input" accept=".pdf" onChange={e => handleFile(e.target.files[0])} />

        <div
          className={`drop-zone ${dragging ? 'dragging' : ''}`}
          onClick={() => fileInputRef.current.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        >
          <div className="upload-icon">📤</div>
          <h3>Drag & Drop your resume</h3>
          <p>PDF up to 15MB</p>
          <button className="choose-btn" type="button" onClick={e => { e.stopPropagation(); fileInputRef.current.click(); }}>Choose File</button>
        </div>

        {file && (
          <div className="file-box">
            <div className="file-info">
              <div className="file-icon">📄</div>
              <div>
                <p className="file-name">{file.name}</p>
                <small>{(file.size / 1024 / 1024).toFixed(2)} MB • {uploading ? 'Uploading...' : analysis ? 'Analyzed' : 'Ready'}</small>
              </div>
            </div>
            <span className="remove" onClick={() => { setFile(null); setProgress(0); setErrorMsg(null); setAnalysis(null); }}>✕</span>
            {progress > 0 && (
              <div className="progress-section">
                <span>{errorMsg ? '❌ Upload Failed' : `${progress}% Complete`}</span>
                <span>{errorMsg ? 'Error' : uploading ? 'Uploading...' : 'Done'}</span>
              </div>
            )}
            {errorMsg && <div style={{ color: 'red', marginTop: '10px', fontSize: '0.85rem' }}>{errorMsg}</div>}
            {progress > 0 && <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%`, backgroundColor: errorMsg ? 'red' : '' }} /></div>}
          </div>
        )}

        {/* Analysis preview */}
        {analysis && <AnalysisPreview analysis={analysis} targetRole={targetRole} />}

        <div className="footer">
          <span className="secure">🔒 Your data is secure</span>
          <div className="actions">
            <button className="back" onClick={() => navigate(-1)}>Back</button>
            {!file && <button className="continue" disabled={!file} onClick={() => {}}>Choose a file first</button>}
            {file && !analysis && !uploading && (
              <button className="continue" onClick={() => performUpload(file)}>Analyze Resume</button>
            )}
            {uploading && <button className="continue" disabled>Analyzing…</button>}
            {analysis && (
              <button className="continue" onClick={() => navigate('/resume-preview', { state: { s3Key, analysis } })}>View Full Report →</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalysisPreview({ analysis, targetRole }) {
  const fitColor = analysis.jobFitVerdict === 'Strong Fit' ? '#16a34a' : analysis.jobFitVerdict === 'Moderate Fit' ? '#ca8a04' : '#dc2626';
  return (
    <div className="analysis-preview">
      <div className="preview-header">
        <span className="preview-title">✨ AI Analysis Complete</span>
        <span className="ats-badge">ATS Score: {analysis.atsScore}/100</span>
      </div>

      {analysis.jobFitVerdict && (
        <div className="fit-section" style={{ borderColor: fitColor }}>
          <div className="fit-header">
            <span className="fit-label">Job Fit for {targetRole}</span>
            <span className="fit-verdict" style={{ color: fitColor, background: fitColor + '18' }}>{analysis.jobFitVerdict} — {analysis.jobFitScore}%</span>
          </div>
          {analysis.jobFitGaps?.length > 0 && (
            <div className="fit-gaps">
              <span className="gaps-label">Gaps identified:</span>
              <ul>{analysis.jobFitGaps.map((g, i) => <li key={i}>{g}</li>)}</ul>
            </div>
          )}
          {analysis.jobFitSuggestions?.length > 0 && (
            <div className="fit-suggestions">
              <span className="gaps-label">How to improve your fit:</span>
              <ul>{analysis.jobFitSuggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          )}
        </div>
      )}

      <p className="preview-feedback">{analysis.overallFeedback}</p>
    </div>
  );
}
