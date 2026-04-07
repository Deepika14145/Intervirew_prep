import { useLocation, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import './AnalysisPage.css';

export default function AnalysisPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const allResults = location.state?.allResults || [];
  const role = location.state?.role || 'Interview';

  if (!allResults.length) {
    return (
      <div className="empty-state">
        <div style={{ fontSize: '3rem' }}>📊</div>
        <h2>No Analysis Available</h2>
        <p>Complete a mock interview session to see your AI-powered evaluation here.</p>
        <button className="btn-primary" onClick={() => navigate('/mock-interviews')}>Start a Mock Interview</button>
      </div>
    );
  }

  const evaluated = allResults.filter(r => r.evaluation);
  const overallScore = evaluated.length
    ? Math.round(evaluated.reduce((s, r) => s + Math.round((r.evaluation.fluencyScore + r.evaluation.confidenceLevel + r.evaluation.relevanceScore) / 3), 0) / evaluated.length)
    : 0;

  const handleDownload = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 16;
    const contentW = pageW - margin * 2;
    let y = margin;

    const checkPage = (needed = 10) => {
      if (y + needed > pageH - margin) { doc.addPage(); y = margin; }
    };

    const writeText = (text, fontSize, color, bold, maxW) => {
      doc.setFontSize(fontSize);
      doc.setTextColor(...color);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      const lines = doc.splitTextToSize(String(text || ''), maxW || contentW);
      checkPage(lines.length * (fontSize * 0.4 + 1));
      doc.text(lines, margin, y);
      y += lines.length * (fontSize * 0.4 + 1) + 1;
    };

    const drawBar = (label, value, barColor) => {
      checkPage(10);
      doc.setFontSize(9); doc.setTextColor(70, 70, 70); doc.setFont('helvetica', 'normal');
      doc.text(label, margin, y);
      doc.text(`${value}%`, pageW - margin, y, { align: 'right' });
      y += 4;
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(margin, y, contentW, 3, 1, 1, 'F');
      const fillColor = value >= 70 ? [22, 163, 74] : value >= 50 ? [202, 138, 4] : [220, 38, 38];
      doc.setFillColor(...fillColor);
      doc.roundedRect(margin, y, (value / 100) * contentW, 3, 1, 1, 'F');
      y += 7;
    };

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageW, 28, 'F');
    doc.setFontSize(18); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
    doc.text('IntervAI — Interview Report', margin, 12);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal');
    doc.text(`${role}  •  ${allResults.length} Questions  •  ${new Date().toLocaleDateString()}`, margin, 20);
    y = 36;

    // Overall score box
    const scoreBoxColor = overallScore >= 70 ? [220, 252, 231] : overallScore >= 50 ? [254, 249, 195] : [254, 226, 226];
    const scoreTextColor = overallScore >= 70 ? [22, 101, 52] : overallScore >= 50 ? [133, 77, 14] : [153, 27, 27];
    doc.setFillColor(...scoreBoxColor);
    doc.roundedRect(margin, y, contentW, 16, 3, 3, 'F');
    doc.setFontSize(11); doc.setTextColor(...scoreTextColor); doc.setFont('helvetica', 'bold');
    doc.text(`Overall Score: ${overallScore}%  |  Evaluated: ${evaluated.length}/${allResults.length}`, margin + 4, y + 10);
    y += 22;

    // Each question
    allResults.forEach((r, i) => {
      checkPage(20);
      // Q header
      doc.setFillColor(47, 92, 255);
      doc.roundedRect(margin, y, 18, 7, 2, 2, 'F');
      doc.setFontSize(9); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
      doc.text(`Q${i + 1}`, margin + 4, y + 5);

      doc.setFontSize(9); doc.setTextColor(100, 116, 139); doc.setFont('helvetica', 'normal');
      doc.text(r.category || '', margin + 22, y + 5);

      if (r.evaluation) {
        const qScore = Math.round((r.evaluation.fluencyScore + r.evaluation.confidenceLevel + r.evaluation.relevanceScore) / 3);
        const sc = qScore >= 70 ? [22, 163, 74] : qScore >= 50 ? [202, 138, 4] : [220, 38, 38];
        doc.setTextColor(...sc); doc.setFont('helvetica', 'bold');
        doc.text(`${qScore}%`, pageW - margin, y + 5, { align: 'right' });
      }
      y += 10;

      writeText(r.question, 10, [15, 23, 42], true);
      y += 1;

      // Answer box
      checkPage(12);
      doc.setFillColor(248, 250, 252);
      const ansLines = doc.splitTextToSize(r.answer || '(no answer)', contentW - 8);
      const ansH = ansLines.length * 4.5 + 6;
      doc.roundedRect(margin, y, contentW, ansH, 2, 2, 'F');
      doc.setFontSize(8); doc.setTextColor(71, 85, 105); doc.setFont('helvetica', 'normal');
      doc.text(ansLines, margin + 4, y + 5);
      y += ansH + 3;

      if (r.evaluation) {
        drawBar('Relevance', r.evaluation.relevanceScore);
        drawBar('Fluency', r.evaluation.fluencyScore);
        drawBar('Confidence', r.evaluation.confidenceLevel);

        checkPage(8);
        doc.setFillColor(240, 253, 244);
        const fbLines = doc.splitTextToSize(r.evaluation.overallFeedback || '', contentW - 8);
        const fbH = fbLines.length * 4.5 + 6;
        doc.roundedRect(margin, y, contentW, fbH, 2, 2, 'F');
        doc.setFontSize(8); doc.setTextColor(22, 101, 52); doc.setFont('helvetica', 'normal');
        doc.text(fbLines, margin + 4, y + 5);
        y += fbH + 3;

        if (r.evaluation.missingConcepts?.length && !r.evaluation.missingConcepts[0].includes('No specific')) {
          writeText('Missing: ' + r.evaluation.missingConcepts.join(', '), 8, [220, 38, 38], false);
        }

        if (r.evaluation.suggestedAnswer) {
          checkPage(8);
          writeText('Suggested Answer:', 8, [47, 92, 255], true);
          writeText(r.evaluation.suggestedAnswer, 8, [51, 65, 85], false);
        }
      }

      // Divider
      y += 4;
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y, pageW - margin, y);
      y += 6;
    });

    doc.save(`interview-report-${Date.now()}.pdf`);
  };

  return (
    <div className="analysis-page">
      <div className="analysis-header">
        <div>
          <h1>Interview Report</h1>
          <p>{role} — {allResults.length} Questions</p>
        </div>
        <div className="header-actions">
          <button className="btn-download" onClick={handleDownload}>⬇ Download Report</button>
          <button className="btn-primary" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
      </div>

      <div className="summary-bar">
        <ScoreRing score={overallScore} />
        <div className="summary-stats">
          <div className="stat-item"><span className="stat-val">{allResults.length}</span><span className="stat-lbl">Questions</span></div>
          <div className="stat-item"><span className="stat-val">{evaluated.length}</span><span className="stat-lbl">Evaluated</span></div>
          <div className="stat-item"><span className="stat-val" style={{ color: overallScore >= 70 ? '#16a34a' : overallScore >= 50 ? '#ca8a04' : '#dc2626' }}>{overallScore}%</span><span className="stat-lbl">Avg Score</span></div>
        </div>
      </div>

      <div className="results-list">
        {allResults.map((r, i) => <QuestionCard key={i} index={i} result={r} />)}
      </div>
    </div>
  );
}

function ScoreRing({ score }) {
  const r = 40, circ = 2 * Math.PI * r;
  const color = score >= 70 ? '#16a34a' : score >= 50 ? '#ca8a04' : '#dc2626';
  return (
    <div className="score-ring-wrap">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={circ - (score / 100) * circ}
          strokeLinecap="round" transform="rotate(-90 50 50)" style={{ transition: 'stroke-dashoffset 1s ease' }} />
        <text x="50" y="50" dominantBaseline="central" textAnchor="middle" fontSize="18" fontWeight="800" fill={color}>{score}</text>
      </svg>
      <span className="ring-label">Overall</span>
    </div>
  );
}

function QuestionCard({ index, result }) {
  const { question, category, answer, evaluation } = result;
  const score = evaluation ? Math.round((evaluation.fluencyScore + evaluation.confidenceLevel + evaluation.relevanceScore) / 3) : null;
  const scoreColor = score === null ? '#94a3b8' : score >= 70 ? '#16a34a' : score >= 50 ? '#ca8a04' : '#dc2626';

  return (
    <div className="q-card">
      <div className="q-card-header">
        <div className="q-meta">
          <span className="q-num">Q{index + 1}</span>
          <span className="q-category">{category}</span>
        </div>
        {score !== null && <span className="q-score" style={{ color: scoreColor, borderColor: scoreColor }}>{score}%</span>}
        {score === null && <span className="q-score pending">Evaluating…</span>}
      </div>

      <p className="q-question">{question}</p>

      <div className="q-answer-block">
        <span className="q-answer-label">Your Answer</span>
        <p className="q-answer-text">{answer || <em style={{ color: '#94a3b8' }}>(no answer provided)</em>}</p>
      </div>

      {evaluation && (
        <>
          <div className="q-scores-row">
            <ScoreBar label="Relevance" value={evaluation.relevanceScore} />
            <ScoreBar label="Fluency" value={evaluation.fluencyScore} />
            <ScoreBar label="Confidence" value={evaluation.confidenceLevel} />
          </div>

          <div className="q-feedback">
            <span className="feedback-icon">✨</span>
            <p>{evaluation.overallFeedback}</p>
          </div>

          {evaluation.fillerWordsDetected > 0 && (
            <div className="filler-badge">⚠️ {evaluation.fillerWordsDetected} filler word{evaluation.fillerWordsDetected > 1 ? 's' : ''} detected</div>
          )}

          {evaluation.missingConcepts?.length > 0 && !evaluation.missingConcepts[0].includes('No specific') && (
            <div className="missing-section">
              <span className="missing-label">Missing Concepts</span>
              <div className="missing-tags">{evaluation.missingConcepts.map((c, i) => <span key={i} className="missing-tag">{c}</span>)}</div>
            </div>
          )}

          <details className="suggested-answer">
            <summary>💡 View Suggested Answer</summary>
            <p>{evaluation.suggestedAnswer}</p>
          </details>
        </>
      )}
    </div>
  );
}

function ScoreBar({ label, value }) {
  const color = value >= 70 ? '#16a34a' : value >= 50 ? '#ca8a04' : '#dc2626';
  return (
    <div className="score-bar-item">
      <div className="score-bar-top"><span>{label}</span><span style={{ color, fontWeight: 700 }}>{value}%</span></div>
      <div className="score-bar-bg"><div className="score-bar-fill" style={{ width: `${value}%`, background: color }} /></div>
    </div>
  );
}
