import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './InterviewSession.module.css';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const TRANSCRIBE_STATUS = {
  idle: '', recording: '🔴 Recording…', transcribing: '⏳ Transcribing…',
  done: '✅ Transcription complete!', error: '⚠️ Transcription failed — type your answer instead.',
};

function CircularTimer({ seconds, total }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const pct = seconds / total;
  const color = pct > 0.5 ? 'var(--color-primary)' : pct > 0.25 ? 'var(--color-warning)' : 'var(--color-danger)';
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');
  return (
    <div className={styles.timerWrap}>
      <svg width="60" height="60" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r={radius} fill="none" stroke="var(--color-border)" strokeWidth="4" />
        <circle cx="30" cy="30" r={radius} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circumference} strokeDashoffset={circumference - pct * circumference}
          strokeLinecap="round" transform="rotate(-90 30 30)"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }} />
      </svg>
      <span className={styles.timerText} style={{ color }}>{mins}:{secs}</span>
    </div>
  );
}

export default function InterviewSession() {
  const navigate = useNavigate();
  const location = useLocation();
  const config = location.state || {};
  const TOTAL_TIME = (config.timeLimit || 3) * 60;

  const [questions, setQuestions] = useState([]);
  const [loadingQ, setLoadingQ] = useState(true);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [response, setResponse] = useState('');
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [hintCountdown, setHintCountdown] = useState(30);
  const [isInterviewerSpeaking, setIsInterviewerSpeaking] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [transcribeStatus, setTranscribeStatus] = useState('idle');
  const [sessionDone, setSessionDone] = useState(false); // all questions answered
  const [analysing, setAnalysing] = useState(false);

  // Use a ref for allResults so handleSubmit always reads the latest value (no stale closure)
  const allResultsRef = useRef([]);
  const [allResults, setAllResultsState] = useState([]);
  const setAllResults = (updater) => {
    const next = typeof updater === 'function' ? updater(allResultsRef.current) : updater;
    allResultsRef.current = next;
    setAllResultsState(next);
  };

  const timerRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioCacheRef = useRef({});
  const activeAudioRef = useRef(null);
  const hintTimerRef = useRef(null);
  const sessionIdRef = useRef(`session_${Date.now()}`);
  const sessionSavedRef = useRef(false);
  const handleSubmitRef = useRef(null);

  // Fetch questions from backend API
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    fetch(`${BACKEND}/api/questions?role=${encodeURIComponent(config.role || 'Full Stack Developer')}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.questions?.length) setQuestions(data.questions);
        else setQuestions(getFallbackQuestions(config.role));
      })
      .catch(() => setQuestions(getFallbackQuestions(config.role)))
      .finally(() => setLoadingQ(false));
  }, [config.role]);

  // Save session once
  useEffect(() => {
    if (sessionSavedRef.current) return;
    sessionSavedRef.current = true;
    const token = localStorage.getItem('authToken');
    fetch(`${BACKEND}/api/dynamodb/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        sessionId: sessionIdRef.current,
        targetRole: config.role || 'Full Stack Developer',
        targetLevel: config.level || 'Mid',
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});
  }, []);

  const currentQ = questions[questionIdx];

  // Reset per question
  useEffect(() => {
    if (!currentQ || sessionDone) return;
    setTimeLeft(TOTAL_TIME);
    setIsInterviewerSpeaking(false);
    setResponse('');
    setTranscribeStatus('idle');
    setSubmitted(false);
    if (activeAudioRef.current) { activeAudioRef.current.pause(); activeAudioRef.current = null; }
    setShowHint(false);
    setHintCountdown(30);
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => setShowHint(true), 30_000);
    const hintInterval = setInterval(() => setHintCountdown(c => c <= 1 ? (clearInterval(hintInterval), 0) : c - 1), 1000);
    return () => { if (hintTimerRef.current) clearTimeout(hintTimerRef.current); clearInterval(hintInterval); };
  }, [questionIdx, currentQ, sessionDone]);

  // Timer
  useEffect(() => {
    if (!currentQ || sessionDone) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); setTimeout(() => handleSubmitRef.current?.(), 300); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [questionIdx, currentQ, sessionDone]);

  // Recording timer
  useEffect(() => {
    if (isRecording) recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    else { clearInterval(recordingTimerRef.current); setRecordingTime(0); }
    return () => clearInterval(recordingTimerRef.current);
  }, [isRecording]);

  // Space-bar toggle
  useEffect(() => {
    const handler = e => { if (e.code === 'Space' && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); toggleMic(); } };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isRecording, transcribeStatus]);

  const toggleMic = async () => {
    if (isRecording) { mediaRecorderRef.current?.stop(); setIsRecording(false); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => { stream.getTracks().forEach(t => t.stop()); await uploadAndTranscribe(new Blob(audioChunksRef.current, { type: 'audio/webm' })); };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setTranscribeStatus('recording');
    } catch { setTranscribeStatus('error'); }
  };

  const uploadAndTranscribe = async (audioBlob) => {
    try {
      setTranscribeStatus('transcribing');
      const { auth } = await import('../firebase/firebase');
      const freshToken = auth.currentUser ? await auth.currentUser.getIdToken(true) : localStorage.getItem('authToken');
      if (freshToken) localStorage.setItem('authToken', freshToken);
      const formData = new FormData();
      formData.append('audio', audioBlob, 'answer.webm');
      const res = await fetch(`${BACKEND}/api/transcribe/deepgram`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${freshToken}` }, body: formData,
      });
      const data = await res.json();
      if (res.ok && typeof data.transcript === 'string') { setResponse(prev => prev + (prev ? ' ' : '') + data.transcript); setTranscribeStatus('done'); }
      else { setTranscribeStatus('error'); }
    } catch { setTranscribeStatus('error'); }
  };

  const handleSubmit = () => {
    if (submitted || !currentQ) return;
    setSubmitted(true);
    clearInterval(timerRef.current);

    const answerId = `ans_${Date.now()}_${questionIdx}`;
    const savedResponse = response;
    const savedQuestion = currentQ.question;
    const savedCategory = currentQ.category;
    const isLast = questionIdx >= questions.length - 1;

    // Add entry to results ref immediately
    const newEntry = { question: savedQuestion, category: savedCategory, answer: savedResponse, evaluation: null, answerId };
    setAllResults(prev => [...prev, newEntry]);

    // Move to next question or mark session done
    if (!isLast) {
      setTimeout(() => { setQuestionIdx(i => i + 1); setResponse(''); setTranscribeStatus('idle'); }, 400);
    } else {
      setSessionDone(true);
    }

    // Fire backend evaluation in background — update the entry when done
    const token = localStorage.getItem('authToken');
    const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    fetch(`${BACKEND}/api/dynamodb/answer`, {
      method: 'POST', headers,
      body: JSON.stringify({ answerId, sessionId: sessionIdRef.current, question: savedQuestion, answerText: savedResponse, transcribedText: savedResponse }),
    }).catch(() => {});

    fetch(`${BACKEND}/api/evaluation/process-transcription`, {
      method: 'POST', headers,
      body: JSON.stringify({ answerId, sessionId: sessionIdRef.current, transcribedText: savedResponse, question: savedQuestion }),
    })
      .then(r => r.json())
      .then(evalData => {
        if (evalData.evaluation) {
          setAllResults(prev => prev.map(r => r.answerId === answerId ? { ...r, evaluation: evalData.evaluation } : r));
        }
      })
      .catch(() => {});
  };

  const handleAnalyse = () => {
    setAnalysing(true);
    // Mark session as completed in backend
    const token = localStorage.getItem('authToken');
    fetch(`${BACKEND}/api/dynamodb/session/${sessionIdRef.current}/complete`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
    navigate('/analysis', { state: { allResults: allResultsRef.current, role: config.role } });
  };

  const handleSkip = () => {
    if (!currentQ) return;
    const newEntry = { question: currentQ.question, category: currentQ.category, answer: '(skipped)', evaluation: null, answerId: `ans_skip_${Date.now()}` };
    setAllResults(prev => [...prev, newEntry]);
    setResponse(''); setSubmitted(false); setTranscribeStatus('idle');
    if (isRecording) mediaRecorderRef.current?.stop();
    if (questionIdx < questions.length - 1) setQuestionIdx(i => i + 1);
    else setSessionDone(true);
  };

  const listenQuestion = () => {
    if (!currentQ) return;
    if (activeAudioRef.current) { activeAudioRef.current.pause(); activeAudioRef.current = null; setIsInterviewerSpeaking(false); return; }
    if (window.speechSynthesis.speaking) { window.speechSynthesis.cancel(); setIsInterviewerSpeaking(false); return; }
    const utterance = new SpeechSynthesisUtterance(currentQ.question.replace(/["""]/g, ''));
    utterance.rate = 0.95;
    utterance.onstart = () => setIsInterviewerSpeaking(true);
    utterance.onend = () => setIsInterviewerSpeaking(false);
    utterance.onerror = () => setIsInterviewerSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const formatRecTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  handleSubmitRef.current = handleSubmit;

  if (loadingQ) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontSize: '1.1rem', color: '#64748b' }}>Loading questions…</div>;

  // Session complete screen
  if (sessionDone) {
    const evaluated = allResults.filter(r => r.evaluation).length;
    const total = allResults.length;
    const allEvaluated = evaluated === total && total > 0;

    return (
      <div className={styles.page}>
        <header className={styles.topbar}>
          <div className={styles.logoArea}><span className={styles.logoText}>IntervAI</span><span className={styles.proBadge}>PRO</span></div>
          <div className={styles.progressArea}>
            <span className={styles.progressLabel}>INTERVIEW COMPLETE</span>
            <div className={styles.progressDots}>{questions.map((_, i) => <span key={i} className={`${styles.dot} ${styles.dotDone}`} />)}</div>
          </div>
          <button className={styles.exitBtn} onClick={() => navigate('/mock-interviews')}>Exit</button>
        </header>
        <div className={styles.doneScreen}>
          <div className={styles.doneIcon}>🎉</div>
          <h2 className={styles.doneTitle}>Interview Complete!</h2>
          <p className={styles.doneSub}>You answered {total} of {questions.length} questions.</p>
          <p className={styles.doneEval}>
            {allEvaluated
              ? '✅ All answers evaluated. Ready to view your report.'
              : `⏳ Evaluating your answers… ${evaluated} / ${total} done`}
          </p>
          {!allEvaluated && (
            <div className={styles.evalProgress}>
              <div className={styles.evalProgressFill} style={{ width: `${total > 0 ? (evaluated / total) * 100 : 0}%` }} />
            </div>
          )}
          <button
            className={styles.analyseBtn}
            onClick={handleAnalyse}
            disabled={!allEvaluated || analysing}
          >
            {analysing ? 'Generating Report…' : '📊 Analyse My Performance'}
          </button>
        </div>
      </div>
    );
  }

  if (!currentQ) return null;

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.logoArea}><span className={styles.logoText}>IntervAI</span><span className={styles.proBadge}>PRO</span></div>
        <div className={styles.progressArea}>
          <span className={styles.progressLabel}>QUESTION {questionIdx + 1} / {questions.length}</span>
          <div className={styles.progressDots}>
            {questions.map((_, i) => <span key={i} className={`${styles.dot} ${i < questionIdx ? styles.dotDone : ''} ${i === questionIdx ? styles.dotCurrent : ''}`} />)}
          </div>
        </div>
        <button className={styles.exitBtn} onClick={() => navigate('/mock-interviews')}>Exit Interview</button>
      </header>

      <div className={styles.body}>
        <aside className={styles.leftPanel} key={questionIdx}>
          <div className={styles.interviewerCard}>
            <div className={styles.interviewerTop}>
              <div className={styles.interviewerAvatar}>👤</div>
              <div className={styles.interviewerInfo}>
                <div className={styles.interviewerName}>Alex Chen</div>
                <div className={styles.interviewerTitle}>Senior Engineering Lead</div>
                {isInterviewerSpeaking && <div className={styles.speakingLabel}>🔊 SPEAKING...</div>}
              </div>
            </div>
            <div className={styles.categoryChip}>{currentQ.category}</div>
            <div className={styles.questionBlock}>
              <p className={styles.questionText}>{currentQ.question}</p>
              <button className={styles.listenBtn} onClick={listenQuestion} aria-label="Listen to question">
                {isInterviewerSpeaking ? '⏹ Stop' : '🔊 Listen'}
              </button>
            </div>
          </div>

          {showHint ? (
            <div className={styles.hintCard}>
              <div className={styles.hintHeader}><span className={styles.hintTitle}>💡 Quick Hint</span><button className={styles.hintClose} onClick={() => setShowHint(false)}>✕</button></div>
              <p className={styles.hintText}>{currentQ.hint}</p>
            </div>
          ) : (
            <div className={styles.hintCard} style={{ opacity: 0.5 }}>
              <div className={styles.hintHeader}><span className={styles.hintTitle}>💡 Hint available in {hintCountdown}s</span></div>
            </div>
          )}
        </aside>

        <section className={styles.rightPanel}>
          <div className={styles.responseHeader}>
            <div className={styles.responseTitle}>
              <div className={styles.userInitial}>U</div>
              <div>
                <div className={styles.responseLabel}>Your Response</div>
                {transcribeStatus !== 'idle' && <div className={styles.transcriptionLabel}>{TRANSCRIBE_STATUS[transcribeStatus]}</div>}
              </div>
            </div>
            <CircularTimer seconds={timeLeft} total={TOTAL_TIME} />
          </div>

          <div className={styles.textareaWrap}>
            <textarea
              className={styles.textarea}
              value={response}
              onChange={e => setResponse(e.target.value)}
              placeholder={transcribeStatus === 'transcribing' ? 'Transcribing your audio — please wait…' : 'Start typing your answer, or click the mic to record…'}
              disabled={transcribeStatus === 'transcribing'}
            />
          </div>

          <div className={`${styles.voiceBar} ${isRecording ? styles.voiceBarActive : ''}`}>
            <button className={`${styles.micBtn} ${isRecording ? styles.micBtnActive : ''}`} onClick={toggleMic} disabled={transcribeStatus === 'transcribing'} aria-label={isRecording ? 'Stop recording' : 'Start recording'}>🎤</button>
            <span className={styles.recordingTime}>{formatRecTime(recordingTime)}</span>
            {isRecording && <span className={styles.recordingStatus}>Recording…</span>}
          </div>
          <p className={styles.spaceHint}>PRESS <kbd className={styles.kbd}>SPACE</kbd> TO TOGGLE MIC</p>
        </section>
      </div>

      <footer className={styles.footer}>
        <button className={styles.skipBtn} onClick={handleSkip}>Skip Question</button>
        <button
          className={`${styles.submitBtn} ${submitted ? styles.submitted : ''}`}
          onClick={handleSubmit}
          disabled={submitted || transcribeStatus === 'transcribing'}
        >
          {submitted ? 'Submitted!' : questionIdx < questions.length - 1 ? 'Submit & Next →' : 'Submit Answer →'}
        </button>
      </footer>
    </div>
  );
}

function getFallbackQuestions(role) {
  const bank = {
    'Full Stack Developer': [
      { id: 1, category: 'Technical: Architecture', question: 'How would you architect a full-stack application that needs to scale to 1 million users?', hint: 'Cover CDN, load balancing, database sharding, caching layers.' },
      { id: 2, category: 'Technical: Frontend', question: 'How do you manage state in a large React application? Compare Redux, Zustand, and React Context.', hint: 'Discuss performance implications, boilerplate, and when each is appropriate.' },
      { id: 3, category: 'Technical: Backend', question: 'Explain the difference between authentication and authorization. How would you implement both in a Node.js app?', hint: 'Cover JWT, OAuth, RBAC, middleware patterns.' },
      { id: 4, category: 'Behavioral', question: 'Tell me about a full-stack feature you built end-to-end. What were the biggest technical challenges?', hint: 'Use STAR method.' },
      { id: 5, category: 'Situational', question: 'A feature you shipped is causing a memory leak in production. How do you identify and fix it?', hint: 'Cover heap snapshots, Chrome DevTools, Node.js memory profiling.' },
    ],
  };
  return bank[role] || bank['Full Stack Developer'];
}
