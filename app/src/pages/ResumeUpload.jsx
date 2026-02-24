import React, { useRef, useState } from "react";
import "./ResumeUpload.css";
import Sidebar from "../components/Sidebar";

export default function ResumeUpload() {
  const fileInputRef = useRef();

  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Handle file select
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    simulateUpload(selectedFile);
  };

  // Simulate upload progress (replace with API later)
  const simulateUpload = (file) => {
    setUploading(true);
    setProgress(0);

    let percent = 0;

    const interval = setInterval(() => {
      percent += Math.random() * 15;

      if (percent >= 100) {
        percent = 100;
        clearInterval(interval);
        setUploading(false);
      }

      setProgress(Math.floor(percent));
    }, 300);
  };

  const removeFile = () => {
    setFile(null);
    setProgress(0);
    setUploading(false);
  };

  const openFileBrowser = () => {
    fileInputRef.current.click();
  };

  return (<>
    <Sidebar/>
    <div className="upload-page">


      {/* Title */}
      <div className="title-section">
        <h1>Optimize Your Interview Prep</h1>
        <p>
          Upload your resume and our AI will tailor the practice sessions
          to your unique professional experience.
        </p>
      </div>

      {/* Upload Card */}
      <div className="upload-card fade-in">

        {/* Hidden Input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden-input"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
        />

        {/* Drop Zone */}
        <div className="drop-zone" onClick={openFileBrowser}>
          <div className="upload-icon">⬆</div>

          <h3>Drag and drop your resume here</h3>
          <p>Upload your Resume (PDF, DOCX up to 5MB)</p>

          <button
            className="browse-btn"
            onClick={openFileBrowser}
            type="button"
          >
            Browse Files
          </button>
        </div>

        {/* File Info */}
        {file && (
          <div className="file-box">

            <div className="file-info">
              <div className="file-icon">📄</div>

              <div>
                <p className="file-name">{file.name}</p>
                <small>
                  {(file.size / 1024 / 1024).toFixed(2)} MB •{" "}
                  {uploading ? "Uploading..." : "Completed"}
                </small>
              </div>
            </div>

            <span className="close" onClick={removeFile}>✕</span>

            <div className="progress-section">
              <span>{progress}% Complete</span>
              <span className="time">
                {uploading ? "Uploading..." : "Done"}
              </span>
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

          </div>
        )}

        {/* Footer */}
        <div className="footer">
          <span className="secure">
            🔒 Your data is encrypted and secure
          </span>

          <div className="actions">
            <button className="back">Back</button>
            <button
              className="continue"
              disabled={!file || uploading}
            >
              Continue
            </button>
          </div>
        </div>

      </div>
    </div>
    </>
  );
}