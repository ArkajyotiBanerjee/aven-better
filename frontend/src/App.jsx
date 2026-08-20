import { useState, useMemo } from 'react';
import LectureHeader from './components/LectureHeader';
import CaptionPanel from './components/CaptionPanel';
import InsightPanel from './components/InsightPanel';
import ConceptTimeline from './components/ConceptTimeline';
import UploadSection from './components/UploadSection';
import QuizPanel from './components/QuizPanel';
import DiagnosisPanel from './components/DiagnosisPanel';
import BlindModePanel from './components/BlindModePanel';
import LearningSupportPanel from './components/LearningSupportPanel';
import './App.css';

const API_BASE_URL = 'http://localhost:8000';
const DEMO_LECTURE_ID = '75128b27-d0d3-49be-852b-1f397985cc38';

function App() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, transcribing, extracting, success, error
  const [errorMsg, setErrorMsg] = useState('');
  const [lectureData, setLectureData] = useState(null);
  const [viewMode, setViewMode] = useState('lecture'); // 'lecture' | 'quiz' | 'diagnosis'
  const [accessibilityMode, setAccessibilityMode] = useState('deaf'); // 'deaf' | 'blind' | 'support'
  const [evaluationResults, setEvaluationResults] = useState(null);

  // Active interaction states for bidirectional linking
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(null);
  const [activeInsightId, setActiveInsightId] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setStatus('idle');
      setErrorMsg('');
      setLectureData(null);
      setViewMode('lecture');
    }
  };

  const handleReset = () => {
    setFile(null);
    setStatus('idle');
    setErrorMsg('');
    setLectureData(null);
    setViewMode('lecture');
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
    } catch (error) {
      console.error(error);
      setStatus('error');
      setErrorMsg(error.message || 'An unexpected error occurred during processing.');
    }
  };

  // Demo loader for instant testing with Newton's Second Law lecture
  const loadDemoLecture = async () => {
    setStatus('extracting');
    setErrorMsg('');
    setViewMode('lecture');
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
    } catch (error) {
      console.error(error);
      setStatus('error');
      setErrorMsg(error.message || 'Could not load demo lecture. Make sure backend is running.');
    }
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
      {status === 'success' && lectureData ? (
        viewMode === 'quiz' ? (
          <QuizPanel
            lectureId={lectureData.lecture_id}
            filename={lectureData.filename}
            onReturnToLecture={() => setViewMode('lecture')}
            onViewDiagnosis={(resData) => {
              setEvaluationResults(resData);
              setViewMode('diagnosis');
            }}
          />
        ) : viewMode === 'diagnosis' ? (
          <DiagnosisPanel
            lectureId={lectureData.lecture_id}
            filename={lectureData.filename}
            evaluationResults={evaluationResults}
            onReturnToLecture={() => setViewMode('lecture')}
            onReturnToQuiz={() => setViewMode('quiz')}
          />
        ) : (
          <div className="learning-workspace">
            <LectureHeader
              filename={lectureData.filename || 'Lecture'}
              onReset={handleReset}
              onOpenQuiz={() => setViewMode('quiz')}
              accessibilityMode={accessibilityMode}
              onSelectMode={setAccessibilityMode}
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
            onLoadDemo={loadDemoLecture}
            status={status}
            errorMsg={errorMsg}
            onReset={handleReset}
          />
        </main>
      )}
    </div>
  );
}

export default App;
