import React from 'react';
import { 
  UploadCloud, 
  Cpu, 
  BookOpen, 
  Layers, 
  Target, 
  Search, 
  RotateCcw, 
  Compass,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const CAPABILITY_CARDS = [
  {
    step: '01',
    phase: 'CAPTURE',
    title: 'Bring in technical lectures',
    description: 'Upload a lecture and turn it into structured learning material.',
    icon: UploadCloud,
    accent: '#234C38',
    bgBadge: '#DDE8DE',
    animClass: 'float-anim-1'
  },
  {
    step: '02',
    phase: 'EXTRACT',
    title: 'Find the technical core',
    description: 'Surface concepts, formulas, examples and key points automatically.',
    icon: Cpu,
    accent: '#234C38',
    bgBadge: '#EAF1EB',
    animClass: 'float-anim-2'
  },
  {
    step: '03',
    phase: 'UNDERSTAND',
    title: 'See ideas in context',
    description: 'Follow synchronized explanations, captions and technical relationships.',
    icon: BookOpen,
    accent: '#234C38',
    bgBadge: '#E2ECE4',
    animClass: 'float-anim-3'
  },
  {
    isAnchor: true,
    step: 'CORE',
    phase: 'LEARNING INTELLIGENCE',
    title: 'From Lecture to Readiness',
    description: 'From lecture → to understanding → to verified readiness.',
    icon: Sparkles,
    accent: '#234C38',
    bgBadge: '#DDE8DE',
    animClass: 'float-anim-anchor'
  },
  {
    step: '04',
    phase: 'ADAPT',
    title: 'Learn in your preferred mode',
    description: 'Switch between visual, audio-first and cognitive-support experiences.',
    icon: Layers,
    accent: '#234C38',
    bgBadge: '#DDE8DE',
    animClass: 'float-anim-4'
  },
  {
    step: '05',
    phase: 'ASSESS',
    title: 'Test what actually stuck',
    description: 'Take an assessment based on what was actually taught in the session.',
    icon: Target,
    accent: '#234C38',
    bgBadge: '#EFECE4',
    animClass: 'float-anim-5'
  },
  {
    step: '06',
    phase: 'DIAGNOSE',
    title: 'Find the real gap',
    description: 'Separate conceptual understanding from application ability.',
    icon: Search,
    accent: '#234C38',
    bgBadge: '#EAF1EB',
    animClass: 'float-anim-6'
  },
  {
    step: '07',
    phase: 'REMEDIATE',
    title: "Practice what you're missing",
    description: 'Get targeted practice instead of repeating the entire lecture.',
    icon: RotateCcw,
    accent: '#234C38',
    bgBadge: '#E2ECE4',
    animClass: 'float-anim-7'
  },
  {
    step: '08',
    phase: 'READINESS',
    title: 'Turn learning into readiness',
    description: 'Track how your technical competence is developing over time.',
    icon: Compass,
    accent: '#234C38',
    bgBadge: '#DDE8DE',
    animClass: 'float-anim-8'
  }
];

export default function CapabilityMarquee() {
  // Duplicate list once to create a seamless infinite marquee track
  const marqueeItems = [...CAPABILITY_CARDS, ...CAPABILITY_CARDS];

  return (
    <section 
      className="capability-marquee-section" 
      aria-label="Aven.better Learning Intelligence Capability Pipeline"
    >
      {/* Top Editorial Ticker Frame */}
      <div className="marquee-editorial-frame frame-top" aria-hidden="true">
        <div className="ticker-track">
          <span>AVEN.BETTER · LEARNING INTELLIGENCE · CAPTURE → EXTRACT → UNDERSTAND → ADAPT → ASSESS → DIAGNOSE → REMEDIATE → READINESS · MULTI-MODAL COMPETENCY ENGINE · </span>
          <span>AVEN.BETTER · LEARNING INTELLIGENCE · CAPTURE → EXTRACT → UNDERSTAND → ADAPT → ASSESS → DIAGNOSE → REMEDIATE → READINESS · MULTI-MODAL COMPETENCY ENGINE · </span>
        </div>
      </div>

      {/* Main Continuous Marquee Track */}
      <div className="marquee-viewport">
        <div className="marquee-track">
          {marqueeItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <article
                key={`${item.phase}-${idx}`}
                className={`marquee-card ${item.animClass} ${item.isAnchor ? 'marquee-card-anchor' : ''}`}
                tabIndex="0"
                role="article"
                aria-label={`${item.phase}: ${item.title}`}
              >
                <div className="card-top-row">
                  <span 
                    className="card-phase-pill"
                    style={{ backgroundColor: item.bgBadge }}
                  >
                    <span className="card-step-num">{item.step}</span>
                    <span className="card-phase-name">{item.phase}</span>
                  </span>

                  <span className="card-icon-wrap" aria-hidden="true">
                    <Icon size={16} />
                  </span>
                </div>

                <div className="card-main-content">
                  <h3 className="card-title">{item.title}</h3>
                  <p className="card-description">{item.description}</p>
                </div>

                {item.isAnchor && (
                  <div className="card-anchor-footer">
                    <span className="anchor-tag">PIPELINE CORE</span>
                    <ArrowRight size={12} aria-hidden="true" />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>

      {/* Bottom Editorial Ticker Frame */}
      <div className="marquee-editorial-frame frame-bottom" aria-hidden="true">
        <div className="ticker-track ticker-reverse">
          <span>REAL-TIME REASONING · GROUNDED KNOWLEDGE · ZERO HALLUCINATION · SYNCED MULTI-MODAL PATHWAYS · CONTINUOUS ADAPTIVE MASTERY · </span>
          <span>REAL-TIME REASONING · GROUNDED KNOWLEDGE · ZERO HALLUCINATION · SYNCED MULTI-MODAL PATHWAYS · CONTINUOUS ADAPTIVE MASTERY · </span>
        </div>
      </div>
    </section>
  );
}
