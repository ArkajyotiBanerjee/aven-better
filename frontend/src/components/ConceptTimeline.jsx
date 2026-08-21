import React from 'react';
import { Compass } from 'lucide-react';
import { formatTime } from './CaptionPanel';

export default function ConceptTimeline({
  timelineItems = [],
  activeInsightId,
  onSelectTimelineItem
}) {
  if (!timelineItems || timelineItems.length === 0) {
    return null;
  }

  // Sort events chronologically
  const sortedItems = [...timelineItems].sort((a, b) => {
    return (a.timestamp_start ?? 0) - (b.timestamp_start ?? 0);
  });

  return (
    <nav className="concept-timeline-section" aria-labelledby="timeline-heading">
      <div className="timeline-header">
        <div className="timeline-title-wrap">
          <Compass size={16} className="timeline-icon-svg text-forest" aria-hidden="true" />
          <h2 id="timeline-heading">Lecture Progression Rail</h2>
        </div>
        <span className="timeline-hint">Select any concept milestone to jump to that moment in the lecture</span>
      </div>

      <div className="timeline-track-container" tabIndex="0" role="region" aria-label="Chronological concept timeline">
        <div className="timeline-track">
          {sortedItems.map((item, index) => {
            const isActive = activeInsightId === item.id;

            return (
              <div 
                key={item.id || index}
                className={`timeline-milestone ${isActive ? 'active' : ''} milestone-${item.type}`}
                onClick={() => onSelectTimelineItem(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectTimelineItem(item);
                  }
                }}
                role="button"
                tabIndex="0"
                aria-pressed={isActive}
                aria-label={`Milestone at ${formatTime(item.timestamp_start)}: ${item.categoryLabel} - ${item.title}`}
              >
                <div className="milestone-marker">
                  <span className="marker-dot" aria-hidden="true"></span>
                  <span className="milestone-time">{formatTime(item.timestamp_start)}</span>
                </div>

                <div className="milestone-card">
                  <div className="milestone-badge">
                    <span className="milestone-category">{item.categoryLabel}</span>
                  </div>
                  <div className="milestone-title" title={item.title}>
                    {item.title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
