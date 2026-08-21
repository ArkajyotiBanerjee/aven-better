import React from 'react';
import { 
  TrendingUp, 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle,
  Compass
} from 'lucide-react';

export default function ReadinessHero({ readiness, profile, onStartLearning }) {
  if (!readiness || !profile) return null;

  const { overall_score, status, trend, dimensions = [] } = readiness;

  const statusLabel = status.toUpperCase();

  // Deterministically sort dimensions
  const sortedDimensions = dimensions.length > 0 
    ? [...dimensions].sort((a, b) => b.score - a.score)
    : [];

  const strongest = sortedDimensions.length > 0 ? sortedDimensions[0] : null;
  const weakest = sortedDimensions.length > 0 ? sortedDimensions[sortedDimensions.length - 1] : null;

  let narrativeText = '';
  if (strongest && weakest && strongest.score >= 80 && weakest.score < 70) {
    narrativeText = `Foundational theory in ${strongest.name.toLowerCase()} is verified at ${strongest.score.toFixed(0)}% (Grade ${strongest.grade}). However, applying sliding window state transitions to multi-step problem calculations (${weakest.score.toFixed(0)}%) is currently holding back composite readiness.`;
  } else if (overall_score >= 85) {
    narrativeText = `Comprehensive mastery demonstrated across all ${dimensions.length} core technical dimensions. Verified at Career Ready status.`;
  } else if (overall_score >= 70) {
    narrativeText = `Solid comprehension across core technical patterns. Refining sliding window calculation mechanics will advance your index to Career Ready.`;
  } else {
    narrativeText = `Baseline assessment completed. Focus on targeted calculation mechanics to build problem-solving fluency.`;
  }

  return (
    <section className="aven-hero-glass" aria-labelledby="readiness-hero-heading">
      <div className="hero-editorial-grid">
        {/* Left Column: Readiness Index & Editorial Narrative */}
        <div className="hero-main-column">
          <div className="hero-kicker-row">
            <span className="hero-kicker-tag">
              <Compass size={13} className="hero-kicker-icon" aria-hidden="true" />
              <span>COMPETENCY INDEX</span>
            </span>
            <span className={`hero-status-tag status-${status.toLowerCase()}`}>
              {statusLabel}
            </span>
            <span className="hero-trend-tag">
              <TrendingUp size={12} aria-hidden="true" />
              <span>{trend}</span>
            </span>
          </div>

          <div className="hero-score-composition">
            <div className="hero-numeral-block">
              <span className="hero-score-value">{overall_score.toFixed(1)}</span>
              <span className="hero-score-pct">%</span>
            </div>

            <div className="hero-narrative-block">
              <h1 id="readiness-hero-heading" className="hero-editorial-title">
                Technical Readiness Evaluation
              </h1>
              <p className="hero-editorial-narrative">
                {narrativeText}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Integrated Editorial Context Panel */}
        <div className="hero-side-column">
          <div className="editorial-stat-row">
            <div className="stat-label-wrap">
              <BookOpen size={13} aria-hidden="true" className="stat-icon-forest" />
              <span className="editorial-stat-label">Domain Track</span>
            </div>
            <div className="editorial-stat-main">{profile.track}</div>
          </div>

          <div className="editorial-stat-row row-strength">
            <div className="stat-label-wrap">
              <CheckCircle2 size={13} aria-hidden="true" className="stat-icon-forest" />
              <span className="editorial-stat-label label-strong">Verified Strength</span>
            </div>
            <div className="editorial-stat-main">
              {strongest ? `${strongest.name} (${strongest.score.toFixed(0)}%)` : 'Core Concept Recall'}
            </div>
          </div>

          {weakest && weakest.score < 75 && (
            <div className="editorial-stat-row row-bottleneck">
              <div className="stat-label-wrap">
                <AlertTriangle size={13} aria-hidden="true" className="stat-icon-warn" />
                <span className="editorial-stat-label label-bottleneck">Primary Bottleneck</span>
              </div>
              <div className="editorial-stat-main">
                {weakest.name} ({weakest.score.toFixed(0)}%)
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
