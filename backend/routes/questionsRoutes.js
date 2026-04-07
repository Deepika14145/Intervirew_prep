const express = require("express");
const verifyToken = require("../middleware/authMiddleware");
const router = express.Router();

const QUESTION_BANK = {
  'HR Interview': [
    { id: 1,  category: 'Behavioral', question: 'Tell me about yourself and your professional journey so far.', hint: 'Keep it concise — 2 mins max. Cover education, key roles, and what brings you here.' },
    { id: 2,  category: 'Behavioral', question: 'Describe a time you faced a significant challenge at work. How did you handle it?', hint: 'Use the STAR method. Focus on your actions and the outcome.' },
    { id: 3,  category: 'Behavioral', question: 'Tell me about a time you worked in a team where there was conflict. How did you resolve it?', hint: 'Show empathy, communication skills, and a focus on team goals over personal ego.' },
    { id: 4,  category: 'Behavioral', question: 'Give an example of a time you showed leadership, even without a formal title.', hint: 'Think about taking initiative, mentoring, or driving a project forward.' },
    { id: 5,  category: 'Behavioral', question: 'Describe a situation where you had to meet a tight deadline. What did you do?', hint: 'Cover prioritization, communication with stakeholders, and how you delivered.' },
    { id: 6,  category: 'Behavioral', question: 'Tell me about a time you failed. What did you learn from it?', hint: 'Be honest. Show self-awareness and what you changed as a result.' },
    { id: 7,  category: 'Behavioral', question: 'How do you handle receiving critical feedback from a manager or peer?', hint: 'Show openness, a growth mindset, and give a concrete example if possible.' },
    { id: 8,  category: 'Behavioral', question: 'Describe a time you had to adapt quickly to a major change at work.', hint: 'Cover how you stayed productive, supported your team, and embraced the change.' },
    { id: 9,  category: 'Behavioral', question: 'Tell me about a time you went above and beyond what was expected of you.', hint: 'Show initiative and impact. Quantify the result if you can.' },
    { id: 10, category: 'Behavioral', question: 'Where do you see yourself in 5 years, and how does this role fit into that vision?', hint: 'Align your goals with the company. Show ambition balanced with commitment.' },
  ],
  'Frontend Developer': [
    { id: 1, category: 'Technical: Frontend', question: 'How would you optimize a React application experiencing slow renders on a data-heavy dashboard? Walk me through your debugging and optimization process.', hint: 'Think about React.memo, useMemo, useCallback, virtualization (react-window), and code splitting.' },
    { id: 2, category: 'Technical: CSS', question: 'Explain the CSS box model and how you would implement a responsive grid layout without a framework.', hint: 'Cover margin, border, padding, content. Mention CSS Grid and Flexbox differences.' },
    { id: 3, category: 'Behavioral', question: 'Tell me about a time you improved the performance of a frontend application. What metrics did you use to measure success?', hint: 'Use the STAR method. Mention Lighthouse scores, Core Web Vitals, or bundle size.' },
    { id: 4, category: 'Technical: JavaScript', question: 'Explain the event loop in JavaScript and how async/await differs from raw Promises.', hint: 'Cover call stack, task queue, microtask queue. Mention error handling differences.' },
    { id: 5, category: 'Situational', question: 'A critical UI bug was reported in production 30 minutes before a major demo. How do you handle it?', hint: 'Focus on triage, stakeholder communication, hotfix vs rollback, and post-mortem.' },
  ],
  'Backend Developer': [
    { id: 1, category: 'Technical: APIs', question: 'Design a RESTful API for a user authentication system. What endpoints, status codes, and security measures would you include?', hint: 'Cover JWT, refresh tokens, rate limiting, HTTPS, and proper HTTP status codes.' },
    { id: 2, category: 'Technical: Databases', question: 'When would you choose a NoSQL database over a relational database? Give a concrete example.', hint: 'Discuss schema flexibility, horizontal scaling, CAP theorem, and use cases like DynamoDB vs PostgreSQL.' },
    { id: 3, category: 'Behavioral', question: 'Describe a time you had to optimize a slow database query. What was your approach?', hint: 'Mention EXPLAIN plans, indexing strategies, query restructuring, and caching.' },
    { id: 4, category: 'Technical: System Design', question: 'How would you design a rate limiter for a public API that handles 10,000 requests per second?', hint: 'Cover token bucket vs sliding window algorithms, Redis-based implementations, and distributed considerations.' },
    { id: 5, category: 'Situational', question: 'Your service is returning 500 errors in production. Walk me through your debugging process.', hint: 'Cover log analysis, error tracking tools, rollback strategy, and root cause analysis.' },
  ],
  'Full Stack Developer': [
    { id: 1, category: 'Technical: Architecture', question: 'How would you architect a full-stack application that needs to scale to 1 million users?', hint: 'Cover CDN, load balancing, database sharding, caching layers, and microservices vs monolith.' },
    { id: 2, category: 'Technical: Frontend', question: 'How do you manage state in a large React application? Compare Redux, Zustand, and React Context.', hint: 'Discuss performance implications, boilerplate, and when each is appropriate.' },
    { id: 3, category: 'Technical: Backend', question: 'Explain the difference between authentication and authorization. How would you implement both in a Node.js app?', hint: 'Cover JWT, OAuth, RBAC, middleware patterns, and session management.' },
    { id: 4, category: 'Behavioral', question: 'Tell me about a full-stack feature you built end-to-end. What were the biggest technical challenges?', hint: 'Use STAR method. Highlight cross-cutting concerns like data consistency and error handling.' },
    { id: 5, category: 'Situational', question: 'A feature you shipped is causing a memory leak in production. How do you identify and fix it?', hint: 'Cover heap snapshots, Chrome DevTools, Node.js memory profiling, and prevention strategies.' },
  ],
  'DevOps Engineer': [
    { id: 1, category: 'Technical: CI/CD', question: 'Design a CI/CD pipeline for a microservices application deployed on Kubernetes.', hint: 'Cover build, test, security scan, staging deploy, canary release, and rollback stages.' },
    { id: 2, category: 'Technical: Infrastructure', question: 'Explain the difference between horizontal and vertical scaling. When would you use each?', hint: 'Discuss stateless vs stateful services, cost implications, and auto-scaling strategies.' },
    { id: 3, category: 'Technical: Monitoring', question: 'How would you set up observability for a distributed system? What metrics, logs, and traces would you collect?', hint: 'Cover the three pillars of observability, tools like Prometheus/Grafana, and alerting strategies.' },
    { id: 4, category: 'Behavioral', question: 'Describe a major incident you handled. How did you manage the response and what did you learn?', hint: 'Cover incident timeline, communication, mitigation steps, and post-mortem process.' },
    { id: 5, category: 'Situational', question: 'Your Kubernetes cluster is running out of resources during peak traffic. What do you do?', hint: 'Cover HPA, VPA, cluster autoscaler, resource requests/limits, and cost optimization.' },
  ],
  'Data Scientist': [
    { id: 1, category: 'Technical: ML', question: 'Explain the bias-variance tradeoff and how you would address overfitting in a model.', hint: 'Cover regularization (L1/L2), cross-validation, dropout, and ensemble methods.' },
    { id: 2, category: 'Technical: Statistics', question: 'How would you design an A/B test for a new recommendation algorithm? What statistical considerations matter?', hint: 'Cover sample size, statistical power, p-values, multiple testing correction, and practical significance.' },
    { id: 3, category: 'Technical: Data', question: 'Walk me through how you would handle missing data in a dataset before training a model.', hint: 'Cover imputation strategies, MCAR/MAR/MNAR, and when to drop vs impute.' },
    { id: 4, category: 'Behavioral', question: 'Tell me about a model you built that had unexpected results. How did you investigate and resolve it?', hint: 'Use STAR method. Highlight data quality issues, feature engineering, and model debugging.' },
    { id: 5, category: 'Situational', question: 'A stakeholder wants a 95% accurate model by next week. How do you respond?', hint: 'Cover expectation setting, baseline metrics, feasibility assessment, and iterative delivery.' },
  ],
  'System Design Architect': [
    { id: 1, category: 'Technical: System Design', question: 'Design a highly available notification service handling push, email, and SMS at 10M messages/day.', hint: 'Cover message queues, fan-out patterns, retry logic, and provider failure handling.' },
    { id: 2, category: 'Technical: Architecture', question: 'What strategies ensure backward compatibility when evolving a public REST API with thousands of consumers?', hint: 'Cover URL versioning, header versioning, deprecation policies, and semantic versioning.' },
    { id: 3, category: 'Technical: Distributed Systems', question: 'Explain the CAP theorem and how it influences your database selection for a globally distributed app.', hint: 'Cover consistency vs availability tradeoffs, eventual consistency, and real-world examples.' },
    { id: 4, category: 'Behavioral', question: 'Describe a system you designed that needed to be refactored. What drove the decision and how did you manage it?', hint: 'Cover technical debt assessment, migration strategy, and stakeholder communication.' },
    { id: 5, category: 'Situational', question: 'Your monolith is struggling under load. How do you decide what to extract into microservices first?', hint: 'Cover domain boundaries, strangler fig pattern, data ownership, and incremental migration.' },
  ],
  'Product Manager': [
    { id: 1, category: 'Product Strategy', question: 'How would you prioritize a backlog of 50 features with limited engineering resources?', hint: 'Cover RICE, ICE, MoSCoW frameworks, stakeholder alignment, and data-driven decisions.' },
    { id: 2, category: 'Metrics', question: 'What metrics would you use to measure the success of a new onboarding flow?', hint: 'Cover activation rate, time-to-value, drop-off points, retention, and NPS.' },
    { id: 3, category: 'Behavioral', question: 'Tell me about a product decision you made with incomplete data. How did you handle the uncertainty?', hint: 'Use STAR method. Highlight hypothesis-driven thinking and how you validated assumptions.' },
    { id: 4, category: 'Technical', question: 'How do you work effectively with engineers who push back on your feature requests?', hint: 'Cover technical empathy, trade-off discussions, and collaborative problem-solving.' },
    { id: 5, category: 'Situational', question: 'A key metric dropped 20% overnight. Walk me through how you investigate and respond.', hint: 'Cover data validation, segmentation analysis, hypothesis generation, and stakeholder communication.' },
  ],
  'iOS / Android Developer': [
    { id: 1, category: 'Technical: Mobile', question: 'Explain the activity/fragment lifecycle in Android (or UIViewController lifecycle in iOS) and common pitfalls.', hint: 'Cover state restoration, memory leaks from context references, and background task handling.' },
    { id: 2, category: 'Technical: Performance', question: 'How would you optimize a mobile app that is consuming too much battery and memory?', hint: 'Cover background processing, image caching, lazy loading, and profiling tools.' },
    { id: 3, category: 'Technical: Architecture', question: 'Compare MVVM and MVC for mobile development. When would you choose each?', hint: 'Cover testability, data binding, separation of concerns, and team familiarity.' },
    { id: 4, category: 'Behavioral', question: 'Describe a challenging mobile-specific bug you fixed. What made it hard to diagnose?', hint: 'Use STAR method. Highlight device fragmentation, OS version differences, or threading issues.' },
    { id: 5, category: 'Situational', question: 'Your app is crashing for 5% of users on a specific device. How do you debug it without owning that device?', hint: 'Cover crash reporting tools, remote logging, device emulation, and beta testing programs.' },
  ],
};

// GET /api/questions?role=Frontend+Developer
router.get("/", verifyToken, (req, res) => {
  const role = req.query.role || 'Full Stack Developer';
  const questions = QUESTION_BANK[role] || QUESTION_BANK['Full Stack Developer'];
  res.json({ role, questions });
});

// GET /api/questions/roles
router.get("/roles", verifyToken, (req, res) => {
  res.json({ roles: Object.keys(QUESTION_BANK) });
});

module.exports = router;
