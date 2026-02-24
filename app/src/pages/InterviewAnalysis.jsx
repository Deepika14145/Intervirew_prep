import "./InterviewAnalysis.css";

export default function AnalysisPage() {
  return (
    <div className="page">

      {/* Content */}
      <div className="container">

        {/* Header */}
        <div className="header">
          <div>
            <h2>Post-Interview Analysis</h2>
            <p>Session: Software Engineer Role – July 24, 2024</p>
          </div>

          <div className="header-buttons">
            <button className="btn-outline">Share Report</button>
            <button className="btn-primary">New Mock Interview</button>
          </div>
        </div>

        <div className="grid">

          {/* LEFT */}
          <div className="left">

            {/* Stats */}
            <div className="stats">

              <Stat title="Speaking Speed" value="145" unit="WPM" badge="GOOD"/>
              <Stat title="Filler Words" value="12" unit="um/uhs" badge="AVERAGE"/>
              <Stat title="Long Pauses" value="3" unit="instances" badge="EXCELLENT"/>

              <div className="card center">
                <p className="label">Confidence Score</p>
                <div className="circle">88%</div>
              </div>

            </div>

            {/* Timeline */}
            <div className="card timeline">
              <h3>Speech Timeline</h3>

              <div className="bars">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div
                    key={i}
                    className={`bar ${
                      i % 7 === 0
                        ? "orange"
                        : i % 5 === 0
                        ? "blue"
                        : ""
                    }`}
                  ></div>
                ))}
              </div>
            </div>

            {/* Transcript */}
            <div className="card transcript">
              <h3>Smart Transcript</h3>

              <p>
                Thank you for having me today. I’ve been working as a software
                engineer for about five years now.
                <span className="highlight"> um </span>
                specifically focused on full-stack development.
              </p>

              <p className="active-line">
                One project I’m particularly proud of involved migrating a
                legacy monolith to a microservices architecture. It was
                <span className="highlight"> basically </span>
                a huge challenge.
              </p>

              <div className="player">
                ▶ 01:42 / 04:32
              </div>
            </div>

          </div>

          {/* RIGHT */}
          <div className="right">

            <div className="card nervous">
              <h3>Nervousness Indicator</h3>

              <div className="bars">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className={`bar ${
                      i === 4
                        ? "red"
                        : i % 2 === 0
                        ? "orange"
                        : "green"
                    }`}
                  ></div>
                ))}
              </div>

              <p className="small">
                Detected a spike in heart rate and voice pitch.
              </p>
            </div>

            <div className="card tips">
              <h3>Improvement Tips</h3>

              <Tip title="Pacing is key"/>
              <Tip title="Watch filler words"/>
              <Tip title="Eye Contact"/>

              <button className="btn-outline full">
                View Personalized Roadmap
              </button>
            </div>

            <div className="card progress">
              <h3>Mastery Progress</h3>

              <p>Vocabulary Score</p>

              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>

              <span className="percent">74%</span>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

/* Components */

function Stat({ title, value, unit, badge }) {
  return (
    <div className="card">
      <div className="stat-header">
        <span>{title}</span>
        <span className="badge">{badge}</span>
      </div>

      <h2>
        {value} <small>{unit}</small>
      </h2>
    </div>
  );
}

function Tip({ title }) {
  return (
    <div className="tip">
      <div className="tip-icon"></div>
      <div>
        <p className="tip-title">{title}</p>
        <p className="tip-text">
          Helpful suggestion for improvement.
        </p>
      </div>
    </div>
  );
}