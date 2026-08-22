import React, { useRef, useState, useEffect } from 'react';
import { 
  Sparkles, 
  UploadCloud, 
  Video, 
  ArrowRight, 
  FlaskConical, 
  CheckCircle2, 
  Loader2, 
  AlertCircle,
  Eye,
  Headphones,
  Brain
} from 'lucide-react';

const ROTATING_MESSAGES = [
  "Good things take a few seconds. Great transcripts take a little longer.",
  "Your video is doing the talking. We're taking notes.",
  "Meanwhile, your career is still loading.",
  "Making sense of the lecture. Unlike some lectures.",
  "Almost there. This is the productive kind of waiting.",
  "The transcript is assembling itself. Very patiently.",
  "Processing now. Regretting that 4-hour lecture later is optional.",
  "Turning spoken words into something future-you can actually use.",
  "Your placement prep called. It wants this transcript.",
  "Parsing the lecture so you don't have to replay it three times.",
  "Somewhere between upload and understanding.",
  "Letting Whisper do the tedious part.",
  "Still processing. At least this loading screen has a purpose.",
  "Extracting the useful bits. There are usually more than expected.",
  "Your future self appreciates the structured notes."
];

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
  const [messageIndex, setMessageIndex] = useState(0);
  const [fadeState, setFadeState] = useState(true);

  const isProcessing = status === 'uploading' || status === 'transcribing' || status === 'extracting';

  // Rotate micro-messages every ~5 seconds during processing
  useEffect(() => {
    if (!isProcessing) return;

    const interval = setInterval(() => {
      setFadeState(false);
      const timer = setTimeout(() => {
        setMessageIndex((prev) => {
          let next;
          do {
            next = Math.floor(Math.random() * ROTATING_MESSAGES.length);
          } while (next === prev && ROTATING_MESSAGES.length > 1);
          return next;
        });
        setFadeState(true);
      }, 200);

      return () => clearTimeout(timer);
    }, 5000);

    return () => clearInterval(interval);
  }, [isProcessing]);

  return (
    <section className="upload-section" aria-labelledby="upload-heading">
      <div className="upload-container">
        <div className="upload-hero">
          <div className="hero-badge">
            <Sparkles size={14} className="hero-badge-icon" aria-hidden="true" />
            <span>CareerOS Multi-Modal Learning Studio</span>
          </div>

          <h1 id="upload-heading" className="hero-title">
            Transform Technical Lectures Into Deep Understanding
          </h1>

          <p className="hero-subtitle">
            Upload any technical or placement video to automatically generate accessible learning pathways, step-by-step conceptual breakdowns, adaptive quizzes, and diagnostic remediation.
          </p>

          {/* 3 Core Accessibility Pathways */}
          <div className="hero-pathways-grid" role="list" aria-label="Supported accessibility pathways">
            <div className="pathway-item" role="listitem">
              <div className="pathway-icon-wrap icon-deaf" aria-hidden="true">
                <Eye size={18} />
              </div>
              <div className="pathway-text">
                <strong>Visual Learning</strong>
                <span>Captions, AI cards & timeline</span>
              </div>
            </div>

            <div className="pathway-item" role="listitem">
              <div className="pathway-icon-wrap icon-blind" aria-hidden="true">
                <Headphones size={18} />
              </div>
              <div className="pathway-text">
                <strong>Audio-First Lesson</strong>
                <span>Spoken math & grounded Q&A</span>
              </div>
            </div>

            <div className="pathway-item" role="listitem">
              <div className="pathway-icon-wrap icon-support" aria-hidden="true">
                <Brain size={18} />
              </div>
              <div className="pathway-text">
                <strong>Learning Support</strong>
                <span>Step-by-step & read aloud</span>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Card */}
        <div className="upload-card">
          {/* Active Processing States */}
          {isProcessing ? (
            <div className="processing-container" role="status" aria-live="polite">
              <div className="spinner-wrap">
                <Loader2 size={36} className="animated-spinner" aria-hidden="true" />
              </div>

              <h2 className="processing-title">
                {status === 'uploading' && 'Uploading Lecture Video...'}
                {status === 'transcribing' && 'Transcribing Audio with Whisper...'}
                {status === 'extracting' && 'Understanding Your Lecture with AI...'}
              </h2>

              <p className={`processing-desc ${fadeState ? 'fade-in' : 'fade-out'}`}>
                {status === 'uploading'
                  ? 'Streaming video file to server storage.'
                  : status === 'transcribing'
                  ? ROTATING_MESSAGES[messageIndex]
                  : 'Extracting key concepts, mathematical formulas, and examples.'}
              </p>

              {/* Stepped progress indicators */}
              <div className="progress-steps">
                <div className={`step-item ${status === 'uploading' ? 'current' : 'completed'}`}>
                  <span className="step-num">
                    {status !== 'uploading' ? <CheckCircle2 size={16} /> : '1'}
                  </span>
                  <span className="step-label">Upload Video</span>
                </div>
                <div className={`step-item ${status === 'transcribing' ? 'current' : status === 'extracting' ? 'completed' : 'pending'}`}>
                  <span className="step-num">
                    {status === 'extracting' ? <CheckCircle2 size={16} /> : '2'}
                  </span>
                  <span className="step-label">Whisper STT</span>
                </div>
                <div className={`step-item ${status === 'extracting' ? 'current' : 'pending'}`}>
                  <span className="step-num">3</span>
                  <span className="step-label">AI Extraction</span>
                </div>
              </div>
            </div>
          ) : status === 'error' ? (
            /* Error State */
            <div className="error-container" role="alert">
              <div className="error-icon" aria-hidden="true">
                <AlertCircle size={32} />
              </div>
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
          ) : (
            /* Default Ready / File Dropzone State (renders on 'idle', 'success', or any fresh navigation) */
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
                  <div className="dropzone-icon-wrap" aria-hidden="true">
                    <UploadCloud size={38} className="dropzone-icon" />
                  </div>
                  <div className="dropzone-text">
                    <strong>Click to select lecture video</strong>
                    <span>Supports MP4, WebM, MOV</span>
                  </div>
                </div>
              ) : (
                <div className="selected-file-pane">
                  <div className="file-info-row">
                    <span className="file-icon-wrap" aria-hidden="true">
                      <Video size={24} />
                    </span>
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
                    <Sparkles size={18} aria-hidden="true" />
                    <span>Process Lecture & Generate Understanding</span>
                  </button>
                </div>
              )}

              {/* Demo Lecture Quick Load Option */}
              <div className="demo-divider">
                <span>OR EXPLORE INSTANTLY</span>
              </div>

              <div className="demo-action-box">
                <button
                  type="button"
                  className="btn-demo"
                  onClick={onLoadDemo}
                >
                  <span className="demo-icon-wrap" aria-hidden="true">
                    <FlaskConical size={22} />
                  </span>
                  <div className="demo-text">
                    <strong>Load Demo: Sliding Window Algorithm (DSA Benchmark)</strong>
                    <small>Pre-extracted multi-modal experience ready for demo</small>
                  </div>
                  <ArrowRight size={18} className="demo-arrow" aria-hidden="true" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
