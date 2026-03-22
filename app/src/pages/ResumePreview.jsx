import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ResumePreview.css";

export default function ResumePreview() {
  const location = useLocation();
  const navigate = useNavigate();

  const s3Key = location.state?.s3Key;
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    if (!s3Key) return;
    
    // Dynamically fetch the direct S3 file read-URL from backend
    fetch("http://localhost:5000/api/s3/generate-read-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ objectKey: s3Key })
    })
    .then((res) => res.json())
    .then((data) => {
      if (data.readUrl) {
        setPdfUrl(data.readUrl);
      }
    })
    .catch((err) => console.error("Could not fetch S3 URL:", err));
  }, [s3Key]);

  if (!s3Key) {
    return <div>No resume uploaded to AWS S3. Return to upload page.</div>;
  }

  return (
    <div className="preview-page">

      <div className="preview-header">
        <h2>AWS S3 Resume Render</h2>

        <div className="actions">
          <button className="back" onClick={() => navigate(-1)}>
            Back
          </button>

          <button className="continue" onClick={() => navigate('/mock-interviews')}>
            Confirm & Continue
          </button>
        </div>
      </div>

      <div className="pdf-container" style={{height: "80vh", width: "100%"}}>
        {pdfUrl ? (
            <iframe 
                src={pdfUrl} 
                title="S3 Resume Preview" 
                width="100%" 
                height="100%" 
                style={{border: "none"}}
            />
        ) : (
            <p>Fetching encrypted resume token from S3 backend...</p>
        )}
      </div>
    </div>
  );
}