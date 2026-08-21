import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  AlertTriangle, 
  RotateCcw, 
  BookOpen, 
  ArrowRight,
  Compass
} from 'lucide-react';
import LivingTechnicalField from './LivingTechnicalField';
import CapabilityMarquee from './CapabilityMarquee';
import ReadinessHero from './ReadinessHero';
import NextBestAction from './NextBestAction';
import ReadinessDimensions from './ReadinessDimensions';
import LearningGaps from './LearningGaps';
import MissionList from './MissionList';
import AchievementGrid from './AchievementGrid';
import RecentActivity from './RecentActivity';

const API_BASE_URL = 'http://localhost:8000';

export default function CareerOSDashboard({
  onNavigateToLecture,
  onNavigateToUpload,
  onLaunchRemediation,
  onSelectAccessibilityMode,
  hasActiveLecture = false
}) {
  const [dashboardData, setDashboardData] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  const fetchDashboardData = async () => {
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboard`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to load Aven.better dashboard analytics.');
      }
      const data = await res.json();
      setDashboardData(data);
      setStatus('ready');
    } catch (e) {
      console.error('Dashboard fetch error:', e);
      setStatus('error');
      setErrorMsg(e.message || 'Could not connect to dashboard service.');
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleExecuteMission = (mission) => {
    if (mission.action_type === 'open_remediation') {
      if (onLaunchRemediation) {
        onLaunchRemediation({
          lecture_id: mission.lecture_id,
          concept: mission.title,
          skill: 'application'
        });
      }
    } else if (mission.action_type === 'open_mode') {
      if (onSelectAccessibilityMode) {
        onSelectAccessibilityMode(mission.metadata?.mode || 'blind');
      } else if (onNavigateToLecture) {
        onNavigateToLecture('lecture');
      }
    } else if (mission.action_type === 'open_quiz') {
      if (onNavigateToLecture) {
        onNavigateToLecture('quiz');
      }
    } else {
      if (onNavigateToLecture) {
        onNavigateToLecture('lecture');
      }
    }
  };

  return (
    <div className="aven-dashboard-root" role="main" aria-label="Aven.better Learning & Readiness Dashboard">
      {/* Living Technical Background Field (Behind first viewport) */}
      <LivingTechnicalField />

      {/* Top Banner / Welcome Ribbon */}
      <header className="dashboard-top-ribbon">
        <div className="ribbon-brand-group">
          <div className="aven-logo-mark" aria-hidden="true">
            <Compass size={18} />
          </div>
          <div>
            <div className="brand-title-row">
              <span className="brand-name-main">Aven<span className="brand-name-dot">.</span>better</span>
              <span className="brand-subtag">Learning Intelligence</span>
            </div>
            <p className="brand-welcome">
              Welcome back, <strong>{dashboardData?.profile?.name || 'Learner'}</strong>. Real-time competency evaluation.
            </p>
          </div>
        </div>

        <div className="ribbon-actions-group">
          <button
            type="button"
            className="btn-editorial-secondary btn-sm"
            onClick={onNavigateToUpload}
            aria-label="Upload and transcribe technical video"
          >
            <span>+ Ingest Video</span>
          </button>

          <button
            type="button"
            className="btn-forest-primary btn-sm btn-nav-lecture"
            onClick={() => onNavigateToLecture && onNavigateToLecture('lecture')}
            aria-label="Open Aven.better technical learning studio"
          >
            <BookOpen size={14} aria-hidden="true" />
            <span>{hasActiveLecture ? 'Resume Learning Studio' : 'Open Learning Studio (DSA Demo)'}</span>
            <ArrowRight size={13} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="dashboard-content-container">
        {status === 'loading' && (
          <div className="dashboard-loading-state" role="status">
            <Loader2 size={38} className="animated-spinner" aria-hidden="true" />
            <h2 className="loading-title">Aggregating CareerOS Readiness Metrics...</h2>
            <p className="loading-desc">
              Analyzing lecture extractions, question-level skill attempts, and learning gap reports.
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="dashboard-error-state" role="alert">
            <div className="error-icon" aria-hidden="true">
              <AlertTriangle size={32} />
            </div>
            <h2 className="error-title">Dashboard Offline</h2>
            <p className="error-message">{errorMsg}</p>
            <div className="error-actions">
              <button 
                type="button" 
                className="btn-primary" 
                onClick={fetchDashboardData}
              >
                <RotateCcw size={15} aria-hidden="true" />
                <span>Retry Connection</span>
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => onNavigateToLecture && onNavigateToLecture('lecture')}
              >
                <span>Continue to Lecture Studio</span>
              </button>
            </div>
          </div>
        )}

        {status === 'ready' && dashboardData && (
          <div className="dashboard-views-stack">
            {/* Capability Marquee (Continuous living capability strip) */}
            <CapabilityMarquee />

            {/* 1. Readiness Hero & Narrative Summary */}
            <ReadinessHero 
              readiness={dashboardData.readiness} 
              profile={dashboardData.profile}
              onStartLearning={() => onNavigateToLecture && onNavigateToLecture('lecture')}
            />

            {/* 2. NEXT BEST ACTION (Highest Visual Priority Decision Driver) */}
            <NextBestAction
              activeGaps={dashboardData.active_gaps || []}
              dimensions={dashboardData.readiness?.dimensions || []}
              overallScore={dashboardData.readiness?.overall_score || 0}
              onLaunchRemediation={onLaunchRemediation}
              onOpenAssessment={() => onNavigateToLecture && onNavigateToLecture('quiz')}
              onIngestLecture={onNavigateToUpload}
            />

            {/* 3. Competency Dimensions Matrix */}
            <ReadinessDimensions 
              dimensions={dashboardData.readiness?.dimensions || []} 
            />

            {/* 4. Active Learning Gaps & Grounded Evidence */}
            <LearningGaps 
              activeGaps={dashboardData.active_gaps || []} 
              onLaunchRemediation={onLaunchRemediation}
            />

            {/* 5. Supporting Intelligence: Missions & Verified Milestones */}
            <div className="dashboard-split-grid">
              <div className="dashboard-split-column">
                <MissionList 
                  missions={dashboardData.missions || []} 
                  onExecuteMission={handleExecuteMission}
                />
              </div>

              <div className="dashboard-split-column">
                <AchievementGrid 
                  achievements={dashboardData.achievements || []} 
                />
              </div>
            </div>

            {/* 6. Recent Activity Feed */}
            <RecentActivity 
              recentActivity={dashboardData.recent_activity || []} 
              onOpenLecture={() => onNavigateToLecture && onNavigateToLecture('lecture')}
            />
          </div>
        )}
      </div>
    </div>
  );
}
