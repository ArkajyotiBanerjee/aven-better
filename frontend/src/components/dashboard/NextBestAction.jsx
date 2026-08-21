import React from 'react';
import { 
  Zap, 
  ArrowRight, 
  Target, 
  AlertTriangle, 
  BookOpen 
} from 'lucide-react';

export default function NextBestAction({ 
  activeGaps = [], 
  dimensions = [], 
  overallScore = 0,
  onLaunchRemediation,
  onOpenAssessment,
  onIngestLecture
}) {
  // 1. Highest priority gap
  const primaryGap = activeGaps.length > 0 ? activeGaps[0] : null;

  // 2. Weakest dimension fallback
  const weakestDimension = dimensions.length > 0 
    ? [...dimensions].sort((a, b) => a.score - b.score)[0]
    : null;

  // 3. Construct deterministic recommendation content
  let actionTitle = '';
  let actionRationale = '';
  let affectedSkill = '';
  let affectedConcept = '';
  let severityLabel = '';
  let buttonLabel = '';
  let onActionClick = null;

  if (primaryGap) {
    const skillFormatted = primaryGap.skill.charAt(0).toUpperCase() + primaryGap.skill.slice(1);
    actionTitle = `Strengthen ${skillFormatted} in ${primaryGap.concept}`;
    actionRationale = primaryGap.diagnosis || `Your conceptual grasp is verified, but applying running window formulas to multi-step problem calculations is your highest-leverage area to strengthen.`;
    affectedSkill = skillFormatted;
    affectedConcept = primaryGap.concept;
    severityLabel = `${primaryGap.severity.toUpperCase()} PRIORITY`;
    buttonLabel = 'Continue Practice';
    onActionClick = () => onLaunchRemediation && onLaunchRemediation(primaryGap);
  } else if (weakestDimension && weakestDimension.score < 75) {
    actionTitle = `Improve ${weakestDimension.name}`;
    actionRationale = `Your current score in ${weakestDimension.name} is ${weakestDimension.score}%. Practicing targeted problems will elevate your composite readiness into the Proficient band.`;
    affectedSkill = weakestDimension.name;
    affectedConcept = 'Core Technical Curriculum';
    severityLabel = 'RECOMMENDED';
    buttonLabel = 'Take Assessment';
    onActionClick = () => onOpenAssessment && onOpenAssessment();
  } else if (overallScore >= 85) {
    actionTitle = 'Maintain Career Mastery & Explore New Tracks';
    actionRationale = 'You have demonstrated verified competency across all assessed dimensions. Ingest your next technical lecture to expand your skill profile.';
    affectedSkill = 'Advanced Competency';
    affectedConcept = 'All Topics Mastered';
    severityLabel = 'MASTERY LEVEL';
    buttonLabel = 'Ingest Next Video';
    onActionClick = () => onIngestLecture && onIngestLecture();
  } else {
    actionTitle = 'Complete Baseline Diagnostic Assessment';
    actionRationale = 'Establish your competency benchmark across definitions, algorithmic formulas, and problem-solving application.';
    affectedSkill = 'Foundational Diagnostic';
    affectedConcept = 'Technical Curriculum';
    severityLabel = 'NEXT STEP';
    buttonLabel = 'Start Assessment';
    onActionClick = () => onOpenAssessment && onOpenAssessment();
  }

  return (
    <section className="aven-nba-card" aria-labelledby="nba-heading">
      <div className="nba-inner-container">
        {/* Top Header Tag */}
        <div className="nba-tag-row">
          <div className="nba-kicker-pill">
            <Zap size={12} className="nba-kicker-icon" aria-hidden="true" />
            <span>NEXT BEST ACTION</span>
          </div>

          <span className={`nba-priority-chip ${primaryGap ? 'chip-priority-high' : 'chip-priority-neutral'}`}>
            {severityLabel}
          </span>
        </div>

        {/* Core Content & CTA */}
        <div className="nba-editorial-body">
          <div className="nba-text-block">
            <h2 id="nba-heading" className="nba-headline">
              {actionTitle}
            </h2>
            <p className="nba-description">
              {actionRationale}
            </p>

            {/* Contextual Meta Chips */}
            <div className="nba-meta-chips">
              {affectedConcept && (
                <span className="nba-meta-chip">
                  <BookOpen size={12} aria-hidden="true" />
                  <span>Topic: <strong>{affectedConcept}</strong></span>
                </span>
              )}
              {affectedSkill && (
                <span className="nba-meta-chip">
                  <Target size={12} aria-hidden="true" />
                  <span>Skill Domain: <strong>{affectedSkill}</strong></span>
                </span>
              )}
              {primaryGap?.evidence && (
                <span className="nba-meta-chip chip-evidence" title={primaryGap.evidence}>
                  <AlertTriangle size={12} aria-hidden="true" />
                  <span>Evidence: <em>{primaryGap.evidence.slice(0, 60)}...</em></span>
                </span>
              )}
            </div>
          </div>

          {/* Action CTA Button */}
          <div className="nba-cta-block">
            <button
              type="button"
              className="btn-forest-cta"
              onClick={onActionClick}
              aria-label={`${buttonLabel}: ${actionTitle}`}
            >
              <span>{buttonLabel}</span>
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
