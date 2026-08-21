import React from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  ArrowRight, 
  Zap 
} from 'lucide-react';

export default function MissionList({ missions = [], onExecuteMission }) {
  if (!missions || missions.length === 0) return null;

  const totalXp = missions.reduce((acc, m) => acc + (m.xp_reward || 0), 0);
  const completedXp = missions
    .filter(m => m.completed)
    .reduce((acc, m) => acc + (m.xp_reward || 0), 0);

  return (
    <section className="missions-section" aria-labelledby="missions-heading">
      <div className="section-header-row">
        <div>
          <div className="title-with-badge">
            <h2 id="missions-heading" className="dashboard-section-title">
              Today's Active Missions
            </h2>
            <span className="xp-summary-pill">
              <Zap size={13} aria-hidden="true" />
              <span>{completedXp} / {totalXp} XP Earned</span>
            </span>
          </div>
          <p className="dashboard-section-subtitle">
            Curated daily milestones to close learning gaps and accelerate readiness.
          </p>
        </div>
      </div>

      <div className="missions-list">
        {missions.map((mission) => {
          return (
            <article 
              key={mission.id} 
              className={`mission-card ${mission.completed ? 'mission-completed' : 'mission-active'}`}
            >
              <div className="mission-status-icon-wrap" aria-hidden="true">
                {mission.completed ? (
                  <CheckCircle2 size={20} className="text-success" />
                ) : (
                  <Circle size={20} className="text-muted" />
                )}
              </div>

              <div className="mission-content-group">
                <div className="mission-title-row">
                  <h3 className="mission-title">{mission.title}</h3>
                  <span className="mission-xp-badge">
                    +{mission.xp_reward} XP
                  </span>
                </div>
                <p className="mission-desc">{mission.description}</p>
              </div>

              <div className="mission-action-group">
                {mission.completed ? (
                  <span className="mission-completed-tag">
                    <CheckCircle2 size={13} aria-hidden="true" />
                    <span>Completed</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    className="btn-secondary btn-sm btn-mission-action"
                    onClick={() => onExecuteMission && onExecuteMission(mission)}
                    aria-label={`Start mission: ${mission.title}`}
                  >
                    <span>Start Mission</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
