import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './CareerAdvice.module.css';

const ROLES = ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'DevOps Engineer', 'Data Scientist', 'Product Manager', 'System Design Architect', 'iOS / Android Developer'];

const ROADMAPS = {
  'Frontend Developer': {
    steps: ['HTML & CSS Fundamentals', 'JavaScript (ES6+)', 'React / Vue / Angular', 'State Management', 'Testing (Jest, RTL)', 'Performance & Accessibility', 'CI/CD & Deployment'],
    resources: [
      { type: 'Course', title: 'The Odin Project', url: 'https://www.theodinproject.com', tag: 'Free' },
      { type: 'Course', title: 'Frontend Masters', url: 'https://frontendmasters.com', tag: 'Paid' },
      { type: 'Docs', title: 'MDN Web Docs', url: 'https://developer.mozilla.org', tag: 'Free' },
      { type: 'Practice', title: 'CSS Battles', url: 'https://cssbattle.dev', tag: 'Free' },
    ],
    salary: { junior: '$65k–$85k', mid: '$90k–$120k', senior: '$130k–$160k' },
  },
  'Backend Developer': {
    steps: ['Programming Language (Node/Python/Java)', 'REST & GraphQL APIs', 'Databases (SQL + NoSQL)', 'Authentication & Security', 'Caching (Redis)', 'Message Queues', 'System Design Basics'],
    resources: [
      { type: 'Course', title: 'Node.js — The Complete Guide', url: 'https://udemy.com', tag: 'Paid' },
      { type: 'Docs', title: 'PostgreSQL Docs', url: 'https://postgresql.org/docs', tag: 'Free' },
      { type: 'Practice', title: 'LeetCode', url: 'https://leetcode.com', tag: 'Free' },
      { type: 'Article', title: 'roadmap.sh/backend', url: 'https://roadmap.sh/backend', tag: 'Free' },
    ],
    salary: { junior: '$70k–$90k', mid: '$95k–$130k', senior: '$140k–$175k' },
  },
  'Full Stack Developer': {
    steps: ['HTML/CSS/JS', 'React or Vue', 'Node.js + Express', 'Databases', 'REST APIs', 'Auth & Security', 'Cloud Deployment'],
    resources: [
      { type: 'Course', title: 'Full Stack Open', url: 'https://fullstackopen.com', tag: 'Free' },
      { type: 'Practice', title: 'LeetCode', url: 'https://leetcode.com', tag: 'Free' },
      { type: 'Article', title: 'roadmap.sh/full-stack', url: 'https://roadmap.sh/full-stack', tag: 'Free' },
      { type: 'Course', title: 'Scrimba React', url: 'https://scrimba.com', tag: 'Free' },
    ],
    salary: { junior: '$70k–$95k', mid: '$100k–$135k', senior: '$145k–$180k' },
  },
  'DevOps Engineer': {
    steps: ['Linux & Bash', 'Git & CI/CD', 'Docker & Containers', 'Kubernetes', 'Cloud (AWS/GCP/Azure)', 'Infrastructure as Code', 'Monitoring & Observability'],
    resources: [
      { type: 'Course', title: 'KodeKloud DevOps', url: 'https://kodekloud.com', tag: 'Paid' },
      { type: 'Docs', title: 'Kubernetes Docs', url: 'https://kubernetes.io/docs', tag: 'Free' },
      { type: 'Article', title: 'roadmap.sh/devops', url: 'https://roadmap.sh/devops', tag: 'Free' },
      { type: 'Practice', title: 'Play with Docker', url: 'https://labs.play-with-docker.com', tag: 'Free' },
    ],
    salary: { junior: '$75k–$95k', mid: '$105k–$140k', senior: '$150k–$190k' },
  },
  'Data Scientist': {
    steps: ['Python & Statistics', 'Data Wrangling (Pandas)', 'Machine Learning (Scikit-learn)', 'Deep Learning (PyTorch/TF)', 'SQL & Data Pipelines', 'Model Deployment', 'A/B Testing & Experimentation'],
    resources: [
      { type: 'Course', title: 'fast.ai', url: 'https://fast.ai', tag: 'Free' },
      { type: 'Practice', title: 'Kaggle', url: 'https://kaggle.com', tag: 'Free' },
      { type: 'Course', title: 'Coursera ML Specialization', url: 'https://coursera.org', tag: 'Paid' },
      { type: 'Docs', title: 'Scikit-learn Docs', url: 'https://scikit-learn.org', tag: 'Free' },
    ],
    salary: { junior: '$80k–$100k', mid: '$110k–$145k', senior: '$155k–$200k' },
  },
  'Product Manager': {
    steps: ['Product Thinking & Strategy', 'User Research & Personas', 'Roadmapping & Prioritization', 'Metrics & Analytics', 'Agile & Scrum', 'Stakeholder Communication', 'Go-to-Market Strategy'],
    resources: [
      { type: 'Book', title: 'Inspired by Marty Cagan', url: 'https://svpg.com/inspired', tag: 'Paid' },
      { type: 'Course', title: 'Product School', url: 'https://productschool.com', tag: 'Paid' },
      { type: 'Article', title: 'Lenny\'s Newsletter', url: 'https://lennysnewsletter.com', tag: 'Free' },
      { type: 'Practice', title: 'PM Exercises', url: 'https://pmexercises.com', tag: 'Free' },
    ],
    salary: { junior: '$85k–$105k', mid: '$115k–$150k', senior: '$160k–$210k' },
  },
  'System Design Architect': {
    steps: ['Distributed Systems Basics', 'CAP Theorem & Consistency', 'Load Balancing & Caching', 'Database Design', 'API Design', 'Microservices Patterns', 'Security & Compliance'],
    resources: [
      { type: 'Book', title: 'Designing Data-Intensive Apps', url: 'https://dataintensive.net', tag: 'Paid' },
      { type: 'Course', title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer', tag: 'Free' },
      { type: 'Practice', title: 'Excalidraw', url: 'https://excalidraw.com', tag: 'Free' },
      { type: 'Article', title: 'High Scalability Blog', url: 'http://highscalability.com', tag: 'Free' },
    ],
    salary: { junior: '$100k–$130k', mid: '$140k–$180k', senior: '$190k–$250k' },
  },
  'iOS / Android Developer': {
    steps: ['Swift / Kotlin Basics', 'UI Frameworks (SwiftUI/Jetpack)', 'Networking & APIs', 'Local Storage & Databases', 'Push Notifications', 'App Store Deployment', 'Performance Profiling'],
    resources: [
      { type: 'Docs', title: 'Apple Developer Docs', url: 'https://developer.apple.com', tag: 'Free' },
      { type: 'Docs', title: 'Android Developers', url: 'https://developer.android.com', tag: 'Free' },
      { type: 'Course', title: '100 Days of SwiftUI', url: 'https://www.hackingwithswift.com', tag: 'Free' },
      { type: 'Practice', title: 'Advent of Code', url: 'https://adventofcode.com', tag: 'Free' },
    ],
    salary: { junior: '$75k–$95k', mid: '$100k–$135k', senior: '$145k–$185k' },
  },
};

const TIPS = [
  { level: 'Beginner', icon: '🌱', tips: ['Build 2–3 portfolio projects before applying', 'Contribute to open source to get real-world experience', 'Learn Git and version control early', 'Focus on fundamentals before frameworks'] },
  { level: 'Intermediate', icon: '🚀', tips: ['Practice system design questions weekly', 'Mock interview with peers or tools like IntervAI', 'Write about what you learn — blog or LinkedIn', 'Target companies that match your growth goals'] },
  { level: 'Senior', icon: '🏆', tips: ['Lead a project end-to-end to show ownership', 'Mentor junior developers to build leadership skills', 'Study architecture patterns and trade-offs deeply', 'Negotiate — senior roles often have 20–30% salary room'] },
];

export default function CareerAdvice() {
  const [selectedRole, setSelectedRole] = useState('Full Stack Developer');
  const navigate = useNavigate();
  const roadmap = ROADMAPS[selectedRole];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1>Career Advice</h1>
        <p>Personalised role roadmaps, curated resources, and AI-powered career guidance.</p>
      </div>

      {/* Role selector */}
      <div className={styles.roleBar}>
        {ROLES.map(r => (
          <button key={r} className={`${styles.roleChip} ${selectedRole === r ? styles.roleChipActive : ''}`} onClick={() => setSelectedRole(r)}>{r}</button>
        ))}
      </div>

      <div className={styles.grid}>
        {/* Left column */}
        <div className={styles.left}>
          {/* Roadmap */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>🗺️</span>
              <h2>Learning Roadmap</h2>
            </div>
            <div className={styles.roadmapSteps}>
              {roadmap.steps.map((step, i) => (
                <div key={i} className={styles.step}>
                  <div className={styles.stepNum}>{i + 1}</div>
                  <div className={styles.stepLine} />
                  <span className={styles.stepLabel}>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>📚</span>
              <h2>Curated Resources</h2>
            </div>
            <div className={styles.resourcesList}>
              {roadmap.resources.map((r, i) => (
                <a key={i} href={r.url} target="_blank" rel="noreferrer" className={styles.resourceItem}>
                  <div className={styles.resourceLeft}>
                    <span className={styles.resourceType}>{r.type}</span>
                    <span className={styles.resourceTitle}>{r.title}</span>
                  </div>
                  <span className={`${styles.resourceTag} ${r.tag === 'Free' ? styles.tagFree : styles.tagPaid}`}>{r.tag}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className={styles.right}>
          {/* Salary widget */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>💰</span>
              <h2>Salary Insights</h2>
            </div>
            <p className={styles.salaryRole}>{selectedRole} — US Market</p>
            {[['Junior', roadmap.salary.junior, '#16a34a'], ['Mid-Level', roadmap.salary.mid, '#2f5cff'], ['Senior', roadmap.salary.senior, '#7c3aed']].map(([lvl, range, color]) => (
              <div key={lvl} className={styles.salaryRow}>
                <span className={styles.salaryLevel} style={{ color }}>{lvl}</span>
                <span className={styles.salaryRange}>{range}</span>
              </div>
            ))}
            <p className={styles.salaryNote}>* Estimates based on market data. Varies by location and company.</p>
          </div>

          {/* Interview tips */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>💡</span>
              <h2>Interview Tips</h2>
            </div>
            {TIPS.map(({ level, icon, tips }) => (
              <div key={level} className={styles.tipGroup}>
                <div className={styles.tipLevel}>{icon} {level}</div>
                <ul className={styles.tipList}>
                  {tips.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className={styles.ctaCard}>
            <div className={styles.ctaIcon}>🎯</div>
            <h3>Ready to practice?</h3>
            <p>Start a mock interview tailored to {selectedRole} and get AI feedback on your answers.</p>
            <button className={styles.ctaBtn} onClick={() => navigate('/mock-interviews')}>Start Mock Interview →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
