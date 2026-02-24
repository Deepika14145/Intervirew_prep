import React, { useRef, useState } from "react";
import "./ResumeUpload.css";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
export default function ResumeUpload() {
  const fileInputRef = useRef();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;

    setFile(selectedFile);
    simulateUpload();
  };

  const handleFileChange = (e) => {
    handleFile(e.target.files[0]);
  };

  const simulateUpload = () => {
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

  return (
    <>
      <Sidebar />

      <div className="upload-page">

        {/* Title */}
        <div className="title-section">
          <h1>Optimize Your Interview Prep</h1>
          <p>
            Upload your resume and our AI will tailor practice sessions
            to your professional experience.
          </p>
        </div>

        {/* Upload Card */}
        <div className="upload-card">

          <input
            type="file"
            ref={fileInputRef}
            className="hidden-input"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
          />

          {/* Drop Zone */}
          <div
            className={`drop-zone ${dragging ? "dragging" : ""}`}
            onClick={openFileBrowser}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFile(e.dataTransfer.files[0]);
            }}
          >
            <div className="upload-icon">📤</div>

            <h3>Drag & Drop your resume</h3>
            <p>PDF, DOC, DOCX up to 5MB</p>

            <button
              className="choose-btn"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openFileBrowser();
              }}
            >
              Choose File
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

              <span className="remove" onClick={removeFile}>✕</span>

              <div className="progress-section">
                <span>{progress}% Complete</span>
                <span>{uploading ? "Uploading..." : "Done"}</span>
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
            <span className="secure">🔒 Your data is secure</span>

            <div className="actions">
              <button className="back">Back</button>
              <button
                className="continue"
                disabled={!file || uploading}
                onClick={() => navigate("/resume-preview", { state: { file } })}
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