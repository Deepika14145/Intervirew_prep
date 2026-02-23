import React, { useState, useRef, useEffect } from 'react';
import styles from './ChatbotWidget.module.css';

const INITIAL_MESSAGES = [
    { id: 1, text: "Hi there! 👋 I'm your IntervAI Assistant.", sender: 'bot' },
    { id: 2, text: "I can help you navigate the platform or give you quick interview tips. What's on your mind?", sender: 'bot' },
];

const QUICK_ACTIONS = [
    { label: "🚀 Start Mock Interview", value: "start_mock" },
    { label: "📄 Resume Feedback", value: "resume_help" },
    { label: "💡 Quick Tips", value: "interview_tips" },
    { label: "⚙️ How it works", value: "how_it_works" }
];

const BOT_RESPONSES = {
    start_mock: "Great choice! Head over to the 'Mock Interviews' tab in the sidebar to configure your session. You can choose your role, difficulty, and focus areas there.",
    resume_help: "You can upload your resume in the 'Resumes' section. Our AI will analyze it against common job descriptions and give you a score!",
    interview_tips: "Quick tip: Always follow the STAR method (Situation, Task, Action, Result) for behavioral questions. It keeps your answers structured and impactful!",
    how_it_works: "IntervAI uses advanced AI to simulate real-world interviews. We provide voice-based interaction, real-time feedback, and performance analytics to help you improve."
};

export default function ChatbotWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState(INITIAL_MESSAGES);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    const handleAction = (action) => {
        const userMsg = { id: Date.now(), text: action.label, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);

        // Simulate bot typing
        setTimeout(() => {
            const botMsg = { 
                id: Date.now() + 1, 
                text: BOT_RESPONSES[action.value] || "I'm not sure about that, but I'm learning every day!", 
                sender: 'bot' 
            };
            setMessages(prev => [...prev, botMsg]);
        }, 600);
    };

    const toggleChat = () => setIsOpen(!isOpen);

    return (
        <div className={styles.container}>
            {/* Chat Window */}
            {isOpen && (
                <div className={styles.window}>
                    <div className={styles.header}>
                        <div className={styles.headerInfo}>
                            <div className={styles.avatar}>AI</div>
                            <div>
                                <h4 className={styles.title}>IntervAI Assistant</h4>
                                <p className={styles.status}>Online • Ready to help</p>
                            </div>
                        </div>
                        <button onClick={toggleChat} className={styles.closeBtn}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>

                    <div className={styles.messagesContainer}>
                        {messages.map((msg) => (
                            <div key={msg.id} className={`${styles.message} ${styles[msg.sender]}`}>
                                <div className={styles.bubble}>{msg.text}</div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className={styles.footer}>
                        <p className={styles.footerLabel}>Quick Actions</p>
                        <div className={styles.actionsGrid}>
                            {QUICK_ACTIONS.map((action) => (
                                <button 
                                    key={action.value} 
                                    className={styles.actionBtn}
                                    onClick={() => handleAction(action)}
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Toggle Button */}
            <button 
                className={`${styles.toggle} ${isOpen ? styles.active : ''}`} 
                onClick={toggleChat}
                aria-label="Toggle Chatbot"
            >
                {isOpen ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                )}
            </button>
        </div>
    );
}
