import React, { useState } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Binary, 
  Lightbulb, 
  AlertTriangle, 
  Link2 
} from 'lucide-react';
import InsightCard from './InsightCard';

export default function InsightPanel({
  insights = [],
  activeInsightId,
  onSelectInsight
}) {
  const [filter, setFilter] = useState('all');

  // Compute counts for tabs
  const counts = {
    all: insights.length,
    concept: insights.filter(i => i.type === 'concept' || i.type === 'definition').length,
    formula: insights.filter(i => i.type === 'formula').length,
    example: insights.filter(i => i.type === 'example').length,
    important_point: insights.filter(i => i.type === 'important_point').length,
    relationship: insights.filter(i => i.type === 'relationship').length,
  };

  const filteredInsights = insights.filter(ins => {
    if (filter === 'all') return true;
    if (filter === 'concept') return ins.type === 'concept' || ins.type === 'definition';
    return ins.type === filter;
  });

  return (
    <section className="insight-panel" aria-labelledby="insights-heading">
      <div className="panel-header">
        <div className="panel-title-wrap">
          <Sparkles size={17} className="panel-icon-svg text-forest" aria-hidden="true" />
          <h2 id="insights-heading">Extracted Technical Intelligence</h2>
        </div>
        <span className="insight-count-badge" aria-label={`${insights.length} extracted technical insights`}>
          {insights.length} Insights
        </span>
      </div>

      {/* Filter Tabs */}
      <nav className="insight-tabs" role="tablist" aria-label="Filter insight categories">
        <button
          role="tab"
          aria-selected={filter === 'all'}
          className={`tab-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          <span>All</span>
          <span className="tab-count">{counts.all}</span>
        </button>
        {counts.concept > 0 && (
          <button
            role="tab"
            aria-selected={filter === 'concept'}
            className={`tab-btn ${filter === 'concept' ? 'active' : ''}`}
            onClick={() => setFilter('concept')}
          >
            <BookOpen size={13} aria-hidden="true" />
            <span>Concepts</span>
            <span className="tab-count">{counts.concept}</span>
          </button>
        )}
        {counts.formula > 0 && (
          <button
            role="tab"
            aria-selected={filter === 'formula'}
            className={`tab-btn ${filter === 'formula' ? 'active' : ''}`}
            onClick={() => setFilter('formula')}
          >
            <Binary size={13} aria-hidden="true" />
            <span>Formulas</span>
            <span className="tab-count">{counts.formula}</span>
          </button>
        )}
        {counts.example > 0 && (
          <button
            role="tab"
            aria-selected={filter === 'example'}
            className={`tab-btn ${filter === 'example' ? 'active' : ''}`}
            onClick={() => setFilter('example')}
          >
            <Lightbulb size={13} aria-hidden="true" />
            <span>Examples</span>
            <span className="tab-count">{counts.example}</span>
          </button>
        )}
        {counts.important_point > 0 && (
          <button
            role="tab"
            aria-selected={filter === 'important_point'}
            className={`tab-btn ${filter === 'important_point' ? 'active' : ''}`}
            onClick={() => setFilter('important_point')}
          >
            <AlertTriangle size={13} aria-hidden="true" />
            <span>Key Points</span>
            <span className="tab-count">{counts.important_point}</span>
          </button>
        )}
        {counts.relationship > 0 && (
          <button
            role="tab"
            aria-selected={filter === 'relationship'}
            className={`tab-btn ${filter === 'relationship' ? 'active' : ''}`}
            onClick={() => setFilter('relationship')}
          >
            <Link2 size={13} aria-hidden="true" />
            <span>Relations</span>
            <span className="tab-count">{counts.relationship}</span>
          </button>
        )}
      </nav>

      {/* Cards List */}
      <div className="insights-stream" role="region" aria-label="Extracted educational insights list">
        {filteredInsights.length === 0 ? (
          <div className="empty-insights-state">
            <p>No insights found in this category.</p>
          </div>
        ) : (
          filteredInsights.map((ins) => (
            <InsightCard
              key={ins.id}
              insight={ins}
              isActive={activeInsightId === ins.id}
              onSelect={onSelectInsight}
            />
          ))
        )}
      </div>
    </section>
  );
}
