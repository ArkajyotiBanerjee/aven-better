import React, { useRef } from 'react';

export default function UploadSection({
  file,
  onFileChange,
  onProcessLecture,
  onLoadDemo,
  status,
  errorMsg,
  onReset
}) {
  const fileInputRef = useRef(null);

  return (
    <section className="upload-section" aria-labelledby="upload-heading">
      <div className="upload-container">
        <div className="upload-hero">
          <div className="hero-badge">AI For Accessible Education</div>
          <h1 id="upload-heading" className="hero-title">
            Transform Any Lecture Into Accessible Understanding
          </h1>
          <p className="hero-subtitle">
            Upload your lecture video to automatically generate synchronized captions, visual AI concept cards, key formulas, worked examples, and an interactive concept timeline for Deaf and Hard-of-Hearing learners.
          </p>
        </div>

        {/* Upload Card */}
        <div className="upload-card">
          {status === 'idle' && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                className="sr-only"
                id="lecture-file-input"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={onFileChange}
              />

              {!file ? (
                <div 
                  className="dropzone"
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  tabIndex="0"
                  role="button"
                  aria-label="Upload lecture video file (MP4, WebM, MOV)"
                >
                  <div className="dropzone-icon" aria-hidden="true">📁</div>
                  <div className="dropzone-text">
                    <strong>Click to select lecture video</strong>
                    <span>Supports MP4, WebM, MOV</span>
                  </div>
                </div>
              ) : (
                <div className="selected-file-pane">
                  <div className="file-info-row">
                    <span className="file-icon" aria-hidden="true">🎥</span>
                    <div className="file-details">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                    <button 
                      type="button" 
                      className="btn-text-danger" 
                      onClick={onReset}
                      aria-label="Remove selected file"
                    >
                      ✕ Change File
                    </button>
                  </div>

                  <button
                    type="button"
                    className="btn-primary btn-lg process-btn"
                    onClick={onProcessLecture}
                  >
                    🚀 Process Lecture & Generate Insights
                  </button>
                </div>
              )}

              {/* Demo Lecture Quick Load Option */}
              <div className="demo-divider">
                <span>OR TRY WITH READY DEMO</span>
              </div>

              <div className="demo-action-box">
                <button
                  type="button"
                  className="btn-demo"
                  onClick={onLoadDemo}
                >
                  <span className="demo-icon" aria-hidden="true">🔬</span>
                  <div className="demo-text">
                    <strong>Load Demo: Newton's Second Law Lecture</strong>
                    <small>Instant extraction & visualization without waiting</small>
                  </div>
                  <span className="demo-arrow" aria-hidden="true">➔</span>
                </button>
              </div>
            </>
          )}

          {/* Processing States */}
          {(status === 'uploading' || status === 'transcribing' || status === 'extracting') && (
            <div className="processing-container" role="status" aria-live="polite">
              <div className="spinner-wrap">
                <div className="animated-spinner" aria-hidden="true"></div>
              </div>

              <h2 className="processing-title">
                {status === 'uploading' && 'Uploading Lecture Video...'}
                {status === 'transcribing' && 'Transcribing Audio with Whisper...'}
                {status === 'extracting' && 'Understanding Your Lecture with AI...'}
              </h2>

              <p className="processing-desc">
                {status === 'uploading' && 'Streaming video file to server storage.'}
                {status === 'transcribing' && 'Generating high-accuracy timestamped transcript segments.'}
                {status === 'extracting' && 'Extracting key concepts, mathematical formulas, and examples.'}
              </p>

              {/* Stepped progress indicators */}
              <div className="progress-steps">
                <div className={`step-item ${status === 'uploading' ? 'current' : 'completed'}`}>
                  <span className="step-num">1</span>
                  <span className="step-label">Upload Video</span>
                </div>
                <div className={`step-item ${status === 'transcribing' ? 'current' : status === 'extracting' ? 'completed' : 'pending'}`}>
                  <span className="step-num">2</span>
                  <span className="step-label">Whisper Speech-to-Text</span>
                </div>
                <div className={`step-item ${status === 'extracting' ? 'current' : 'pending'}`}>
                  <span className="step-num">3</span>
                  <span className="step-label">AI Educational Extraction</span>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="error-container" role="alert">
              <div className="error-icon" aria-hidden="true">⚠️</div>
              <h2 className="error-title">Processing Failed</h2>
              <p className="error-message">{errorMsg || 'An unexpected error occurred while processing the lecture.'}</p>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={onReset}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
