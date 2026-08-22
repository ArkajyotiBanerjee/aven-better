import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Target,
  Layers,
  Award,
  HelpCircle,
  RotateCcw,
  Loader2,
  ChevronRight,
  Sliders
} from 'lucide-react';

const ROLE_OPTIONS = [
  { label: 'General Technical Analysis (No Specific Role)', value: '' },
  { label: 'Software Development Engineer (SDE)', value: 'Software Development Engineer' },
  { label: 'Frontend Developer', value: 'Frontend Developer' },
  { label: 'Backend Developer', value: 'Backend Developer' },
  { label: 'Full Stack Developer', value: 'Full Stack Developer' },
  { label: 'Data Analyst', value: 'Data Analyst' },
  { label: 'Data Scientist', value: 'Data Scientist' },
  { label: 'DevOps & Cloud Engineer', value: 'DevOps Engineer' },
  { label: 'Mobile App Developer (iOS / Android)', value: 'Mobile Developer' },
  { label: 'Product / Technical Analyst', value: 'Product Analyst' },
  { label: 'Custom Target Role...', value: 'custom' },
];

const ROTATING_MESSAGES = [
  "Extracting verified engineering evidence...",
  "Evaluating concrete metrics vs. unbacked claims...",
  "Benchmarking experience against target role requirements...",
  "Analyzing technical project depth and ownership...",
  "Synthesizing high-impact priority gaps and action plan..."
];

export default function ResumeIntelligence({ onNavigateDashboard, user }) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [analysisData, setAnalysisData] = useState(null);
  const [messageIndex, setMessageIndex] = useState(0);

  // Rotating processing messages
  useEffect(() => {
    if (!isAnalyzing) return;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % ROTATING_MESSAGES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (uploadedFile) => {
    setErrorMsg('');
    setAnalysisData(null); // Clear previous analysis when a new file is chosen

    if (!uploadedFile.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Unsupported file format. Please upload a PDF document (.pdf).');
      setFile(null);
      return;
    }

    if (uploadedFile.size > 10 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 10MB limit. Please upload a smaller PDF.');
      setFile(null);
      return;
    }

    setFile(uploadedFile);
  };

  const handleReset = () => {
    setFile(null);
    setAnalysisData(null);
    setErrorMsg('');
    setIsAnalyzing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setErrorMsg('');
    setAnalysisData(null);

    const formData = new FormData();
    formData.append('resume', file);

    let effectiveRole = null;
    if (selectedRole === 'custom') {
      if (customRoleInput.trim()) {
        effectiveRole = customRoleInput.trim();
      }
    } else if (selectedRole) {
      effectiveRole = selectedRole;
    }

    if (effectiveRole) {
      formData.append('targeted_role', effectiveRole);
    }

    try {
      const response = await fetch('/api/resume/analyze', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to analyze resume. Please try again.');
      }

      const data = await response.json();
      setAnalysisData(data);
    } catch (err) {
      setErrorMsg(err.message || 'An unexpected error occurred during resume analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="resume-intelligence-container" role="main" aria-label="Resume Intelligence">
      {/* Top Editorial Header */}
      <header className="resume-header-panel">
        <div className="resume-header-top">
          <span className="resume-kicker">
            <Target size={14} className="resume-kicker-icon" aria-hidden="true" />
            <span>EVIDENCE-DRIVEN CAREER ALIGNMENT</span>
          </span>
          {user && (
            <span className="resume-auth-pill">
              <Sparkles size={13} aria-hidden="true" />
              <span>Learner Account Active</span>
            </span>
          )}
        </div>

        <h1 className="resume-page-title">
          Resume Intelligence
        </h1>

        <p className="resume-page-subtitle">
          See what your resume actually proves. Evaluate your experience against target technical roles to separate verified engineering evidence from superficial claims, and discover high-leverage priority gaps.
        </p>
      </header>

      {/* Upload & Setup Surface (Shown when no results or during re-analysis) */}
      {!analysisData && (
        <section className="resume-setup-card" aria-label="Resume upload and target role selection">
          <div className="setup-grid">
            {/* Left: Upload Dropzone */}
            <div className="setup-upload-pane">
              <label className="setup-field-label" htmlFor="resume-pdf-input">
                <FileText size={16} aria-hidden="true" />
                <span>Upload Technical Resume (PDF)</span>
              </label>

              <input
                ref={fileInputRef}
                id="resume-pdf-input"
                type="file"
                accept=".pdf,application/pdf"
                className="sr-only"
                onChange={handleFileChange}
              />

              {!file ? (
                <div
                  className={`resume-dropzone ${dragActive ? 'drag-active' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex="0"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  aria-label="Click or drag and drop to select a PDF resume"
                >
                  <div className="resume-dropzone-icon-wrap" aria-hidden="true">
                    <UploadCloud size={34} />
                  </div>
                  <div className="resume-dropzone-text">
                    <strong>Click or drag to select your resume</strong>
                    <span>PDF format only • Up to 10 MB</span>
                  </div>
                </div>
              ) : (
                <div className="resume-selected-file-pane">
                  <div className="selected-file-badge">
                    <FileText size={20} className="file-badge-icon" aria-hidden="true" />
                    <div className="file-badge-info">
                      <span className="file-badge-name">{file.name}</span>
                      <span className="file-badge-size">{(file.size / (1024 * 1024)).toFixed(2)} MB • PDF</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-text-change-file"
                    onClick={handleReset}
                    disabled={isAnalyzing}
                    aria-label="Change uploaded resume file"
                  >
                    ✕ Change File
                  </button>
                </div>
              )}
            </div>

            {/* Right: Target Role Configuration & Action */}
            <div className="setup-role-pane">
              <label className="setup-field-label" htmlFor="target-role-select">
                <Sliders size={16} aria-hidden="true" />
                <span>Targeted Career Direction (Optional)</span>
              </label>

              <div className="select-wrap">
                <select
                  id="target-role-select"
                  className="editorial-select"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  disabled={isAnalyzing}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {selectedRole === 'custom' && (
                <div className="custom-role-field-wrap">
                  <input
                    type="text"
                    className="editorial-input"
                    placeholder="e.g. Distributed Systems Engineer"
                    value={customRoleInput}
                    onChange={(e) => setCustomRoleInput(e.target.value)}
                    maxLength={100}
                    disabled={isAnalyzing}
                    aria-label="Enter custom target role"
                  />
                </div>
              )}

              <p className="setup-note">
                {selectedRole && selectedRole !== 'custom'
                  ? `Evaluates role-specific evidence, technology alignment, and missing competencies for ${selectedRole}.`
                  : selectedRole === 'custom' && customRoleInput.trim()
                  ? `Evaluates role-specific evidence and missing competencies for ${customRoleInput.trim()}.`
                  : 'General Analysis evaluates overall engineering clarity, project specificity, and technical proof without forcing a role match.'}
              </p>

              {/* Action Button */}
              <div className="setup-action-row">
                <button
                  type="button"
                  className="btn-forest-primary btn-analyze-resume"
                  onClick={handleAnalyze}
                  disabled={!file || isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={18} className="animated-spinner" aria-hidden="true" />
                      <span>Analyzing Resume Evidence...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} aria-hidden="true" />
                      <span>Analyze Resume Evidence</span>
                      <ArrowRight size={16} aria-hidden="true" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Processing State */}
      {isAnalyzing && (
        <section className="resume-processing-card" role="status" aria-live="polite">
          <div className="processing-spinner-box">
            <Loader2 size={40} className="animated-spinner spinner-forest" aria-hidden="true" />
          </div>
          <h2 className="processing-title">Analyzing Technical Resume...</h2>
          <p className="processing-subtext">
            {ROTATING_MESSAGES[messageIndex]}
          </p>
          <div className="processing-indicator-pill">
            <span>Evaluating Claims vs. Demonstrable Evidence</span>
          </div>
        </section>
      )}

      {/* Error State */}
      {errorMsg && !isAnalyzing && (
        <section className="resume-error-card" role="alert">
          <div className="error-icon-box" aria-hidden="true">
            <AlertCircle size={32} />
          </div>
          <div className="error-text-content">
            <h3 className="error-title">Analysis Could Not Complete</h3>
            <p className="error-message">{errorMsg}</p>
          </div>
          <div className="error-actions">
            <button type="button" className="btn-editorial-secondary" onClick={handleReset}>
              <RotateCcw size={14} aria-hidden="true" />
              <span>Try Another Resume</span>
            </button>
          </div>
        </section>
      )}

      {/* Structured Analysis Results View */}
      {analysisData && !isAnalyzing && (
        <section className="resume-results-stack" aria-label="Resume Analysis Results">
          {/* Results Summary Hero Card */}
          <div className="resume-hero-card">
            <div className="hero-top-row">
              <div className="target-role-badge">
                <Target size={14} aria-hidden="true" />
                <span>
                  {analysisData.targeted_role
                    ? `TARGET: ${analysisData.targeted_role.toUpperCase()}`
                    : 'GENERAL TECHNICAL ANALYSIS'}
                </span>
              </div>

              <button
                type="button"
                className="btn-editorial-secondary btn-sm"
                onClick={handleReset}
                aria-label="Analyze another resume"
              >
                <RotateCcw size={13} aria-hidden="true" />
                <span>Analyze Another Resume</span>
              </button>
            </div>

            <div className="hero-body-grid">
              {/* Score Numerals */}
              <div className="hero-score-column">
                <div className="hero-score-pill">
                  <span className="hero-score-num">{analysisData.overall_assessment?.score ?? 70}</span>
                  <span className="hero-score-unit">/ 100</span>
                </div>
                <span className="hero-score-label">
                  {analysisData.targeted_role ? 'Role Alignment & Evidence Index' : 'Technical Evidence Score'}
                </span>
              </div>

              {/* Executive Summary */}
              <div className="hero-summary-column">
                <h3 className="summary-heading">Executive Assessment</h3>
                <p className="summary-text">
                  {analysisData.overall_assessment?.summary}
                </p>
              </div>
            </div>
          </div>

          {/* Role Alignment Section (When a target role was specified) */}
          {analysisData.targeted_role && analysisData.role_alignment && (
            <div className="resume-content-card">
              <div className="card-header-row">
                <div className="card-title-group">
                  <Award size={18} className="card-icon-forest" aria-hidden="true" />
                  <h3 className="card-title">Role Alignment Analysis</h3>
                </div>
                <span className="card-badge">Target: {analysisData.targeted_role}</span>
              </div>

              <div className="role-alignment-grid">
                <div className="alignment-col col-strong">
                  <h4 className="col-heading">
                    <CheckCircle2 size={16} className="col-icon-green" aria-hidden="true" />
                    <span>Strong Evidence for Target Role</span>
                  </h4>
                  <ul className="alignment-list">
                    {(analysisData.role_alignment.strengths || []).map((s, idx) => (
                      <li key={idx} className="alignment-item">
                        <span>{s}</span>
                      </li>
                    ))}
                    {(analysisData.role_alignment.strengths || []).length === 0 && (
                      <li className="alignment-item empty-item">No strong role-specific evidence identified.</li>
                    )}
                  </ul>
                </div>

                <div className="alignment-col col-missing">
                  <h4 className="col-heading">
                    <AlertTriangle size={16} className="col-icon-amber" aria-hidden="true" />
                    <span>Missing or Weak Proof for Target Role</span>
                  </h4>
                  <ul className="alignment-list">
                    {(analysisData.role_alignment.missing_or_weak || []).map((m, idx) => (
                      <li key={idx} className="alignment-item">
                        <span>{m}</span>
                      </li>
                    ))}
                    {(analysisData.role_alignment.missing_or_weak || []).length === 0 && (
                      <li className="alignment-item empty-item">No critical role deficiencies identified.</li>
                    )}
                  </ul>
                </div>
              </div>

              {analysisData.role_alignment.analysis && (
                <div className="alignment-synthesis-box">
                  <p className="synthesis-text">{analysisData.role_alignment.analysis}</p>
                </div>
              )}
            </div>
          )}

          {/* Evidence vs Claims Grid (Core Differentiator) */}
          {analysisData.experience_and_evidence && (
            <div className="resume-content-card">
              <div className="card-header-row">
                <div className="card-title-group">
                  <Layers size={18} className="card-icon-forest" aria-hidden="true" />
                  <h3 className="card-title">Evidence vs. Unbacked Claims</h3>
                </div>
                <span className="card-badge">Proof Analysis</span>
              </div>

              <div className="evidence-claims-grid">
                {/* 1. Evidence That Lands */}
                <div className="evidence-col evidence-strong">
                  <div className="evidence-col-header">
                    <CheckCircle2 size={16} className="col-icon-green" aria-hidden="true" />
                    <h4>Evidence That Lands</h4>
                  </div>
                  <p className="evidence-col-desc">Concrete technical work with implementation context or measurable impact.</p>
                  <ul className="evidence-list">
                    {[
                      ...(analysisData.experience_and_evidence.strong_evidence || []),
                      ...(analysisData.projects?.strong || [])
                    ].map((item, idx) => (
                      <li key={idx} className="evidence-item strong-item">
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 2. Too Generic / Lacks Proof */}
                <div className="evidence-col evidence-generic">
                  <div className="evidence-col-header">
                    <HelpCircle size={16} className="col-icon-amber" aria-hidden="true" />
                    <h4>Too Generic / Buzzwords</h4>
                  </div>
                  <p className="evidence-col-desc">Superficial claims lacking implementation depth, scale, or metrics.</p>
                  <ul className="evidence-list">
                    {[
                      ...(analysisData.experience_and_evidence.weak_or_generic || []),
                      ...(analysisData.projects?.needs_improvement || [])
                    ].map((item, idx) => (
                      <li key={idx} className="evidence-item generic-item">
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 3. Underrepresented / Missing */}
                <div className="evidence-col evidence-missing">
                  <div className="evidence-col-header">
                    <AlertTriangle size={16} className="col-icon-red" aria-hidden="true" />
                    <h4>Underrepresented Evidence</h4>
                  </div>
                  <p className="evidence-col-desc">Areas where technical depth is claimed or expected but completely lacking proof.</p>
                  <ul className="evidence-list">
                    {(analysisData.experience_and_evidence.missing_evidence || []).map((item, idx) => (
                      <li key={idx} className="evidence-item missing-item">
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Skills Categorization */}
          {analysisData.skills && (
            <div className="resume-content-card">
              <div className="card-header-row">
                <div className="card-title-group">
                  <TrendingUp size={18} className="card-icon-forest" aria-hidden="true" />
                  <h3 className="card-title">Demonstrated Skills Breakdown</h3>
                </div>
              </div>

              <div className="skills-stack">
                {/* Strong Skills */}
                <div className="skills-row">
                  <span className="skills-category-label category-strong">Demonstrated with Evidence</span>
                  <div className="skills-tags-wrap">
                    {(analysisData.skills.strong || []).map((sk, idx) => (
                      <span key={idx} className="skill-tag tag-strong">
                        <CheckCircle2 size={12} aria-hidden="true" />
                        <span>{sk}</span>
                      </span>
                    ))}
                    {(analysisData.skills.strong || []).length === 0 && (
                      <span className="empty-tag-note">No strong evidenced skills identified.</span>
                    )}
                  </div>
                </div>

                {/* Moderate Skills */}
                <div className="skills-row">
                  <span className="skills-category-label category-moderate">Moderate / Mentioned</span>
                  <div className="skills-tags-wrap">
                    {(analysisData.skills.moderate || []).map((sk, idx) => (
                      <span key={idx} className="skill-tag tag-moderate">
                        <span>{sk}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing / Unclear Skills */}
                {(analysisData.skills.missing_or_unclear || []).length > 0 && (
                  <div className="skills-row">
                    <span className="skills-category-label category-missing">Missing or Claimed Without Proof</span>
                    <div className="skills-tags-wrap">
                      {(analysisData.skills.missing_or_unclear || []).map((sk, idx) => (
                        <span key={idx} className="skill-tag tag-missing">
                          <AlertTriangle size={12} aria-hidden="true" />
                          <span>{sk}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Resume Quality Metrics Grid */}
          {analysisData.resume_quality && (
            <div className="resume-content-card">
              <div className="card-header-row">
                <div className="card-title-group">
                  <Sliders size={18} className="card-icon-forest" aria-hidden="true" />
                  <h3 className="card-title">Technical Document Quality Metrics</h3>
                </div>
              </div>

              <div className="metrics-quad-grid">
                <div className="metric-card">
                  <span className="metric-card-score">{analysisData.resume_quality.clarity}</span>
                  <span className="metric-card-title">Clarity & Readability</span>
                  <p className="metric-card-desc">Structural organization, formatting consistency, and scanning clarity.</p>
                </div>

                <div className="metric-card">
                  <span className="metric-card-score">{analysisData.resume_quality.specificity}</span>
                  <span className="metric-card-title">Technical Specificity</span>
                  <p className="metric-card-desc">Depth of architectural context vs high-level general statements.</p>
                </div>

                <div className="metric-card">
                  <span className="metric-card-score">{analysisData.resume_quality.impact}</span>
                  <span className="metric-card-title">Measurable Impact</span>
                  <p className="metric-card-desc">Quantified engineering results, throughput, scale, or business metrics.</p>
                </div>

                <div className="metric-card">
                  <span className="metric-card-score">{analysisData.resume_quality.technical_evidence}</span>
                  <span className="metric-card-title">Verified Evidence Ratio</span>
                  <p className="metric-card-desc">Proportion of demonstrable achievements relative to unsubstantiated claims.</p>
                </div>
              </div>
            </div>
          )}

          {/* Priority Gaps */}
          {(analysisData.priority_gaps || []).length > 0 && (
            <div className="resume-content-card">
              <div className="card-header-row">
                <div className="card-title-group">
                  <AlertTriangle size={18} className="card-icon-amber" aria-hidden="true" />
                  <h3 className="card-title">High-Leverage Priority Gaps</h3>
                </div>
                <span className="card-badge">Fix First</span>
              </div>

              <div className="gaps-list-stack">
                {analysisData.priority_gaps.map((gapItem, idx) => (
                  <div key={idx} className="priority-gap-card">
                    <div className="gap-rank-badge">0{gapItem.priority || idx + 1}</div>
                    <div className="gap-content">
                      <h4 className="gap-title">{gapItem.gap}</h4>
                      <div className="gap-detail-grid">
                        <div className="gap-why-box">
                          <strong>Why it matters:</strong>
                          <p>{gapItem.why_it_matters}</p>
                        </div>
                        <div className="gap-action-box">
                          <strong>Recommended action:</strong>
                          <p>{gapItem.recommended_action}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Plan & Next Moves */}
          {(analysisData.action_plan || []).length > 0 && (
            <div className="resume-content-card">
              <div className="card-header-row">
                <div className="card-title-group">
                  <ChevronRight size={18} className="card-icon-forest" aria-hidden="true" />
                  <h3 className="card-title">Tactical Action Plan</h3>
                </div>
                <span className="card-badge">Next Moves</span>
              </div>

              <div className="action-plan-stack">
                {analysisData.action_plan.map((item, idx) => (
                  <div key={idx} className="action-plan-item">
                    <div className="action-step-num">Step {item.priority || idx + 1}</div>
                    <div className="action-step-body">
                      <strong className="action-step-title">{item.action}</strong>
                      <p className="action-step-reason">{item.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Return Action */}
          <div className="resume-bottom-actions">
            <button
              type="button"
              className="btn-editorial-secondary"
              onClick={handleReset}
            >
              <RotateCcw size={15} aria-hidden="true" />
              <span>Analyze Another Resume</span>
            </button>
            <button
              type="button"
              className="btn-forest-primary"
              onClick={onNavigateDashboard}
            >
              <span>Back to Dashboard</span>
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
