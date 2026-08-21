import React from 'react';
import { 
  Compass, 
  Eye, 
  Headphones, 
  Brain, 
  Video, 
  CheckSquare, 
  RotateCcw,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

export default function LectureHeader({
  filename,
  onReset,
  onOpenQuiz,
  accessibilityMode = 'deaf',
  onSelectMode,
  onNavigateDashboard
}) {
  // Format readable topic title for DSA benchmark
  const displayTitle = filename?.includes('sliding_window') || filename?.includes('dsa')
    ? 'DSA — Sliding Window Algorithm'
    : (filename || 'Technical Lecture');

  return (
    <header className="lecture-header" role="banner" aria-label="Aven.better Learning Studio Navigation">
      <div className="header-brand-group">
        {onNavigateDashboard && (
          <button
            type="button"
            className="btn-back-dashboard"
            onClick={onNavigateDashboard}
            aria-label="Return to Aven.better dashboard"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            <span>Dashboard</span>
          </button>
        )}

        <div className="header-logo">
          <div className="logo-icon-wrap" aria-hidden="true">
            <Compass size={18} className="logo-icon-svg" />
          </div>
          <div className="header-brand-text">
            <span className="brand-name-main">Aven<span className="brand-name-dot">.</span>better</span>
            <span className="brand-subtag">Learning Studio</span>
          </div>
        </div>

        {/* Multi-Modal Adaptive Learning Mode Selector */}
        <nav className="mode-switcher-nav" aria-label="Multi-modal adaptive presentation modes">
          <div className="mode-tabs-group" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={accessibilityMode === 'deaf'}
              className={`mode-tab-btn ${accessibilityMode === 'deaf' ? 'active-mode' : ''}`}
              onClick={() => onSelectMode && onSelectMode('deaf')}
              aria-label="Switch to Visual Intelligence & Captions mode"
            >
              <Eye size={15} className="tab-icon-svg" aria-hidden="true" />
              <span className="tab-label">Visual Intelligence</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={accessibilityMode === 'blind'}
              className={`mode-tab-btn ${accessibilityMode === 'blind' ? 'active-mode' : ''}`}
              onClick={() => onSelectMode && onSelectMode('blind')}
              aria-label="Switch to Audio-First Studio with spoken math and grounded Q&A"
            >
              <Headphones size={15} className="tab-icon-svg" aria-hidden="true" />
              <span className="tab-label">Audio-First Studio</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={accessibilityMode === 'support'}
              className={`mode-tab-btn ${accessibilityMode === 'support' ? 'active-mode' : ''}`}
              onClick={() => onSelectMode && onSelectMode('support')}
              aria-label="Switch to Cognitive Support step-by-step chunked learning"
            >
              <Brain size={15} className="tab-icon-svg" aria-hidden="true" />
              <span className="tab-label">Cognitive Support</span>
            </button>
          </div>
        </nav>
      </div>

      <div className="header-meta-group">
        <div className="lecture-title-pill" title={`Active lecture benchmark: ${filename || displayTitle}`}>
          <Video size={14} className="file-icon-svg" aria-hidden="true" />
          <span className="file-name">{displayTitle}</span>
        </div>

        {onOpenQuiz && (
          <button
            type="button"
            className="btn-quiz-cta"
            onClick={onOpenQuiz}
            aria-label="Test understanding with adaptive quiz assessment"
          >
            <CheckSquare size={15} aria-hidden="true" />
            <span>Test My Understanding</span>
            <ArrowRight size={13} aria-hidden="true" />
          </button>
        )}

        {onReset && (
          <button 
            type="button"
            onClick={onReset} 
            className="btn-editorial-secondary btn-sm"
            aria-label="Upload or switch to another lecture"
          >
            <RotateCcw size={13} aria-hidden="true" />
            <span>Upload New</span>
          </button>
        )}
      </div>
    </header>
  );
}
