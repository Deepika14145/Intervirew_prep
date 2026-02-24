import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './InterviewSession.module.css';

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

const TOTAL_TIME = 165; // seconds per question (default ~3 min)

/* ── Circular timer SVG ── */
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
                {/* Track */}
                <circle cx="30" cy="30" r={radius} fill="none" stroke="var(--color-border)" strokeWidth="4" />
                {/* Progress */}
                <circle
                    cx="30" cy="30" r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="4"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - progress}
                    strokeLinecap="round"
                    transform="rotate(-90 30 30)"
                    style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease' }}
                />
            </svg>
            <span className={styles.timerText} style={{ color }}>
                {mins}:{secs}
            </span>
        </div>
    );
}

/* ── Speaking bars animation ── */
function SpeakingBars() {
    return (
        <div className={styles.speakingBars}>
            {[1, 2, 3, 4, 5].map((i) => (
                <span
                    key={i}
                    className={styles.bar}
                    style={{ animationDelay: `${i * 0.1}s` }}
                />
            ))}
        </div>
    );
}

/* ── Session Progress dots ── */
function SessionProgress({ total, current }) {
    return (
        <div className={styles.progressDots}>
            {Array.from({ length: total }).map((_, i) => (
                <span
                    key={i}
                    className={`${styles.dot} ${i < current ? styles.dotDone : ''} ${i === current ? styles.dotCurrent : ''}`}
                />
            ))}
        </div>
    );
}

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

    const recognitionRef = useRef(null);
    const timerRef = useRef(null);
    const recordingTimerRef = useRef(null);

    const currentQ = QUESTIONS[questionIdx];

    /* ── Countdown timer ── */
    useEffect(() => {
        setTimeLeft(TOTAL_TIME);
        setIsInterviewerSpeaking(true);
        const speakTimeout = setTimeout(() => setIsInterviewerSpeaking(false), 2500);
        return () => clearTimeout(speakTimeout);
    }, [questionIdx]);

    useEffect(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft((t) => {
                if (t <= 1) { clearInterval(timerRef.current); return 0; }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [questionIdx]);

    /* ── Recording timer ── */
    useEffect(() => {
        if (isRecording) {
            recordingTimerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
        } else {
            clearInterval(recordingTimerRef.current);
            setRecordingTime(0);
        }
        return () => clearInterval(recordingTimerRef.current);
    }, [isRecording]);

    /* ── Space-bar toggle mic ── */
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

    /* ── Web Speech API ── */
    const toggleMic = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            // Graceful fallback in unsupported browsers
            setIsRecording((r) => !r);
            return;
        }

        if (isRecording) {
            recognitionRef.current?.stop();
            setIsRecording(false);
        } else {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            recognitionRef.current = recognition;

            recognition.onresult = (event) => {
                let transcript = '';
                for (let i = 0; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                setResponse(transcript);
            };
            recognition.onerror = () => setIsRecording(false);
            recognition.onend = () => setIsRecording(false);
            recognition.start();
            setIsRecording(true);
        }
    };

    const handleSubmit = () => {
        setSubmitted(true);
        clearInterval(timerRef.current);
        if (questionIdx < QUESTIONS.length - 1) {
            setTimeout(() => {
                setResponse('');
                setSubmitted(false);
                setQuestionIdx((i) => i + 1);
            }, 600);
        } else {
            setTimeout(() => navigate('/results'), 800);
        }
    };

    const handleSkip = () => {
        setResponse('');
        setSubmitted(false);
        if (questionIdx < QUESTIONS.length - 1) setQuestionIdx((i) => i + 1);
    };

    const formatRecTime = (s) =>
        `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    return (
        <div className={styles.page}>
            {/* ══ Top bar (no sidebar in session) ══ */}
            <header className={styles.topbar}>
                {/* Logo */}
                <div className={styles.logoArea}>
                    <span className={styles.logoIcon}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                    </span>
                    <span className={styles.logoText}>IntervAI</span>
                    <span className={styles.proBadge}>PRO</span>
                </div>

                {/* Progress */}
                <div className={styles.progressArea}>
                    <span className={styles.progressLabel}>SESSION PROGRESS</span>
                    <SessionProgress total={QUESTIONS.length} current={questionIdx} />
                </div>

                {/* Exit */}
                <button className={styles.exitBtn} onClick={() => navigate('/mock-interviews')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Exit Interview
                </button>
            </header>

            {/* ══ Main split layout ══ */}
            <div className={styles.body}>
                {/* ── Left: AI Interviewer Panel ── */}
                <aside className={styles.leftPanel} key={questionIdx}>
                    {/* Interviewer card */}
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
                                {isInterviewerSpeaking ? (
                                    <div className={styles.speakingRow}>
                                        <SpeakingBars />
                                        <span className={styles.speakingLabel}>SPEAKING...</span>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        {/* Category chip */}
                        <div className={styles.categoryChip}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                            </svg>
                            {currentQ.category}
                        </div>

                        {/* Question */}
                        <div className={styles.questionBlock}>
                            <p className={styles.questionText}>{currentQ.question}</p>
                        </div>
                    </div>

                    {/* Hint card */}
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

                {/* ── Right: Response Panel ── */}
                <section className={styles.rightPanel}>
                    {/* Response header */}
                    <div className={styles.responseHeader}>
                        <div className={styles.responseTitle}>
                            <div className={styles.userInitial}>U</div>
                            <div>
                                <div className={styles.responseLabel}>Your Response</div>
                                {isRecording && (
                                    <div className={styles.transcriptionLabel}>Transcription active</div>
                                )}
                            </div>
                        </div>
                        <CircularTimer seconds={timeLeft} total={TOTAL_TIME} />
                    </div>

                    {/* Textarea */}
                    <div className={styles.textareaWrap}>
                        <textarea
                            className={styles.textarea}
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                            placeholder="Start typing your answer here, or click the mic to record your voice response…"
                        />
                    </div>

                    {/* Voice recording bar */}
                    <div className={`${styles.voiceBar} ${isRecording ? styles.voiceBarActive : ''}`}>
                        <button
                            className={`${styles.micBtn} ${isRecording ? styles.micBtnActive : ''}`}
                            onClick={toggleMic}
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
                            <button className={styles.discardBtn} onClick={() => { setIsRecording(false); setResponse(''); }} aria-label="Discard recording">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
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
                    disabled={submitted}
                >
                    {submitted ? 'Submitted!' : 'Submit Answer'}
                    {!submitted && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                        </svg>
                    )}
                </button>
                 {/* NEW BUTTON */}
                <button
                  className={styles.analysisBtn}
                  onClick={() => navigate("/analysis")}
                >
                Analysis Performance
                </button>
            </footer>
        </div>
    );
}
