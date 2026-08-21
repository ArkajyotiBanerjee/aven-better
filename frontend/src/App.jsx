import { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, BookOpen, UploadCloud } from 'lucide-react';
import LectureHeader from './components/LectureHeader';
import CaptionPanel from './components/CaptionPanel';
import InsightPanel from './components/InsightPanel';
import ConceptTimeline from './components/ConceptTimeline';
import UploadSection from './components/UploadSection';
import QuizPanel from './components/QuizPanel';
import DiagnosisPanel from './components/DiagnosisPanel';
import BlindModePanel from './components/BlindModePanel';
import LearningSupportPanel from './components/LearningSupportPanel';
import CareerOSDashboard from './components/dashboard/CareerOSDashboard';
import GoogleAuthButton from './components/GoogleAuthButton';
import './App.css';

const API_BASE_URL = '';
const DEMO_LECTURE_ID = 'dsa-sliding-window-01';

const DEFAULT_DEMO_EVALUATION = {
  lecture_id: DEMO_LECTURE_ID,
  total_score: 4,
  total_questions: 5,
  percentage: 80.0,
  results: [
    {
      question_id: "q1",
      question: "What is the definition of the Sliding Window Method as described in the lecture?",
      is_correct: true,
      selected_answer: "A technique that slides a fixed-size window across an array, updating the sum in O(1) time per step.",
      correct_answer: "A technique that slides a fixed-size window across an array, updating the sum in O(1) time per step.",
      concept: "Sliding Window Method",
      skill: "recall",
      difficulty: "easy",
      explanation: "The lecture defines the Sliding Window Method as a technique that slides a fixed-size window across an array, updating the sum in O(1) time per step."
    },
    {
      question_id: "q2",
      question: "Which of the following is the correct Sum Update Formula presented in the lecture?",
      is_correct: true,
      selected_answer: "new_sum = old_sum + arr[k] - arr[0]",
      correct_answer: "new_sum = old_sum + arr[k] - arr[0]",
      concept: "Sum Update Formula",
      skill: "comprehension",
      difficulty: "medium",
      explanation: "The lecture states that the new window sum is calculated by adding the entering element arr[k] and subtracting the exiting element arr[0] from the old sum."
    },
    {
      question_id: "q3",
      question: "If the current window sum is 10, the element entering the window is 5, and the element leaving the window is 3, what is the new window sum?",
      is_correct: false,
      selected_answer: "8",
      correct_answer: "12",
      concept: "Sum Update",
      skill: "application",
      difficulty: "medium",
      explanation: "Using the Sum Update Formula: new_sum = old_sum + arr[k] - arr[0] = 10 + 5 - 3 = 12."
    },
    {
      question_id: "q4",
      question: "Which relationship best describes how the Sliding Window Method interacts with Sub Array according to the lecture?",
      is_correct: true,
      selected_answer: "uses",
      correct_answer: "uses",
      concept: "Sliding Window Method",
      skill: "comprehension",
      difficulty: "medium",
      explanation: "The lecture notes that the Sliding Window Method uses Sub Array to find the maximum sum subarray of size k."
    },
    {
      question_id: "q5",
      question: "Using the Sliding Window Method, what is the maximum sum of a subarray of size 3 in the array [1, 2, 3, 4, 5]?",
      is_correct: true,
      selected_answer: "12",
      correct_answer: "12",
      concept: "Sliding Window Method",
      skill: "application",
      difficulty: "hard",
      explanation: "The subarrays of size 3 are [1,2,3]=6, [2,3,4]=9, [3,4,5]=12. The maximum sum is 12."
    }
  ]
};

function App() {
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, transcribing, extracting, success, error
  const [errorMsg, setErrorMsg] = useState('');
  const [lectureData, setLectureData] = useState(null);
  
  // Top-level navigation state: 'dashboard' | 'lecture' | 'upload'
  const [appView, setAppView] = useState('dashboard');
  
  // Lecture-level view state: 'lecture' | 'quiz' | 'diagnosis'
  const [viewMode, setViewMode] = useState('lecture');
  const [accessibilityMode, setAccessibilityMode] = useState('deaf'); // 'deaf' | 'blind' | 'support'
  const [evaluationResults, setEvaluationResults] = useState(null);

  // Active interaction states for bidirectional linking
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(null);
  const [activeInsightId, setActiveInsightId] = useState(null);

  // Check authenticated session on startup
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        // Anonymous fallback
      }
    };
    verifyAuth();
  }, []);

  const handleLogin = (authenticatedUser) => {
    setUser(authenticatedUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setStatus('idle');
      setErrorMsg('');
      setLectureData(null);
      setViewMode('lecture');
      setAppView('upload');
    }
  };

  const handleReset = () => {
    setFile(null);
    setStatus('idle');
    setErrorMsg('');
    setLectureData(null);
    setViewMode('lecture');
    setAppView('upload');
    setActiveSegmentIndex(null);
    setActiveInsightId(null);
  };

  // Convert StructuredLecture payload into a normalized, categorized insights list
  const structuredInsights = useMemo(() => {
    if (!lectureData) return [];

    const list = [];

    // Concepts
    (lectureData.concepts || []).forEach((c, idx) => {
      list.push({
        id: `concept-${idx}`,
        type: 'concept',
        categoryLabel: 'NEW CONCEPT',
        icon: '🆕',
        title: c.name,
        timestamp_start: c.timestamp_start,
        timestamp_end: c.timestamp_end,
        evidence: c.evidence,
        data: c
      });
    });

    // Definitions
    (lectureData.definitions || []).forEach((d, idx) => {
      list.push({
        id: `definition-${idx}`,
        type: 'definition',
        categoryLabel: 'DEFINITION',
        icon: '📖',
        title: d.concept,
        timestamp_start: d.timestamp_start,
        timestamp_end: d.timestamp_end,
        evidence: d.evidence,
        data: d
      });
    });

    // Formulas
    (lectureData.formulas || []).forEach((f, idx) => {
      list.push({
        id: `formula-${idx}`,
        type: 'formula',
        categoryLabel: 'KEY FORMULA',
        icon: '🧮',
        title: f.name,
        timestamp_start: f.timestamp_start,
        timestamp_end: f.timestamp_end,
        evidence: f.evidence,
        data: f
      });
    });

    // Examples
    (lectureData.examples || []).forEach((ex, idx) => {
      list.push({
        id: `example-${idx}`,
        type: 'example',
        categoryLabel: 'WORKED EXAMPLE',
        icon: '💡',
        title: ex.topic,
        timestamp_start: ex.timestamp_start,
        timestamp_end: ex.timestamp_end,
        evidence: ex.evidence,
        data: ex
      });
    });

    // Important Points
    (lectureData.important_points || []).forEach((ip, idx) => {
      list.push({
        id: `point-${idx}`,
        type: 'important_point',
        categoryLabel: 'KEY POINT',
        icon: '⚠️',
        title: ip.point,
        timestamp_start: ip.timestamp_start,
        timestamp_end: ip.timestamp_end,
        evidence: ip.evidence,
        data: ip
      });
    });

    // Relationships
    (lectureData.relationships || []).forEach((r, idx) => {
      list.push({
        id: `relation-${idx}`,
        type: 'relationship',
        categoryLabel: 'RELATIONSHIP',
        icon: '🔗',
        title: `${r.source} ➔ ${r.target}`,
        timestamp_start: undefined,
        timestamp_end: undefined,
        evidence: r.evidence,
        data: r
      });
    });

    return list;
  }, [lectureData]);

  // Upload lecture video and automatically extract educational understanding
  const processLecture = async () => {
    if (!file) return;

    setStatus('uploading');
    setErrorMsg('');
    setLectureData(null);
    setViewMode('lecture');

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Step 1: Upload & Transcribe
      setStatus('transcribing');
      const uploadRes = await fetch(`${API_BASE_URL}/api/lectures/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to upload or transcribe lecture video');
      }

      const uploadData = await uploadRes.json();
      const lectureId = uploadData.lecture_id;

      // Step 2: Extract Educational Understanding
      setStatus('extracting');
      const extractRes = await fetch(`${API_BASE_URL}/api/lectures/${lectureId}/extract`, {
        method: 'POST',
      });

      if (!extractRes.ok) {
        const errorData = await extractRes.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to extract educational insights from lecture');
      }

      const extractedData = await extractRes.json();
      setLectureData(extractedData);
      setStatus('success');
      setAppView('lecture');
    } catch (error) {
      console.error(error);
      setStatus('error');
      setErrorMsg(error.message || 'An unexpected error occurred during processing.');
    }
  };

  // Demo loader for instant testing with Sliding Window DSA benchmark lecture
  const loadDemoLecture = async (targetViewMode = 'lecture') => {
    if (lectureData && status === 'success') {
      setViewMode(targetViewMode);
      setAppView('lecture');
      return lectureData;
    }

    setStatus('extracting');
    setErrorMsg('');
    setViewMode(targetViewMode);
    try {
      const res = await fetch(`${API_BASE_URL}/api/lectures/${DEMO_LECTURE_ID}/extract`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to load demo lecture.');
      }

      const data = await res.json();
      setLectureData(data);
      setStatus('success');
      setAppView('lecture');
      return data;
    } catch (error) {
      console.error(error);
      setStatus('error');
      setErrorMsg(error.message || 'Could not load demo lecture. Make sure backend is running.');
      return null;
    }
  };

  // Direct action from Dashboard Gap Card -> Launches Remediation Mini-Lesson
  const handleLaunchRemediation = async (gap) => {
    await loadDemoLecture('diagnosis');
    setEvaluationResults(prev => prev || DEFAULT_DEMO_EVALUATION);
    setViewMode('diagnosis');
    setAppView('lecture');
  };

  // Bidirectional interaction handlers
  const handleSelectSegment = (segIdx, seg) => {
    setActiveSegmentIndex(segIdx);

    // Find first matching insight that anchors to this timestamp
    const matchingInsight = structuredInsights.find(ins => {
      const start = ins.timestamp_start ?? 0;
      const end = ins.timestamp_end ?? 0;
      return (start <= seg.end && end >= seg.start);
    });

    if (matchingInsight) {
      setActiveInsightId(matchingInsight.id);
    }
  };

  const handleSelectInsight = (insight) => {
    setActiveInsightId(insight.id);

    // Sync to transcript segment matching timestamp_start
    if (insight.timestamp_start !== undefined && lectureData?.transcript) {
      const segIndex = lectureData.transcript.findIndex(
        s => insight.timestamp_start >= s.start && insight.timestamp_start <= s.end
      );

      if (segIndex !== -1) {
        setActiveSegmentIndex(segIndex);
      }
    }
  };

  return (
    <div className="accesslearn-app">
      {/* Top Application Global Brand Header */}
      <header className="global-app-nav" aria-label="Aven.better header">
        <div className="nav-container">
          <div className="nav-brand" onClick={() => setAppView('dashboard')} role="button" tabIndex="0">
            <span className="brand-logo-aven">Aven<span className="brand-dot">.</span>better</span>
            <span className="brand-sep">|</span>
            <span className="brand-subtitle">Learning Intelligence</span>
          </div>

          <div className="nav-auth-slot">
            <GoogleAuthButton
              user={user}
              onLogin={handleLogin}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </header>

      {/* Fixed Vertical Navigation Dock (Right-Mounted, Centered, Solid Deep Forest) */}
      <aside className="fixed-vertical-nav" aria-label="Primary navigation rail">
        <button
          type="button"
          className={`vert-nav-item ${appView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setAppView('dashboard')}
          aria-label="Navigate to Dashboard"
          aria-current={appView === 'dashboard' ? 'page' : undefined}
        >
          <LayoutDashboard size={20} className="vert-nav-icon" aria-hidden="true" />
          <span className="vert-nav-label">Dashboard</span>
        </button>

        <button
          type="button"
          className={`vert-nav-item ${appView === 'lecture' ? 'active' : ''}`}
          onClick={() => {
            if (lectureData) {
              setAppView('lecture');
            } else {
              loadDemoLecture('lecture');
            }
          }}
          aria-label="Navigate to Learning Studio"
          aria-current={appView === 'lecture' ? 'page' : undefined}
        >
          <BookOpen size={20} className="vert-nav-icon" aria-hidden="true" />
          <span className="vert-nav-label">Learning Studio</span>
        </button>

        <button
          type="button"
          className={`vert-nav-item ${appView === 'upload' ? 'active' : ''}`}
          onClick={() => setAppView('upload')}
          aria-label="Navigate to Ingest Video"
          aria-current={appView === 'upload' ? 'page' : undefined}
        >
          <UploadCloud size={20} className="vert-nav-icon" aria-hidden="true" />
          <span className="vert-nav-label">Ingest Video</span>
        </button>
      </aside>

      {/* Main View Router */}
      {appView === 'dashboard' ? (
        <CareerOSDashboard 
          onNavigateToLecture={(mode = 'lecture') => {
            loadDemoLecture(mode);
          }}
          onNavigateToUpload={() => setAppView('upload')}
          onLaunchRemediation={handleLaunchRemediation}
          onSelectAccessibilityMode={(mode) => {
            setAccessibilityMode(mode);
            loadDemoLecture('lecture');
          }}
          hasActiveLecture={Boolean(lectureData)}
          user={user}
        />
      ) : appView === 'upload' ? (
        <main id="main-content">
          <UploadSection
            file={file}
            onFileChange={handleFileChange}
            onProcessLecture={processLecture}
            onLoadDemo={() => loadDemoLecture('lecture')}
            status={status}
            errorMsg={errorMsg}
            onReset={handleReset}
          />
        </main>
      ) : (
        /* Lecture View (Deaf, Blind, Support, Quiz, Diagnosis) */
        <div className="learning-workspace">
          {status === 'success' && lectureData ? (
            viewMode === 'quiz' ? (
              <QuizPanel
                lectureId={lectureData.lecture_id}
                filename={lectureData.filename}
                onReturnToLecture={() => setViewMode('lecture')}
                onViewDiagnosis={(resData) => {
                  setEvaluationResults(resData);
                  setViewMode('diagnosis');
                  if (user && lectureData) {
                    fetch(`${API_BASE_URL}/api/user/progress`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({
                        lecture_id: lectureData.lecture_id,
                        latest_quiz_score: resData.percentage,
                        latest_quiz_data: resData,
                        readiness_score: resData.percentage >= 80 ? 88.1 : resData.percentage
                      })
                    }).catch(err => console.warn('Progress save notice:', err));
                  }
                }}
              />
            ) : viewMode === 'diagnosis' ? (
              <DiagnosisPanel
                lectureId={lectureData.lecture_id}
                filename={lectureData.filename}
                evaluationResults={evaluationResults || DEFAULT_DEMO_EVALUATION}
                onReturnToLecture={() => setViewMode('lecture')}
                onReturnToQuiz={() => setViewMode('quiz')}
              />
            ) : (
              <div className="learning-workspace-inner">
                <LectureHeader
                  filename={lectureData.filename || 'Lecture'}
                  onReset={handleReset}
                  onOpenQuiz={() => setViewMode('quiz')}
                  accessibilityMode={accessibilityMode}
                  onSelectMode={setAccessibilityMode}
                  onNavigateDashboard={() => setAppView('dashboard')}
                />

                {accessibilityMode === 'blind' ? (
                  <BlindModePanel
                    lectureData={lectureData}
                    onOpenQuiz={() => setViewMode('quiz')}
                  />
                ) : accessibilityMode === 'support' ? (
                  <LearningSupportPanel
                    lectureData={lectureData}
                    onOpenQuiz={() => setViewMode('quiz')}
                  />
                ) : (
                  <main className="learning-main" id="main-content">
                    <div className="workspace-columns">
                      <div className="column-captions">
                        <CaptionPanel
                          segments={lectureData.transcript || []}
                          activeSegmentIndex={activeSegmentIndex}
                          onSelectSegment={handleSelectSegment}
                          insights={structuredInsights}
                        />
                      </div>

                      <div className="column-insights">
                        <InsightPanel
                          insights={structuredInsights}
                          activeInsightId={activeInsightId}
                          onSelectInsight={handleSelectInsight}
                        />
                      </div>
                    </div>

                    <ConceptTimeline
                      timelineItems={structuredInsights.filter(i => i.timestamp_start !== undefined)}
                      activeInsightId={activeInsightId}
                      onSelectTimelineItem={handleSelectInsight}
                    />
                  </main>
                )}
              </div>
            )
          ) : (
            <main id="main-content">
              <UploadSection
                file={file}
                onFileChange={handleFileChange}
                onProcessLecture={processLecture}
                onLoadDemo={() => loadDemoLecture('lecture')}
                status={status}
                errorMsg={errorMsg}
                onReset={handleReset}
              />
            </main>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
