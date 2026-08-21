import React from 'react';
import { 
  Trophy, 
  Target, 
  Brain, 
  Award, 
  Compass, 
  Lock, 
  CheckCircle2 
} from 'lucide-react';

function getAchievementIcon(iconName) {
  switch (iconName) {
    case 'Trophy':
      return <Trophy size={20} aria-hidden="true" />;
    case 'Target':
      return <Target size={20} aria-hidden="true" />;
    case 'Brain':
      return <Brain size={20} aria-hidden="true" />;
    case 'Award':
      return <Award size={20} aria-hidden="true" />;
    case 'Compass':
      return <Compass size={20} aria-hidden="true" />;
    default:
      return <Trophy size={20} aria-hidden="true" />;
  }
}

export default function AchievementGrid({ achievements = [] }) {
  if (!achievements || achievements.length === 0) return null;

  return (
    <section className="achievements-section" aria-labelledby="achievements-heading">
      <div className="section-header-row">
        <div>
          <h2 id="achievements-heading" className="dashboard-section-title">
            Milestones & Verified Badges
          </h2>
          <p className="dashboard-section-subtitle">
            Competencies, accessibility explorations, and diagnostic achievements earned.
          </p>
        </div>
      </div>

      <div className="achievements-grid">
        {achievements.map((ach) => {
          return (
            <article 
              key={ach.id} 
              className={`achievement-card ${ach.unlocked ? 'ach-unlocked' : 'ach-locked'}`}
            >
              <div className="ach-icon-box">
                {getAchievementIcon(ach.icon)}
                {!ach.unlocked && (
                  <span className="lock-overlay-badge" aria-label="Locked badge">
                    <Lock size={11} />
                  </span>
                )}
              </div>

              <div className="ach-body">
                <div className="ach-header">
                  <h3 className="ach-title">{ach.title}</h3>
                  {ach.unlocked ? (
                    <span className="ach-status-badge unlocked">
                      <CheckCircle2 size={11} aria-hidden="true" />
                      <span>Unlocked</span>
                    </span>
                  ) : (
                    <span className="ach-status-badge locked">
                      <span>{ach.progress_pct}%</span>
                    </span>
                  )}
                </div>

                <p className="ach-desc">{ach.description}</p>

                {!ach.unlocked && (
                  <div className="ach-progress-track" aria-hidden="true">
                    <div 
                      className="ach-progress-fill" 
                      style={{ width: `${Math.max(ach.progress_pct, 4)}%` }} 
                    />
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
