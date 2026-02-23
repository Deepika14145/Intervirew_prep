import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.css';

// Mock Data for Dashboard
const mockData = {
    user: {
        name: 'Alex Rivera',
        role: 'Frontend Developer',
        level: 'Mid-Level',
        readinessScore: 78,
    },
    stats: {
        interviewsCompleted: 12,
        technicalScore: 82,
        communicationScore: 75,
        confidenceScore: 68,
    },
    recentInterviews: [
        { id: 101, role: 'React Developer', date: 'Oct 12, 2026', score: 85, status: 'Completed' },
        { id: 102, role: 'Frontend Engineer', date: 'Oct 05, 2026', score: 72, status: 'Completed' },
        { id: 103, role: 'UI/UX Developer', date: 'Sep 28, 2026', score: 65, status: 'Needs Polish' },
    ],
    topicAnalysis: [
        { topic: 'React Fundamentals', progress: 90 },
        { topic: 'System Design', progress: 55 },
        { topic: 'Data Structures', progress: 70 },
        { topic: 'Behavioral', progress: 85 },
    ]
};

export default function Dashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Simulate a network fetch for the dashboard data
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    // Skeleton Renderers
    if (isLoading) {
        return (
            <div className={styles.dashboardContainer}>
                {/* Skeleton Banner */}
                <div className={`${styles.banner} ${styles.skeletonBanner}`}>
                    <div className={styles.bannerInfo}>
                        <div className="u-skeleton" style={{ height: '32px', width: '200px', marginBottom: 'var(--sp-2)' }}></div>
                        <div className="u-skeleton" style={{ height: '20px', width: '300px' }}></div>
                    </div>
                    <div className="u-skeleton" style={{ height: '120px', width: '120px', borderRadius: '50%' }}></div>
                </div>

                {/* Skeleton Stats */}
                <div className={styles.statsGrid}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`u-card ${styles.statCard}`}>
                            <div className="u-skeleton" style={{ height: '20px', width: '120px', marginBottom: 'var(--sp-4)' }}></div>
                            <div className="u-skeleton" style={{ height: '40px', width: '60px' }}></div>
                        </div>
                    ))}
                </div>

                <div className={styles.mainGrid}>
                    {/* Skeleton Recent Interviews */}
                    <div className={`u-card ${styles.gridSpan2}`}>
                        <div className="u-skeleton" style={{ height: '24px', width: '150px', marginBottom: 'var(--sp-5)' }}></div>
                        {[1, 2, 3].map(i => (
                            <div key={i} className="u-skeleton" style={{ height: '48px', width: '100%', marginBottom: 'var(--sp-3)' }}></div>
                        ))}
                    </div>

                    {/* Skeleton Topics */}
                    <div className={`u-card ${styles.gridSpan1}`}>
                        <div className="u-skeleton" style={{ height: '24px', width: '150px', marginBottom: 'var(--sp-5)' }}></div>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className={styles.topicItem}>
                                <div className="u-skeleton" style={{ height: '16px', width: '80%' }}></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`${styles.dashboardContainer} u-page-enter`}>
            {/* Welcome Banner */}
            <div className={styles.banner}>
                <div className={styles.bannerContent}>
                    <div className={styles.bannerInfo}>
                        <h1 className="u-heading-1">Welcome back, {mockData.user.name.split(' ')[0]} 👋</h1>
                        <p className={styles.bannerSubtext}>
                            Preparing for: <strong>{mockData.user.level} {mockData.user.role}</strong>
                        </p>
                        <div className={styles.quickActions}>
                            <button
                                className={styles.primaryBtn}
                                onClick={() => navigate('/mock-interviews')}
                            >
                                Start Mock Interview
                            </button>
                            <button
                                className={styles.secondaryBtn}
                                onClick={() => navigate('/resumes')}
                            >
                                Analyze Resume
                            </button>
                        </div>
                    </div>
                </div>

                {/* Top-level Readiness Donut visualization */}
                <div className={styles.readinessWidget}>
                    <div className={styles.donutPlaceholder}>
                        <svg viewBox="0 0 36 36" className={styles.circularChart}>
                            <path className={styles.circleBg}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path className={styles.circle}
                                strokeDasharray={`${mockData.user.readinessScore}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <text x="18" y="18" dominantBaseline="central" className={styles.percentage}>{mockData.user.readinessScore}%</text>
                        </svg>
                    </div>
                    <div className={styles.readinessText}>
                        <span className={styles.readinessLabel}>Overall Readiness</span>
                        <span className={styles.readinessSubtext}>Target: 80%</span>
                    </div>
                </div>
            </div>

            {/* KPI Stats Grid */}
            <div className={styles.statsGrid}>
                <div className={`u-card ${styles.statCard}`}>
                    <div className={styles.statIcon}>📝</div>
                    <div className={styles.statContent}>
                        <div className={styles.statLabel}>Interviews Completed</div>
                        <div className={styles.statValue}>{mockData.stats.interviewsCompleted}</div>
                    </div>
                </div>
                <div className={`u-card ${styles.statCard}`}>
                    <div className={styles.statIcon}>💻</div>
                    <div className={styles.statContent}>
                        <div className={styles.statLabel}>Technical Score</div>
                        <div className={styles.statValue}>{mockData.stats.technicalScore}%</div>
                    </div>
                </div>
                <div className={`u-card ${styles.statCard}`}>
                    <div className={styles.statIcon}>🗣️</div>
                    <div className={styles.statContent}>
                        <div className={styles.statLabel}>Communication</div>
                        <div className={styles.statValue}>{mockData.stats.communicationScore}%</div>
                    </div>
                </div>
                <div className={`u-card ${styles.statCard}`}>
                    <div className={styles.statIcon}>🎯</div>
                    <div className={styles.statContent}>
                        <div className={styles.statLabel}>Confidence</div>
                        <div className={styles.statValue}>{mockData.stats.confidenceScore}%</div>
                    </div>
                </div>
            </div>

            <div className={styles.mainGrid}>
                {/* Recent Interviews Table */}
                <div className={`u-card ${styles.gridSpan2}`}>
                    <div className={styles.cardHeader}>
                        <h2 className="u-label">Recent Interviews</h2>
                        <button className={styles.textBtn} onClick={() => navigate('/performance')}>View All</button>
                    </div>

                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Role & Level</th>
                                    <th>Date</th>
                                    <th>Overall Score</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mockData.recentInterviews.map((interview) => (
                                    <tr key={interview.id}>
                                        <td className={styles.primaryCell}>{interview.role}</td>
                                        <td className="u-muted">{interview.date}</td>
                                        <td>
                                            <span className={`${styles.scorePill} ${interview.score >= 80 ? styles.scoreHigh : interview.score >= 70 ? styles.scoreMed : styles.scoreLow}`}>
                                                {interview.score}%
                                            </span>
                                        </td>
                                        <td>
                                            <span className={interview.status === 'Completed' ? 'u-chip u-chip--success' : 'u-chip u-chip--warning'}>
                                                {interview.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button className={styles.textBtn}>View Feedback</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Topic Analysis */}
                <div className={`u-card ${styles.gridSpan1}`}>
                    <div className={styles.cardHeader}>
                        <h2 className="u-label">Topic Analysis</h2>
                    </div>
                    <div className={styles.topicsList}>
                        {mockData.topicAnalysis.map((topic, index) => (
                            <div key={index} className={styles.topicItem}>
                                <div className={styles.topicHeader}>
                                    <span className={styles.topicName}>{topic.topic}</span>
                                    <span className={styles.topicScore}>{topic.progress}%</span>
                                </div>
                                <div className={styles.progressBarBg}>
                                    <div
                                        className={`${styles.progressBarFill} ${topic.progress >= 80 ? styles.bgSuccess :
                                            topic.progress >= 60 ? styles.bgWarning : styles.bgDanger
                                            }`}
                                        style={{ width: `${topic.progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
