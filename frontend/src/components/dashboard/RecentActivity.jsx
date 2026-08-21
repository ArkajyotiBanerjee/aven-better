import React from 'react';
import { 
  BookOpen, 
  ArrowRight, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';

export default function RecentActivity({ recentActivity = [], onOpenLecture }) {
  if (!recentActivity || recentActivity.length === 0) return null;

  return (
    <section className="recent-activity-section" aria-labelledby="activity-heading">
      <div className="section-header-row">
        <div>
          <h2 id="activity-heading" className="dashboard-section-title">
            Recent Learning Activity
          </h2>
          <p className="dashboard-section-subtitle">
            Historical assessment attempts, diagnostic evaluations, and study sessions.
          </p>
        </div>
      </div>

      <div className="activity-list">
        {recentActivity.map((act, idx) => {
          const isRemediating = act.status.toLowerCase().includes('remediation');
          const isCompleted = act.status.toLowerCase().includes('completed');

          const statusClass = isCompleted
            ? 'act-completed'
            : isRemediating
            ? 'act-remediation'
            : 'act-pending';

          return (
            <article key={act.lecture_id || idx} className="activity-item-card">
              <div className="act-icon-wrap" aria-hidden="true">
                <BookOpen size={18} />
              </div>

              <div className="act-content-group">
                <h3 className="act-title">{act.title}</h3>
                <div className="act-meta-row">
                  <span className={`act-status-pill ${statusClass}`}>
                    {act.status}
                  </span>
                  {act.last_score > 0 && (
                    <span className="act-score-tag">
                      Score: <strong>{act.last_score.toFixed(1)}%</strong>
                    </span>
                  )}
                  {act.timestamp && (
                    <span className="act-time-tag">
                      <Clock size={11} aria-hidden="true" />
                      <span>{new Date(act.timestamp).toLocaleDateString()}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="act-action-group">
                <button
                  type="button"
                  className="btn-secondary btn-sm btn-review-lecture"
                  onClick={() => onOpenLecture && onOpenLecture(act.lecture_id)}
                  aria-label={`Open lecture studio for ${act.title}`}
                >
                  <span>Open Studio</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
