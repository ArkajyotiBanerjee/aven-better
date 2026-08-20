import React from 'react';
import { 
  Zap, 
  Eye, 
  Headphones, 
  Brain, 
  Video, 
  CheckSquare, 
  RotateCcw 
} from 'lucide-react';

export default function LectureHeader({
  filename,
  onReset,
  onOpenQuiz,
  accessibilityMode = 'deaf',
  onSelectMode
}) {
  return (
    <header className="lecture-header" role="banner">
      <div className="header-brand-group">
        <div className="header-logo">
          <div className="logo-icon-wrap" aria-hidden="true">
            <Zap size={20} className="logo-icon-svg" />
          </div>
          <span className="logo-text">AccessLearn</span>
        </div>

        {/* Accessibility Mode Switcher Tabs (Segmented Control) */}
        <nav className="mode-switcher-nav" aria-label="Accessibility learning mode selection">
          <div className="mode-tabs-group" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={accessibilityMode === 'deaf'}
              className={`mode-tab-btn ${accessibilityMode === 'deaf' ? 'active-mode' : ''}`}
              onClick={() => onSelectMode && onSelectMode('deaf')}
              aria-label="Switch to Deaf and Hard-of-Hearing visual learning mode"
            >
              <Eye size={16} className="tab-icon-svg" aria-hidden="true" />
              <span className="tab-label">Deaf / Hard-of-Hearing</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={accessibilityMode === 'blind'}
              className={`mode-tab-btn ${accessibilityMode === 'blind' ? 'active-mode' : ''}`}
              onClick={() => onSelectMode && onSelectMode('blind')}
              aria-label="Switch to Blind and Visually-Impaired audio-first learning mode"
            >
              <Headphones size={16} className="tab-icon-svg" aria-hidden="true" />
              <span className="tab-label">Blind / Visually-Impaired</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={accessibilityMode === 'support'}
              className={`mode-tab-btn ${accessibilityMode === 'support' ? 'active-mode' : ''}`}
              onClick={() => onSelectMode && onSelectMode('support')}
              aria-label="Switch to Learning Support simplified step-by-step learning mode"
            >
              <Brain size={16} className="tab-icon-svg" aria-hidden="true" />
              <span className="tab-label">Learning Support</span>
            </button>
          </div>
        </nav>
      </div>

      <div className="header-meta-group">
        {filename && (
          <div className="lecture-title-pill" title={`Active lecture: ${filename}`}>
            <Video size={15} className="file-icon-svg" aria-hidden="true" />
            <span className="file-name">{filename}</span>
          </div>
        )}

        {onOpenQuiz && (
          <button
            type="button"
            className="btn-quiz-cta"
            onClick={onOpenQuiz}
            aria-label="Test understanding with adaptive quiz"
          >
            <CheckSquare size={16} aria-hidden="true" />
            <span>Test My Understanding</span>
          </button>
        )}

        {onReset && (
          <button 
            onClick={onReset} 
            className="btn-secondary btn-sm"
            aria-label="Upload or switch to another lecture"
          >
            <RotateCcw size={14} aria-hidden="true" />
            <span>Upload New</span>
          </button>
        )}
      </div>
    </header>
  );
}
