import React from 'react';
import { 
  Brain, 
  Binary, 
  Target, 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

function getDimensionIcon(name) {
  const lower = name.toLowerCase();
  if (lower.includes('concept')) {
    return <Brain size={18} aria-hidden="true" />;
  } else if (lower.includes('formula') || lower.includes('recall')) {
    return <Binary size={18} aria-hidden="true" />;
  } else if (lower.includes('application') || lower.includes('problem')) {
    return <Target size={18} aria-hidden="true" />;
  } else {
    return <BookOpen size={18} aria-hidden="true" />;
  }
}

export default function ReadinessDimensions({ dimensions = [] }) {
  if (!dimensions || dimensions.length === 0) return null;

  return (
    <section className="dimensions-section" aria-labelledby="dimensions-heading">
      <div className="section-header-row">
        <div>
          <h2 id="dimensions-heading" className="dashboard-section-title">
            Competency Dimensions
          </h2>
          <p className="dashboard-section-subtitle">
            Granular breakdown of foundational knowledge, equation recall, and calculation execution.
          </p>
        </div>
      </div>

      <div className="dimensions-grid">
        {dimensions.map((dim, idx) => {
          const isMastered = dim.score >= 85;
          const isProficient = dim.score >= 70;
          const isGap = dim.score < 60;

          const dimStatusClass = isMastered
            ? 'dim-mastered'
            : isProficient
            ? 'dim-proficient'
            : isGap
            ? 'dim-gap'
            : 'dim-developing';

          return (
            <article key={idx} className={`dimension-card ${dimStatusClass}`}>
              <div className="dim-card-header">
                <div className="dim-icon-wrap">
                  {getDimensionIcon(dim.name)}
                </div>
                <div className="dim-grade-badge">
                  <span className="grade-label">Grade</span>
                  <strong className="grade-letter">{dim.grade}</strong>
                </div>
              </div>

              <h3 className="dim-name">{dim.name}</h3>

              <div className="dim-score-row">
                <div className="dim-score-val">
                  <strong>{dim.score.toFixed(1)}</strong>
                  <span>%</span>
                </div>
                <span className={`dim-status-pill ${dimStatusClass}`}>
                  {isMastered ? (
                    <CheckCircle2 size={12} aria-hidden="true" />
                  ) : isGap ? (
                    <AlertTriangle size={12} aria-hidden="true" />
                  ) : null}
                  <span>{dim.status}</span>
                </span>
              </div>

              {/* Progress Bar */}
              <div className="dim-progress-track" aria-hidden="true">
                <div 
                  className={`dim-progress-fill ${dimStatusClass}`}
                  style={{ width: `${Math.max(dim.score, 4)}%` }}
                />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
