import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import "./AnalysisPage.css";

export default function AnalysisPage() {
  const location = useLocation();

  const question =
    location.state?.question ||
    "How would you handle race conditions in a high-concurrency environment?";

  const answer =
    location.state?.answer ||
    "In a high concurrency scenario like a flash sale, I would prioritize data consistency...";

  return (
    <motion.div
      className="analysis-page"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* HEADER */}
      <div className="header">
        <h1>Detailed Analysis</h1>
        <p>Review your performance and explore AI-suggested improvements.</p>
      </div>

      <div className="grid">

        {/* LEFT */}
        <motion.div
          className="left"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.15 } },
          }}
        >
          {/* QUESTION */}
          <Card className="question-card">
            <span className="label">QUESTION</span>
            <h3>{question}</h3>
          </Card>

          {/* YOUR ANSWER — IMPROVED */}
          <Card className="answer-card">
            <div className="card-header">
              <div className="answer-user">
                <div className="user-avatar">U</div>
                <div>
                  <span>Your Answer</span>
                  <small>Recorded 12:45 PM</small>
                </div>
              </div>
            </div>

            <p className="answer-text">{answer}</p>
          </Card>

          {/* AI SUMMARY — IMPROVED */}
          <Card className="ai-summary">
            <div className="summary-header">
              <span className="summary-icon">✨</span>
              <h4>AI Evaluation Summary</h4>
            </div>

            <ul>
              <li>
                <strong>Strong Start:</strong> You identified the need for
                consistency correctly.
              </li>

              <li>
                <strong>Depth Needed:</strong> Redis usage was mentioned but not
                explained fully.
              </li>

              <li>
                <strong>Recommendation:</strong> Mention locking strategies like
                optimistic vs pessimistic.
              </li>
            </ul>
          </Card>
        </motion.div>

        {/* RIGHT SIDE SAME AS BEFORE */}
        <div className="right">
          <ScoreCard />
          <BreakdownCard />
          <MissingCard />
        </div>
      </div>

      <AISuggested />
    </motion.div>
  );
}

/* ---------- COMPONENTS ---------- */

function Card({ children, className = "", center }) {
  return (
    <motion.div
      className={`card ${className} ${center ? "center" : ""}`}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 200 }}
    >
      {children}
    </motion.div>
  );
}

/* SCORE */
function ScoreCard() {
  return (
    <Card center>
      <p className="score-title">Overall Performance</p>

      <motion.div
        className="score-ring"
        initial={{ background: "conic-gradient(#2f5cff 0%, #e6e9f2 0%)" }}
        animate={{
          background: "conic-gradient(#2f5cff 78%, #e6e9f2 78%)",
        }}
        transition={{ duration: 1.5 }}
      >
        <div className="score-inner">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
            className="score-number"
          >
            7.8
          </motion.span>
          <small>/10</small>
        </div>
      </motion.div>

      <p className="score-text">
        Above average. Good foundational knowledge.
      </p>
    </Card>
  );
}

/* BREAKDOWN */
function BreakdownCard() {
  return (
    <Card>
      <h4>Performance Breakdown</h4>
      <Progress label="Relevance" value={85} />
      <Progress label="Structure" value={72} />
      <Progress label="Technical Accuracy" value={68} />
    </Card>
  );
}

/* MISSING */
function MissingCard() {
  return (
    <Card>
      <h4>Missing Concepts</h4>
      <div className="tags">
        <span>Optimistic Locking</span>
        <span>Distributed Locks</span>
        <span>Idempotency</span>
        <span>Deadlock Prevention</span>
      </div>
    </Card>
  );
}

/* PROGRESS */
function Progress({ label, value }) {
  return (
    <div className="progress">
      <div className="progress-top">
        <span>{label}</span>
        <span>{value}%</span>
      </div>

      <div className="progress-bar">
        <motion.div
          className="progress-fill"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1 }}
          style={{ transformOrigin: "left", width: `${value}%` }}
        />
      </div>
    </div>
  );
}

/* AI SUGGESTED */
function AISuggested() {
  return (
    <motion.div
      className="ai-section"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="ai-header">
        <h3>AI Suggested Improved Answer</h3>
        <button className="btn-primary">Practice Again</button>
      </div>

      <p className="ai-text">
        To handle race conditions during a flash sale, I would implement a
        multi-layered approach including optimistic concurrency control,
        distributed locking via Redis, and idempotent APIs...
      </p>

      <div className="improvements">
        <div>Added locking mechanisms</div>
        <div>Introduced idempotency</div>
        <div>Structured layered response</div>
      </div>
    </motion.div>
  );
}