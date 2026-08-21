import React, { useRef, useEffect } from 'react';
import { MessageSquare, Clock } from 'lucide-react';

export function formatTime(seconds) {
  if (seconds === undefined || seconds === null || isNaN(seconds)) return '00:00';
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

export default function CaptionPanel({ 
  segments = [], 
  activeSegmentIndex, 
  onSelectSegment, 
  insights = [] 
}) {
  const segmentRefs = useRef([]);

  useEffect(() => {
    if (activeSegmentIndex !== null && segmentRefs.current[activeSegmentIndex]) {
      segmentRefs.current[activeSegmentIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [activeSegmentIndex]);

  // Check if an insight relates to a segment
  const getInsightsForSegment = (seg) => {
    return insights.filter(ins => {
      const start = ins.timestamp_start ?? 0;
      const end = ins.timestamp_end ?? 0;
      return (start <= seg.end && end >= seg.start);
    });
  };

  return (
    <section className="caption-panel" aria-labelledby="captions-heading">
      <div className="panel-header">
        <div className="panel-title-wrap">
          <MessageSquare size={17} className="panel-icon-svg" aria-hidden="true" />
          <h2 id="captions-heading">Synchronized Transcript & Captions</h2>
        </div>
        <span className="segment-count-badge" aria-label={`${segments.length} timestamped transcript segments`}>
          {segments.length} Segments
        </span>
      </div>

      <div 
        className="captions-stream" 
        role="region" 
        aria-label="Timestamped lecture captions"
        tabIndex="0"
      >
        {segments.map((seg, idx) => {
          const isActive = activeSegmentIndex === idx;
          const relatedInsights = getInsightsForSegment(seg);

          return (
            <div
              key={idx}
              ref={(el) => (segmentRefs.current[idx] = el)}
              className={`caption-card ${isActive ? 'active' : ''}`}
              onClick={() => onSelectSegment(idx, seg)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectSegment(idx, seg);
                }
              }}
              role="button"
              tabIndex="0"
              aria-pressed={isActive}
              aria-label={`Caption at ${formatTime(seg.start)}: ${seg.text}`}
            >
              <div className="caption-meta">
                <span className="caption-timestamp">
                  <Clock size={12} className="clock-icon-svg" aria-hidden="true" />
                  <span>{formatTime(seg.start)} – {formatTime(seg.end)}</span>
                </span>
                {relatedInsights.length > 0 && (
                  <div className="caption-insight-pills" title={`${relatedInsights.length} educational insights anchor to this timestamp`}>
                    {relatedInsights.map((ins, iIdx) => (
                      <span key={iIdx} className={`insight-micro-pill pill-${ins.type}`}>
                        {ins.categoryLabel}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="caption-text">
                {seg.text}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
