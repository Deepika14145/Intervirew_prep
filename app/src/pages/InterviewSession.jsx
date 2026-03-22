import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './InterviewSession.module.css';

const BACKEND = 'http://localhost:5000';

/* ── Mock question bank ── */
const QUESTIONS = [
    {
        id: 1,
        category: 'Technical: System Design',
        question:
            '"Explain how you would approach designing a highly available notification service that needs to handle both push, email, and SMS triggers. What specific architectural components would you prioritize?"',
        hint: 'Consider mentioning message queues for decoupling and how you would handle failures at the 3rd-party provider level.',
    },
    {
        id: 2,
        category: 'Behavioral',
        question:
            '"Tell me about a time you had to lead a cross-functional team through a technically challenging project. How did you manage conflicting priorities?"',
        hint: 'Use the STAR method: Situation, Task, Action, Result. Quantify outcomes where possible.',
    },
    {
        id: 3,
        category: 'Technical: Frontend',
        question:
            '"How would you optimize a React application that is experiencing slow renders on a data-heavy dashboard? Walk me through your debugging and optimization process."',
        hint: 'Think about React.memo, useMemo, useCallback, virtualization (react-window), and code splitting.',
    },
    {
        id: 4,
        category: 'Technical: Architecture',
        question:
            '"What strategies would you use to ensure backward compatibility when evolving a public REST API that has thousands of active consumers?"',
        hint: 'Cover versioning strategies (URL vs header-based), deprecation policies, and semantic versioning.',
    },
    {
        id: 5,
        category: 'Situational',
        question:
            '"A critical production bug was just reported 30 minutes before a major product demo. How do you prioritize and manage the situation?"',
        hint: 'Focus on triage speed, stakeholder communication, hotfix vs rollback decision, and post-mortem.',
    },
];

const TOTAL_TIME = 165;

/* ── Helpers ── */
function CircularTimer({ seconds, total }) {
    const radius = 22;
    const circumference = 2 * Math.PI * radius;
    const progress = (seconds / total) * circumference;
    const pct = seconds / total;
    const color = pct > 0.5 ? 'var(--color-primary)' : pct > 0.25 ? 'var(--color-warning)' : 'var(--color-danger)';
    const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    return (
        <div className={styles.timerWrap}>
            <svg width="60" height="60" viewBox="0 0 60 60">
                <circle cx="30" cy="30" r={radius} fill="none" stroke="var(--color-border)" strokeWidth="4" />
                <circle cx="30" cy="30" r={radius} fill="none" stroke={color} strokeWidth="4"
                    strokeDasharray={circumference} strokeDashoffset={circumference - progress}
                    strokeLinecap="round" transform="rotate(-90 30 30)"
                    style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }} />
            </svg>
            <span className={styles.timerText} style={{ color }}>{mins}:{secs}</span>
        </div>
    );
}

function SpeakingBars() {
    return (
        <div className={styles.speakingBars}>
            {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className={styles.bar} style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
        </div>
    );
}

function SessionProgress({ total, current }) {
    return (
        <div className={styles.progressDots}>
            {Array.from({ length: total }).map((_, i) => (
                <span key={i}
                    className={`${styles.dot} ${i < current ? styles.dotDone : ''} ${i === current ? styles.dotCurrent : ''}`}
                />
            ))}
        </div>
    );
}

/* ── Transcription status label ── */
const TRANSCRIBE_STATUS = {
    idle: '',
    recording: '🔴 Recording — speak your answer…',
    uploading: '⬆️  Uploading audio to S3…',
    transcribing: '⏳ Transcribing with AWS… (may take ~10-30s)',
    done: '✅ Transcription complete!',
    error: '⚠️  Transcription failed — you can type your answer instead.',
};

export default function InterviewSession() {
    const navigate = useNavigate();
    const location = useLocation();
    const config = location.state || {};

    const [questionIdx, setQuestionIdx] = useState(0);
    const [response, setResponse] = useState('');
    const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [showHint, setShowHint] = useState(true);
    const [isInterviewerSpeaking, setIsInterviewerSpeaking] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [transcribeStatus, setTranscribeStatus] = useState('idle');

    // ── Refs
    const timerRef = useRef(null);
    const recordingTimerRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const currentQ = QUESTIONS[questionIdx];
    // Unique session and answer IDs reused across Q submissions
    const sessionIdRef = useRef(`session_${Date.now()}`);

    /* ── Countdown timer ── */
    useEffect(() => {
        setTimeLeft(TOTAL_TIME);
        setIsInterviewerSpeaking(true);
        setResponse('');
        setTranscribeStatus('idle');

        // Polly TTS
        const synthesize = async () => {
            try {
                const res = await fetch(`${BACKEND}/api/polly/synthesize`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: currentQ.question }),
                });
                const data = await res.json();
                if (data.audioUrl) {
                    const audio = new Audio(data.audioUrl);
                    audio.onended = () => setIsInterviewerSpeaking(false);
                    audio.play();
                } else {
                    setIsInterviewerSpeaking(false);
                }
            } catch {
                setIsInterviewerSpeaking(false);
            }
        };
        synthesize();
    }, [questionIdx]);

    useEffect(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft((t) => { if (t <= 1) { clearInterval(timerRef.current); return 0; } return t - 1; });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [questionIdx]);

    useEffect(() => {
        if (isRecording) {
            recordingTimerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
        } else {
            clearInterval(recordingTimerRef.current);
            setRecordingTime(0);
        }
        return () => clearInterval(recordingTimerRef.current);
    }, [isRecording]);

    /* ── Space-bar toggle ── */
    useEffect(() => {
        const handler = (e) => {
            if (e.code === 'Space' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                toggleMic();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    });

    /* ═══════════════════════════════════════════════════════════════
       NEW MIC FLOW: MediaRecorder → S3 → AWS Transcribe → textarea
    ═══════════════════════════════════════════════════════════════ */
    const toggleMic = async () => {
        if (isRecording) {
            // ── STOP: triggers ondataavailable + onstop
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        } else {
            // ── START: request mic access
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
                audioChunksRef.current = [];

                recorder.ondataavailable = (e) => {
                    if (e.data.size > 0) audioChunksRef.current.push(e.data);
                };

                recorder.onstop = async () => {
                    // Stop all tracks to release the mic
                    stream.getTracks().forEach((t) => t.stop());

                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    await uploadAndTranscribe(audioBlob);
                };

                recorder.start();
                mediaRecorderRef.current = recorder;
                setIsRecording(true);
                setTranscribeStatus('recording');
            } catch (err) {
                console.error('Mic access denied:', err);
                setTranscribeStatus('error');
            }
        }
    };

    /**
     * 1. Send the webm audio buffer to our backend Deepgram route
     * 2. Receive the raw transcript text immediately.
     */
    const uploadAndTranscribe = async (audioBlob) => {
        try {
            setTranscribeStatus('transcribing');
            
            const formData = new FormData();
            formData.append('audio', audioBlob, 'answer.webm');

            const res = await fetch(`${BACKEND}/api/transcribe/deepgram`, {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            // data.transcript might be an empty string "" if you didn't say anything loud enough.
            // Empty strings are falsy in JS, so we explicitely check typeof string instead!
            if (res.ok && typeof data.transcript === 'string') {
                setResponse((prev) => prev + (prev ? ' ' : '') + data.transcript);
                setTranscribeStatus('done');
            } else {
                console.error('Deepgram API returned an error or missing transcript:', data);
                setTranscribeStatus('error');
            }
        } catch (err) {
            console.error('Transcribe pipeline failed:', err);
            setTranscribeStatus('error');
        }
    };

    /* ── Submit answer (saves to DynamoDB + triggers NLP) ── */
    const handleSubmit = async () => {
        setSubmitted(true);
        clearInterval(timerRef.current);
        const answerId = `ans_${Date.now()}`;

        try {
            await fetch(`${BACKEND}/api/dynamodb/answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    answerId,
                    sessionId: sessionIdRef.current,
                    question: currentQ.question,
                    answerText: response,
                    transcribedText: response,
                }),
            });

            await fetch(`${BACKEND}/api/evaluation/process-transcription`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    answerId,
                    sessionId: sessionIdRef.current,
                    transcribedText: response,
                }),
            });
        } catch (err) {
            console.error('Backend persistence failed:', err);
        }

        if (questionIdx < QUESTIONS.length - 1) {
            setTimeout(() => { setSubmitted(false); setQuestionIdx((i) => i + 1); }, 600);
        } else {
            setTimeout(() => navigate('/results'), 800);
        }
    };

    const handleSkip = () => {
        setResponse('');
        setSubmitted(false);
        setTranscribeStatus('idle');
        if (isRecording) mediaRecorderRef.current?.stop();
        if (questionIdx < QUESTIONS.length - 1) setQuestionIdx((i) => i + 1);
    };

    const formatRecTime = (s) =>
        `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    /* ═══════════════ RENDER ═══════════════ */
    return (
        <div className={styles.page}>
            {/* ══ Top bar ══ */}
            <header className={styles.topbar}>
                <div className={styles.logoArea}>
                    <span className={styles.logoIcon}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                    </span>
                    <span className={styles.logoText}>IntervAI</span>
                    <span className={styles.proBadge}>PRO</span>
                </div>
                <div className={styles.progressArea}>
                    <span className={styles.progressLabel}>SESSION PROGRESS</span>
                    <SessionProgress total={QUESTIONS.length} current={questionIdx} />
                </div>
                <button className={styles.exitBtn} onClick={() => navigate('/mock-interviews')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Exit Interview
                </button>
            </header>

            {/* ══ Main body ══ */}
            <div className={styles.body}>
                {/* Left: AI Interviewer */}
                <aside className={styles.leftPanel} key={questionIdx}>
                    <div className={styles.interviewerCard}>
                        <div className={styles.interviewerTop}>
                            <div className={styles.avatarRing}>
                                <div className={styles.interviewerAvatar}>
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" color="#4B5563">
                                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                                    </svg>
                                </div>
                                {isInterviewerSpeaking && <span className={styles.activeDot} />}
                            </div>
                            <div className={styles.interviewerInfo}>
                                <div className={styles.interviewerName}>Alex Chen</div>
                                <div className={styles.interviewerTitle}>Senior Engineering Lead</div>
                                {isInterviewerSpeaking && (
                                    <div className={styles.speakingRow}>
                                        <SpeakingBars />
                                        <span className={styles.speakingLabel}>SPEAKING...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className={styles.categoryChip}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                            </svg>
                            {currentQ.category}
                        </div>
                        <div className={styles.questionBlock}>
                            <p className={styles.questionText}>{currentQ.question}</p>
                        </div>
                    </div>

                    {showHint && (
                        <div className={styles.hintCard}>
                            <div className={styles.hintHeader}>
                                <span className={styles.hintIconWrap}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                </span>
                                <span className={styles.hintTitle}>Quick Hint</span>
                                <button className={styles.hintClose} onClick={() => setShowHint(false)} aria-label="Dismiss hint">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                            <p className={styles.hintText}>{currentQ.hint}</p>
                        </div>
                    )}
                </aside>

                {/* Right: Response panel */}
                <section className={styles.rightPanel}>
                    <div className={styles.responseHeader}>
                        <div className={styles.responseTitle}>
                            <div className={styles.userInitial}>U</div>
                            <div>
                                <div className={styles.responseLabel}>Your Response</div>
                                {/* Transcription status badge */}
                                {transcribeStatus !== 'idle' && (
                                    <div className={styles.transcriptionLabel}>
                                        {TRANSCRIBE_STATUS[transcribeStatus]}
                                    </div>
                                )}
                            </div>
                        </div>
                        <CircularTimer seconds={timeLeft} total={TOTAL_TIME} />
                    </div>

                    <div className={styles.textareaWrap}>
                        <textarea
                            className={styles.textarea}
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                            placeholder={
                                transcribeStatus === 'transcribing'
                                    ? 'Transcribing your audio — please wait…'
                                    : 'Start typing your answer, or click the mic to record your voice response…'
                            }
                            disabled={transcribeStatus === 'transcribing' || transcribeStatus === 'uploading'}
                        />
                    </div>

                    {/* Voice recording bar */}
                    <div className={`${styles.voiceBar} ${isRecording ? styles.voiceBarActive : ''}`}>
                        <button
                            className={`${styles.micBtn} ${isRecording ? styles.micBtnActive : ''}`}
                            onClick={toggleMic}
                            disabled={transcribeStatus === 'uploading' || transcribeStatus === 'transcribing'}
                            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                        >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                <line x1="12" y1="19" x2="12" y2="23" />
                                <line x1="8" y1="23" x2="16" y2="23" />
                            </svg>
                        </button>

                        <div className={styles.recordingInfo}>
                            <span className={styles.recordingTime}>{formatRecTime(recordingTime)}</span>
                            {isRecording && (
                                <>
                                    <span className={styles.recordingDivider}>|</span>
                                    <span className={styles.recordingStatus}>Recording…</span>
                                </>
                            )}
                        </div>

                        {isRecording && (
                            <button
                                className={styles.discardBtn}
                                onClick={() => { mediaRecorderRef.current?.stop(); setIsRecording(false); setTranscribeStatus('idle'); setResponse(''); }}
                                aria-label="Discard recording"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                                    <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                                </svg>
                            </button>
                        )}
                    </div>

                    <p className={styles.spaceHint}>
                        PRESS <kbd className={styles.kbd}>SPACE</kbd> TO TOGGLE MIC
                    </p>
                </section>
            </div>

            {/* ══ Bottom action bar ══ */}
            <footer className={styles.footer}>
                <button className={styles.skipBtn} onClick={handleSkip}>Skip Question</button>
                <button className={styles.draftBtn}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
                    </svg>
                    Save Draft
                </button>
                <button
                    className={`${styles.submitBtn} ${submitted ? styles.submitted : ''}`}
                    onClick={handleSubmit}
                    disabled={submitted || transcribeStatus === 'uploading' || transcribeStatus === 'transcribing'}
                >
                    {submitted ? 'Submitted!' : 'Submit Answer'}
                    {!submitted && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                        </svg>
                    )}
                </button>
                <button className={styles.analysisBtn} onClick={() => navigate('/analysis')}>
                    Analysis Performance
                </button>
            </footer>
        </div>
    );
}
