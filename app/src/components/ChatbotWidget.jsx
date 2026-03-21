import React, { useState, useRef, useEffect } from 'react';
import styles from './ChatbotWidget.module.css';

// ── Replace this with your real API Gateway URL after deploying the Lambda
const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL || '';

const INITIAL_MESSAGES = [
    { id: 1, text: "Hi there! 👋 I'm your IntervAI Assistant.", sender: 'bot' },
    { id: 2, text: "I can help you start a mock interview, get resume feedback, or share interview tips. What's on your mind?", sender: 'bot' },
];

const QUICK_ACTIONS = [
    { label: "🚀 Start Mock Interview", value: "Start a mock interview" },
    { label: "📄 Resume Feedback",      value: "Help with my resume"    },
    { label: "💡 Interview Tips",       value: "Give me interview tips"  },
    { label: "⚙️ How it works",         value: "How does this work"      },
];

// Generate a stable session ID per widget mount
const generateSessionId = () =>
    `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export default function ChatbotWidget() {
    const [isOpen,      setIsOpen]      = useState(false);
    const [messages,    setMessages]    = useState(INITIAL_MESSAGES);
    const [inputValue,  setInputValue]  = useState('');
    const [isLoading,   setIsLoading]   = useState(false);
    const [sessionId]                   = useState(generateSessionId);

    const messagesEndRef = useRef(null);
    const inputRef       = useRef(null);

    const scrollToBottom = () =>
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    useEffect(() => { if (isOpen) scrollToBottom(); }, [messages, isOpen]);

    // Focus input when the chat window opens
    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 150);
    }, [isOpen]);

    // ── Core send function — calls Lex via Lambda
    const sendToLex = async (text) => {
        if (!text.trim() || isLoading) return;

        // Append user message immediately
        const userMsg = { id: Date.now(), text, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        if (!CHAT_API_URL) {
            // Graceful fallback while API URL is not yet set
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: Date.now() + 1,
                    text: '⚙️ Chat API not connected yet. Set VITE_CHAT_API_URL in your .env file.',
                    sender: 'bot',
                }]);
                setIsLoading(false);
            }, 400);
            return;
        }

        try {
            const res = await fetch(CHAT_API_URL, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ message: text, sessionId }),
            });

            const data = await res.json();
            const botMessages = data.messages ?? ["I didn't understand that. Could you try again?"];

            // Add each Lex message as a separate bubble
            botMessages.forEach((txt, i) => {
                setTimeout(() => {
                    setMessages(prev => [...prev, {
                        id: Date.now() + i + 1,
                        text: txt,
                        sender: 'bot',
                    }]);
                }, i * 200); // slight stagger for multiple bubbles
            });
        } catch (err) {
            console.error('Chat error:', err);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: "I'm having trouble connecting right now. Please try again!",
                sender: 'bot',
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickAction = (action) => sendToLex(action.value);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendToLex(inputValue);
        }
    };

    return (
        <div className={styles.container}>
            {isOpen && (
                <div className={styles.window}>
                    {/* ── Header */}
                    <div className={styles.header}>
                        <div className={styles.headerInfo}>
                            <div className={styles.avatar}>AI</div>
                            <div>
                                <h4 className={styles.title}>IntervAI Assistant</h4>
                                <p className={styles.status}>
                                    {isLoading ? 'Thinking…' : 'Online • Ready to help'}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2.5"
                                strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6"  x2="6"  y2="18" />
                                <line x1="6"  y1="6"  x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    {/* ── Messages */}
                    <div className={styles.messagesContainer}>
                        {messages.map((msg) => (
                            <div key={msg.id} className={`${styles.message} ${styles[msg.sender]}`}>
                                <div className={styles.bubble}>{msg.text}</div>
                            </div>
                        ))}

                        {/* Typing indicator */}
                        {isLoading && (
                            <div className={`${styles.message} ${styles.bot}`}>
                                <div className={`${styles.bubble} ${styles.typing}`}>
                                    <span /><span /><span />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* ── Footer: Input + Quick Actions */}
                    <div className={styles.footer}>
                        {/* Text input row */}
                        <div className={styles.inputRow}>
                            <input
                                ref={inputRef}
                                className={styles.input}
                                type="text"
                                placeholder="Ask me anything…"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isLoading}
                                aria-label="Chat input"
                            />
                            <button
                                className={styles.sendBtn}
                                onClick={() => sendToLex(inputValue)}
                                disabled={!inputValue.trim() || isLoading}
                                aria-label="Send message"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2.5"
                                    strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13" />
                                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                </svg>
                            </button>
                        </div>

                        {/* Quick action chips */}
                        <p className={styles.footerLabel}>Quick Actions</p>
                        <div className={styles.actionsGrid}>
                            {QUICK_ACTIONS.map((action) => (
                                <button
                                    key={action.value}
                                    className={styles.actionBtn}
                                    onClick={() => handleQuickAction(action)}
                                    disabled={isLoading}
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Floating toggle */}
            <button
                className={`${styles.toggle} ${isOpen ? styles.active : ''}`}
                onClick={() => setIsOpen(o => !o)}
                aria-label="Toggle Chatbot"
            >
                {isOpen ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5"
                        strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5"
                        strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                )}
            </button>
        </div>
    );
}
