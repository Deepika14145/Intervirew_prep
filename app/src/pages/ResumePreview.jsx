import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import "./ResumePreview.css";

pdfjs.GlobalWorkerOptions.workerSrc =
  `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

export default function ResumePreview() {
  const location = useLocation();
  const navigate = useNavigate();

  const file = location.state?.file;

  const [numPages, setNumPages] = useState(null);

  if (!file) {
    return <div>No file found</div>;
  }

  const fileURL = URL.createObjectURL(file);

  return (
    <div className="preview-page">

      <div className="preview-header">
        <h2>Resume Preview</h2>

        <div className="actions">
          <button className="back" onClick={() => navigate(-1)}>
            Back
          </button>

          <button className="continue">
            Confirm & Continue
          </button>
        </div>
      </div>

      <div className="pdf-container">

        <Document
          file={fileURL}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        >
          {Array.from(new Array(numPages), (el, index) => (
            <Page
              key={index}
              pageNumber={index + 1}
              width={800}
            />
          ))}
        </Document>

      </div>
    </div>
  );
}