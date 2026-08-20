import React from 'react';
import { 
  BookOpen, 
  Binary, 
  Lightbulb, 
  AlertTriangle, 
  Link2, 
  Clock, 
  Quote, 
  ArrowRight 
} from 'lucide-react';
import { formatTime } from './CaptionPanel';

function getCategoryIcon(type) {
  switch (type) {
    case 'concept':
    case 'definition':
      return <BookOpen size={14} aria-hidden="true" />;
    case 'formula':
      return <Binary size={14} aria-hidden="true" />;
    case 'example':
      return <Lightbulb size={14} aria-hidden="true" />;
    case 'important_point':
      return <AlertTriangle size={14} aria-hidden="true" />;
    case 'relationship':
      return <Link2 size={14} aria-hidden="true" />;
    default:
      return <BookOpen size={14} aria-hidden="true" />;
  }
}

export default function InsightCard({
  insight,
  isActive,
  onSelect
}) {
  const {
    id,
    type,
    categoryLabel,
    title,
    timestamp_start,
    timestamp_end,
    evidence,
    data
  } = insight;

  return (
    <article
      className={`insight-card insight-${type} ${isActive ? 'active' : ''}`}
      onClick={() => onSelect(insight)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(insight);
        }
      }}
      tabIndex="0"
      role="button"
      aria-pressed={isActive}
      aria-labelledby={`insight-title-${id}`}
    >
      <div className="insight-card-header">
        <span className={`category-tag category-${type}`}>
          <span className="category-icon" aria-hidden="true">
            {getCategoryIcon(type)}
          </span>
          <span className="category-name">{categoryLabel}</span>
        </span>
        
        {timestamp_start !== undefined && (
          <span className="insight-timestamp" title="Jump to timestamp in captions">
            <Clock size={12} className="clock-svg-inline" aria-hidden="true" />
            <span>{formatTime(timestamp_start)}</span>
            {timestamp_end && timestamp_end !== timestamp_start ? ` – ${formatTime(timestamp_end)}` : ''}
          </span>
        )}
      </div>

      <div className="insight-body">
        <h3 id={`insight-title-${id}`} className="insight-title">
          {title}
        </h3>

        {/* Concept / Definition description */}
        {data.description && (
          <p className="insight-description">{data.description}</p>
        )}
        {data.definition && (
          <p className="insight-definition">{data.definition}</p>
        )}

        {/* Formula specific display */}
        {type === 'formula' && (
          <div className="formula-box">
            <div className="formula-expression" aria-label={`Formula expression: ${data.expression}`}>
              <code>{data.expression}</code>
            </div>
            {data.variables && data.variables.length > 0 && (
              <div className="formula-variables">
                <span className="variables-label">Variables:</span>
                <div className="variable-chips">
                  {data.variables.map((v, i) => (
                    <span key={i} className="variable-chip"><code>{v}</code></span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Example specific display */}
        {type === 'example' && (
          <div className="example-box">
            <div className="example-scenario">
              <span className="example-label">Scenario:</span>
              <p>{data.description}</p>
            </div>
            {data.result && (
              <div className="example-result">
                <span className="result-label">Result:</span>
                <span className="result-value">{data.result}</span>
              </div>
            )}
          </div>
        )}

        {/* Important point specific display */}
        {type === 'important_point' && data.importance_reason && (
          <div className="importance-box">
            <span className="importance-label">Why it matters:</span>
            <p>{data.importance_reason}</p>
          </div>
        )}

        {/* Relationship specific display */}
        {type === 'relationship' && (
          <div className="relationship-box">
            <div className="relation-flow">
              <span className="relation-node source-node">{data.source}</span>
              <span className="relation-arrow">
                <span className="relation-type">{data.relationship}</span>
                <ArrowRight size={14} className="arrow-symbol" aria-hidden="true" />
              </span>
              <span className="relation-node target-node">{data.target}</span>
            </div>
          </div>
        )}

        {/* Evidence Quote */}
        {evidence && (
          <div className="insight-evidence" title="Direct ground from transcript">
            <Quote size={14} className="evidence-icon-svg" aria-hidden="true" />
            <blockquote className="evidence-quote">{evidence}</blockquote>
          </div>
        )}
      </div>
    </article>
  );
}
