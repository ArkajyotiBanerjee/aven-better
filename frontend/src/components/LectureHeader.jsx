import React from 'react';

export default function LectureHeader({ filename, onReset, activeCategoryCount }) {
  return (
    <header className="lecture-header" role="banner">
      <div className="header-brand-group">
        <div className="header-logo">
          <span className="logo-icon" aria-hidden="true">⚡</span>
          <span className="logo-text">AccessLearn</span>
        </div>
        <div className="mode-badge" role="status" aria-label="Current Mode: Deaf and Hard of Hearing Mode">
          <span className="mode-icon" aria-hidden="true">🦻</span>
          <span className="mode-label">Deaf / Hard-of-Hearing Mode</span>
        </div>
      </div>

      <div className="header-meta-group">
        {filename && (
          <div className="lecture-title-pill" title={`Active lecture: ${filename}`}>
            <span className="file-icon" aria-hidden="true">📹</span>
            <span className="file-name">{filename}</span>
          </div>
        )}
        {onReset && (
          <button 
            onClick={onReset} 
            className="btn-secondary btn-sm"
            aria-label="Upload or switch to another lecture"
          >
            <span aria-hidden="true">⟲</span> Upload New Lecture
          </button>
        )}
      </div>
    </header>
  );
}
