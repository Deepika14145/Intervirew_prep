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
  const [s3Key, setS3Key] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;

    setFile(selectedFile);
    performUpload(selectedFile);
  };

  const handleFileChange = (e) => {
    handleFile(e.target.files[0]);
  };

  const performUpload = async (uploadFile) => {
    setUploading(true);
    setProgress(20);
    setErrorMsg(null);

    try {
      // Create conventional payload via standard Browser Web Standard FormData handling
      const formData = new FormData();
      formData.append("resume", uploadFile);

      // Issue HTTP POST directly to our NodeJS backend avoiding any S3 cross-origin issues
      const res = await fetch("http://localhost:5000/api/s3/upload-resume", {
        method: "POST",
        body: formData, // the browser inherently attaches multipar/form-data rules
      });
      
      const data = await res.json();
      setProgress(60);

      if (!res.ok) {
         throw new Error(`Express Backend Error (${res.status}): ${data.error || JSON.stringify(data)}`);
      }

      setProgress(100);
      setS3Key(data.objectKey);
      console.log("UI Upload securely routed locally and stored in S3 Key via proxy:", data.objectKey);

    } catch(err) {
      console.error("Upload error:", err);
      setProgress(0);
      setErrorMsg(err.message || "Failed to route traffic to local Backend port effectively.");
      alert(`🚨 Local Proxy Upload Failed:\n\n${err.message || err}`);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setProgress(0);
    setUploading(false);
    setErrorMsg(null);
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
                <span>{errorMsg ? "❌ Upload Failed" : progress + "% Complete"}</span>
                <span>{errorMsg ? "Error" : (uploading ? "Uploading..." : "Done")}</span>
              </div>

              {errorMsg && (
                <div style={{color: 'red', marginTop: '10px', fontSize: '0.85rem'}}>
                  {errorMsg}
                </div>
              )}

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%`, backgroundColor: errorMsg ? 'red' : '' }}
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
                onClick={() => navigate("/resume-preview", { state: { s3Key } })}
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