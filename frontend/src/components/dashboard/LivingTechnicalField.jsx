import React from 'react';

/**
 * LivingTechnicalField
 * Subtle, subconscious technical background field behind the Dashboard first viewport.
 * References algorithmic trajectory paths, coordinate matrix points, and sliding window
 * interval bounds with restrained Deep Forest opacity.
 */
export default function LivingTechnicalField() {
  return (
    <div className="living-technical-field" aria-hidden="true">
      <svg 
        className="technical-field-svg" 
        viewBox="0 0 1440 640" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="grad-curve-subtle-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#234C38" stopOpacity="0.06" />
            <stop offset="50%" stopColor="#234C38" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#DDE8DE" stopOpacity="0.0" />
          </linearGradient>

          <linearGradient id="grad-curve-subtle-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#234C38" stopOpacity="0.05" />
            <stop offset="60%" stopColor="#234C38" stopOpacity="0.015" />
            <stop offset="100%" stopColor="#F7F5EF" stopOpacity="0.0" />
          </linearGradient>

          {/* Matrix Coordinate Dot Grid */}
          <pattern id="editorial-grid-faint" width="56" height="56" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.0" fill="#234C38" fillOpacity="0.045" />
          </pattern>
        </defs>

        {/* Faint Coordinate Matrix */}
        <rect width="100%" height="100%" fill="url(#editorial-grid-faint)" />

        {/* Algorithmic Trajectory Curves */}
        <path 
          d="M-50 480 C 240 420, 480 540, 780 380 C 1080 220, 1260 320, 1500 160" 
          stroke="url(#grad-curve-subtle-1)" 
          strokeWidth="1.25" 
          strokeDasharray="4 8"
          className="ambient-path-1"
        />

        <path 
          d="M-80 220 C 320 180, 560 340, 920 260 C 1200 200, 1380 380, 1520 420" 
          stroke="url(#grad-curve-subtle-2)" 
          strokeWidth="1.25"
          className="ambient-path-2"
        />

        {/* Faint Technical Interval & Coordinate Annotations */}
        <g className="faint-technical-marks" opacity="0.22">
          {/* Subtle array ruler ticks */}
          <line x1="880" y1="90" x2="1300" y2="90" stroke="#234C38" strokeWidth="0.75" strokeOpacity="0.3" />
          <line x1="940" y1="84" x2="940" y2="96" stroke="#234C38" strokeWidth="1" strokeOpacity="0.4" />
          <line x1="1100" y1="84" x2="1100" y2="96" stroke="#234C38" strokeWidth="1" strokeOpacity="0.4" />
          <line x1="1180" y1="86" x2="1180" y2="94" stroke="#234C38" strokeWidth="0.75" strokeOpacity="0.3" />
          <line x1="1260" y1="86" x2="1260" y2="94" stroke="#234C38" strokeWidth="0.75" strokeOpacity="0.3" />

          {/* Node marker points */}
          <circle cx="340" cy="450" r="2.5" fill="#234C38" fillOpacity="0.3" />
          <circle cx="780" cy="380" r="3" fill="#234C38" fillOpacity="0.35" />
          <circle cx="1180" cy="220" r="2.5" fill="#234C38" fillOpacity="0.3" />
        </g>
      </svg>
    </div>
  );
}
