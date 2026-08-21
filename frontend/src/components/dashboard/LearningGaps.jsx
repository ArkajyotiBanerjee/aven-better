import React from 'react';
import { 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  BookOpen 
} from 'lucide-react';

export default function LearningGaps({ activeGaps = [], onLaunchRemediation }) {
  return (
    <section className="learning-gaps-section" aria-labelledby="gaps-heading">
      <div className="section-header-row">
        <div>
          <div className="title-with-badge">
            <h2 id="gaps-heading" className="dashboard-section-title">
              Active Learning Gaps & Remediation
            </h2>
            {activeGaps.length > 0 && (
              <span className="gaps-count-badge" aria-label={`${activeGaps.length} active learning gaps requiring practice`}>
                {activeGaps.length} Requiring Focus
              </span>
            )}
          </div>
          <p className="dashboard-section-subtitle">
            Targeted skill gaps identified from diagnostic assessment requiring personalized practice.
          </p>
        </div>
      </div>

      {activeGaps.length === 0 ? (
        <div className="gaps-empty-card">
          <div className="empty-icon-wrap text-success">
            <CheckCircle2 size={32} aria-hidden="true" />
          </div>
          <div className="empty-text-wrap">
            <h3 className="empty-title">All Core Competencies Mastered!</h3>
            <p className="empty-desc">
              No active learning gaps detected. You have demonstrated solid problem-solving across all assessed topics.
            </p>
          </div>
        </div>
      ) : (
        <div className="gaps-cards-list">
          {activeGaps.map((gap) => {
            const isSignificant = gap.severity.toLowerCase() === 'significant';
            const isModerate = gap.severity.toLowerCase() === 'moderate';

            const severityClass = isSignificant
              ? 'sev-significant'
              : isModerate
              ? 'sev-moderate'
              : 'sev-mild';

            return (
              <article key={gap.gap_id} className={`gap-alert-card ${severityClass}`}>
                <div className="gap-card-top">
                  <div className="gap-badges-group">
                    <span className="gap-concept-pill">
                      <BookOpen size={12} aria-hidden="true" />
                      <span>{gap.concept}</span>
                    </span>
                    <span className="gap-skill-pill">
                      {gap.skill.toUpperCase()} GAP
                    </span>
                    <span className={`gap-severity-pill ${severityClass}`}>
                      <AlertTriangle size={12} aria-hidden="true" />
                      <span>{gap.severity.toUpperCase()}</span>
                    </span>
                  </div>

                  <span className="gap-lecture-ref">
                    From: <strong>{gap.lecture_title}</strong>
                  </span>
                </div>

                <div className="gap-card-body">
                  <p className="gap-diagnosis-msg">
                    {gap.diagnosis}
                  </p>

                  <div className="gap-evidence-quote-box">
                    <span className="evidence-quote-label">Assessment Evidence:</span>
                    <p className="evidence-quote-text">{gap.evidence}</p>
                  </div>
                </div>

                <div className="gap-card-footer">
                  <div className="remediation-status-indicator">
                    <span className="pulse-dot" aria-hidden="true" />
                    <span>Personalized Mini-Lesson & Practice Ready</span>
                  </div>

                  <button
                    type="button"
                    className="btn-primary btn-launch-remediation"
                    onClick={() => onLaunchRemediation && onLaunchRemediation(gap)}
                    aria-label={`Start personalized remediation for ${gap.concept}`}
                  >
                    <Sparkles size={16} aria-hidden="true" />
                    <span>Continue Practice</span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
