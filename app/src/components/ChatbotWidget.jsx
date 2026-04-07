import { useState, useRef, useEffect } from 'react';
import styles from './ChatbotWidget.module.css';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const INITIAL_MESSAGES = [
  { id: 1, text: "Hi there! 👋 I'm your IntervAI Assistant.", sender: 'bot' },
  { id: 2, text: "I can help you start a mock interview, get resume feedback, or share interview tips. What's on your mind?", sender: 'bot' },
];

const QUICK_ACTIONS = [
  { label: '🚀 Start Mock Interview', value: 'start_mock' },
  { label: '📄 Resume Feedback', value: 'resume_feedback' },
  { label: '💡 Interview Tips', value: 'interview_tips' },
  { label: '⚙️ How it works', value: 'how_it_works' },
];

const QUICK_RESPONSES = {
  start_mock: [
    "🚀 Ready to practice? Here's how to start a mock interview:",
    "1. Click 'Mock Interviews' in the sidebar\n2. Choose your target role (Frontend, Backend, Full Stack, etc.)\n3. Select your experience level and time limit\n4. Hit 'Start Interview Session' — the AI will ask you 5 real interview questions!\n\nYou can answer by typing or using the 🎤 mic button. Good luck! 💪",
  ],
  resume_feedback: [
    "📄 Here's how to get AI feedback on your resume:",
    "1. Click 'Resume Analyzer' in the sidebar\n2. Select your target role and optionally paste a job description\n3. Upload your PDF resume (up to 15MB)\n4. Click 'Analyze Resume' — our AI will give you:\n   • ATS score\n   • Strengths & weaknesses\n   • Job fit verdict\n   • Suggestions to improve your fit\n\nWant to upload your resume now? Head to the Resume Analyzer! 📊",
  ],
  interview_tips: [
    "💡 Here are my top interview tips to help you land the role:",
    "✅ Use the STAR method for behavioral questions (Situation, Task, Action, Result)\n✅ Research the company before the interview — know their products and culture\n✅ Practice out loud, not just in your head — use IntervAI's mock interviews!\n✅ Ask thoughtful questions at the end — it shows genuine interest\n✅ For technical rounds: think out loud, explain your reasoning\n✅ Follow up with a thank-you email within 24 hours\n\nWant role-specific tips? Ask me about a specific role! 🎯",
  ],
  how_it_works: [
    "⚙️ Here's how IntervAI works:",
    "IntervAI is your AI-powered interview coach. Here's what you can do:\n\n🎤 Mock Interviews — Practice with 5 role-specific questions, answer by voice or text, get AI scores on relevance, fluency & confidence\n\n📄 Resume Analyzer — Upload your resume and get ATS score, job fit analysis, and improvement suggestions\n\n🧑‍💼 HR Interview — Practice 10 behavioral questions used by real HR teams\n\n📊 Performance — Track your scores and progress over time\n\n💡 Career Advice — Get role roadmaps, salary insights, and curated resources\n\nReady to start? Try a mock interview! 🚀",
  ],
};

const generateSessionId = () => `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(generateSessionId);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isOpen]);
  useEffect(() => { if (isOpen) setTimeout(() => inputRef.current?.focus(), 150); }, [isOpen]);

  const handleQuickAction = (value) => {
    const responses = QUICK_RESPONSES[value];
    if (!responses) return;
    const userLabel = QUICK_ACTIONS.find(a => a.value === value)?.label || value;
    setMessages(prev => [...prev, { id: Date.now(), text: userLabel, sender: 'user' }]);
    responses.forEach((txt, i) => {
      setTimeout(() => setMessages(prev => [...prev, { id: Date.now() + i + 1, text: txt, sender: 'bot' }]), i * 300);
    });
  };

  const sendToLex = async (text) => {
    if (!text.trim() || isLoading) return;
    setMessages(prev => [...prev, { id: Date.now(), text, sender: 'user' }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000); // 2 min timeout

      const res = await fetch(`${BACKEND}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ message: text, sessionId }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = await res.json();
      const botMessages = data.messages ?? ["I didn't understand that. Could you try again?"];
      botMessages.forEach((txt, i) => {
        setTimeout(() => setMessages(prev => [...prev, { id: Date.now() + i + 1, text: txt, sender: 'bot' }]), i * 200);
      });
    } catch (err) {
      const msg = err.name === 'AbortError'
        ? "Response took too long. The AI might be busy — please try again."
        : "I'm having trouble connecting right now. Please try again!";
      setMessages(prev => [...prev, { id: Date.now() + 1, text: msg, sender: 'bot' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {isOpen && (
        <div className={styles.window}>
          <div className={styles.header}>
            <div className={styles.headerInfo}>
              <div className={styles.avatar}>AI</div>
              <div>
                <h4 className={styles.title}>IntervAI Assistant</h4>
                <p className={styles.status}>{isLoading ? 'Thinking…' : 'Online • Ready to help'}</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>✕</button>
          </div>

          <div className={styles.messagesContainer}>
            {messages.map(msg => (
              <div key={msg.id} className={`${styles.message} ${styles[msg.sender]}`}>
                <div className={styles.bubble}>{msg.text}</div>
              </div>
            ))}
            {isLoading && (
              <div className={`${styles.message} ${styles.bot}`}>
                <div className={`${styles.bubble} ${styles.typing}`}><span /><span /><span /></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className={styles.footer}>
            <div className={styles.inputRow}>
              <input
                ref={inputRef}
                className={styles.input}
                type="text"
                placeholder="Ask me anything…"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendToLex(inputValue); } }}
                disabled={isLoading}
              />
              <button className={styles.sendBtn} onClick={() => sendToLex(inputValue)} disabled={!inputValue.trim() || isLoading}>➤</button>
            </div>
            <p className={styles.footerLabel}>Quick Actions</p>
            <div className={styles.actionsGrid}>
              {QUICK_ACTIONS.map(action => (
                <button key={action.value} className={styles.actionBtn} onClick={() => handleQuickAction(action.value)} disabled={isLoading}>
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <button className={`${styles.toggle} ${isOpen ? styles.active : ''}`} onClick={() => setIsOpen(o => !o)} aria-label="Toggle Chatbot">
        {isOpen ? '✕' : '💬'}
      </button>
    </div>
  );
}
