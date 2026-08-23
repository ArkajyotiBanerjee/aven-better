import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Brain,
  Terminal,
  ShieldCheck,
  ChevronRight,
  LayoutDashboard,
  Layers,
  Code2,
  Globe,
  Cpu,
  FileText,
  UploadCloud,
  Camera,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Sliders,
  Target,
  Loader2,
  Volume2,
  VolumeX,
  Square,
  Radio,
  Edit3
} from 'lucide-react';
import {
  speakText as sharedSpeakText,
  cancelSpeech,
  isSpeechSynthesisSupported,
  isSpeechRecognitionSupported,
  getSpeechRecognitionClass
} from '../../utils/speechSynthesis';

const API_BASE_URL = '';

const ROLE_OPTIONS = [
  { label: 'Software Development Engineer (SDE)', value: 'Software Development Engineer' },
  { label: 'Frontend Developer', value: 'Frontend Developer' },
  { label: 'Backend Developer', value: 'Backend Developer' },
  { label: 'Full Stack Developer', value: 'Full Stack Developer' },
  { label: 'Data Analyst', value: 'Data Analyst' },
  { label: 'Data Scientist', value: 'Data Scientist' },
  { label: 'DevOps & Cloud Engineer', value: 'DevOps Engineer' },
  { label: 'Mobile Developer (iOS / Android)', value: 'Mobile Developer' },
  { label: 'Product / Technical Analyst', value: 'Product Analyst' },
  { label: 'Custom Role...', value: 'custom' },
];

const TOPICS = [
  {
    id: 'Data Structures & Algorithms',
    title: 'Data Structures & Algorithms',
    desc: 'Arrays, pointers, trees, graphs, space-time complexity, and algorithmic trade-offs.',
    icon: Layers,
  },
  {
    id: 'JavaScript',
    title: 'JavaScript & Web Runtimes',
    desc: 'Event loop, closures, prototypes, asynchronous concurrency, and memory management.',
    icon: Code2,
  },
  {
    id: 'Web Development',
    title: 'Full-Stack Web Architecture',
    desc: 'Critical rendering path, caching, SSR vs CSR, browser security, and HTTP protocols.',
    icon: Globe,
  },
  {
    id: 'Computer Science Fundamentals',
    title: 'Computer Science Fundamentals',
    desc: 'Operating systems, threads/processes, ACID transactions, and distributed consensus.',
    icon: Cpu,
  },
];

const DIFFICULTIES = [
  { id: 'Foundational', label: 'Foundational', desc: 'Core definitions, basic mechanics & direct comparisons' },
  { id: 'Intermediate', label: 'Intermediate', desc: 'Real-world problem solving, trade-offs & edge cases' },
  { id: 'Advanced', label: 'Advanced', desc: 'System-level constraints, scale anomalies & architectural reasoning' },
];

export default function AIInterview({ onNavigateDashboard, user }) {
  // Flow Stages: 'setup' | 'preflight' | 'interview' | 'report'
  const [stage, setStage] = useState('setup');

  // Setup Form State
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeContext, setResumeContext] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Software Development Engineer');
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('Data Structures & Algorithms');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Intermediate');

  // Media & Preflight State
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const [mediaStream, setMediaStream] = useState(null);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);

  // Active Interview State
  const [sessionId, setSessionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [roundNumber, setRoundNumber] = useState(1);
  const [userAnswer, setUserAnswer] = useState('');
  const [latestEvaluation, setLatestEvaluation] = useState(null);
  const [history, setHistory] = useState([]);
  const [finalReport, setFinalReport] = useState(null);

  // Voice & TTS State (Phase II)
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [answerMode, setAnswerMode] = useState('voice'); // 'voice' | 'type'
  const [voiceError, setVoiceError] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');

  // Status & Loading
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Refs
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const pipVideoRef = useRef(null);
  const responseInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const baseAnswerRef = useRef('');
  const currentSessionTranscriptRef = useRef('');

  // Browser capability check on mount
  useEffect(() => {
    const hasSpeechRec = isSpeechRecognitionSupported();
    setSpeechRecognitionSupported(hasSpeechRec);
    if (!hasSpeechRec) {
      setAnswerMode('type');
    }
  }, []);

  // Ensure camera stream is attached whenever video elements become available
  useEffect(() => {
    if (mediaStream) {
      if (videoRef.current && videoRef.current.srcObject !== mediaStream) {
        videoRef.current.srcObject = mediaStream;
      }
      if (pipVideoRef.current && pipVideoRef.current.srcObject !== mediaStream) {
        pipVideoRef.current.srcObject = mediaStream;
      }
    }
  }, [mediaStream, stage]);

  // Clean up media streams and speech on unmount
  useEffect(() => {
    return () => {
      stopMediaStream();
      stopVoiceRecognition();
      cancelSpeech();
    };
  }, []);

  const stopMediaStream = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
    setCameraActive(false);
    setMicActive(false);
  };

  // Drag & drop handlers
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
      validateAndSetResume(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetResume(e.target.files[0]);
    }
  };

  const validateAndSetResume = (file) => {
    setErrorMsg('');
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Unsupported file format. Please select a PDF document (.pdf).');
      setResumeFile(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Resume file exceeds the 10MB size limit. Please upload a smaller PDF.');
      setResumeFile(null);
      return;
    }
    setResumeFile(file);
    setResumeContext('');
  };

  const getEffectiveRole = () => {
    if (selectedRole === 'custom') {
      return customRoleInput.trim() || 'Software Development Engineer';
    }
    return selectedRole;
  };

  // Step 1: Proceed to Preflight (Extract Resume Context + Request Media)
  const handleProceedToPreflight = async () => {
    if (!resumeFile) {
      setErrorMsg('A technical resume (PDF) is required to ground your technical interview.');
      return;
    }

    setLoading(true);
    setLoadingMsg('Extracting technical evidence & project context from resume...');
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('targeted_role', getEffectiveRole());

      const res = await fetch(`${API_BASE_URL}/api/interview/extract-context`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Could not extract readable technical context from PDF.');
      }

      const data = await res.json();
      setResumeContext(data.resume_context || '');
      setStage('preflight');

      // Initialize media streams for preflight
      await initMediaCheck();
    } catch (err) {
      console.error('Resume context extraction error:', err);
      setErrorMsg(err.message || 'Failed to process resume. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  // Request Camera & Microphone access
  const initMediaCheck = async () => {
    setMediaError('');
    stopMediaStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMediaError('Media devices API is not supported in this browser. Please use a modern browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });

      setMediaStream(stream);
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();

      setCameraActive(videoTracks.length > 0 && videoTracks[0].readyState === 'live');
      setMicActive(audioTracks.length > 0 && audioTracks[0].readyState === 'live');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera/Mic permission notice:', err);
      setCameraActive(false);
      setMicActive(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMediaError('Camera and microphone permissions were denied. Please allow access in your browser to proceed.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setMediaError('No camera or microphone device detected on this system.');
      } else {
        setMediaError(`Media initialization error: ${err.message || 'Please check device permissions.'}`);
      }
    }
  };

  // TTS: Speak the interviewer question
  const speakQuestion = (questionText) => {
    if (!questionText || !isSpeechSynthesisSupported()) return;

    cancelSpeech();
    setIsSpeakingQuestion(true);

    sharedSpeakText(questionText, {
      rate: 1.0,
      pitch: 1.0,
      lang: 'en-US',
      onEnd: () => setIsSpeakingQuestion(false),
      onError: (e) => {
        console.warn('Interviewer TTS error:', e);
        setIsSpeakingQuestion(false);
      }
    });
  };

  const handleStopQuestionSpeech = () => {
    cancelSpeech();
    setIsSpeakingQuestion(false);
  };

  // Speech Recognition (Candidate Voice Answer)
  const startVoiceRecognition = () => {
    setVoiceError('');
    stopVoiceRecognition();

    const SpeechRecClass = getSpeechRecognitionClass();
    if (!SpeechRecClass) {
      setVoiceError("Voice input is not supported in this browser. You can type your answer instead.");
      setAnswerMode('type');
      return;
    }

    // Save existing text as base for this speech session
    baseAnswerRef.current = userAnswer;
    currentSessionTranscriptRef.current = '';

    try {
      const recognition = new SpeechRecClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceError('');
      };

      recognition.onresult = (event) => {
        const finalChunks = [];
        const interimChunks = [];

        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res && res[0] && res[0].transcript) {
            const textPiece = res[0].transcript;
            if (res.isFinal) {
              finalChunks.push(textPiece.trim());
            } else {
              interimChunks.push(textPiece.trim());
            }
          }
        }

        const sessionFinal = finalChunks.join(' ').trim();
        const sessionInterim = interimChunks.join(' ').trim();

        let sessionTotal = sessionFinal;
        if (sessionInterim) {
          sessionTotal = sessionTotal ? `${sessionTotal} ${sessionInterim}` : sessionInterim;
        }

        currentSessionTranscriptRef.current = sessionTotal;

        // Combine base answer with live recognized transcript
        const base = baseAnswerRef.current ? baseAnswerRef.current.trim() : '';
        let combined = base;
        if (sessionTotal) {
          combined = combined ? `${combined} ${sessionTotal}` : sessionTotal;
        }

        setUserAnswer(combined);
      };

      recognition.onerror = (event) => {
        console.warn('SpeechRecognition event error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setVoiceError('Microphone permission was denied. Please allow microphone access or switch to typed responses.');
        } else if (event.error === 'no-speech') {
          // Subtle timeout - keep ready
        } else {
          setVoiceError(`Voice input notice (${event.error}). You can continue speaking or edit your response below.`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        // Ensure all recognized text from this session is permanently committed
        if (currentSessionTranscriptRef.current) {
          const sessionText = currentSessionTranscriptRef.current.trim();
          const base = baseAnswerRef.current ? baseAnswerRef.current.trim() : '';
          let finalCombined = base;
          if (sessionText) {
            finalCombined = finalCombined ? `${finalCombined} ${sessionText}` : sessionText;
          }
          if (finalCombined) {
            setUserAnswer(finalCombined);
            baseAnswerRef.current = finalCombined;
          }
        }
        currentSessionTranscriptRef.current = '';
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn('Failed to start speech recognition:', e);
      setVoiceError('Could not initialize voice input. You can type your response instead.');
      setIsListening(false);
    }
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignored
      }
      recognitionRef.current = null;
    }
    setIsListening(false);

    // Commit any session transcript into final answer
    if (currentSessionTranscriptRef.current) {
      const sessionText = currentSessionTranscriptRef.current.trim();
      const base = baseAnswerRef.current ? baseAnswerRef.current.trim() : '';
      let finalCombined = base;
      if (sessionText) {
        finalCombined = finalCombined ? `${finalCombined} ${sessionText}` : sessionText;
      }
      if (finalCombined) {
        setUserAnswer(finalCombined);
        baseAnswerRef.current = finalCombined;
      }
    }
    currentSessionTranscriptRef.current = '';
  };

  // Step 2: Start Interview from Preflight
  const handleStartInterview = async () => {
    if (!cameraActive || !micActive) {
      setMediaError('Both camera and microphone access must be verified before entering the interview chamber.');
      return;
    }

    setLoading(true);
    setLoadingMsg('Initializing technical interview chamber & generating grounded Round 1 inquiry...');
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/interview/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          topic: selectedTopic,
          difficulty: selectedDifficulty,
          targeted_role: getEffectiveRole(),
          resume_context: resumeContext,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to start interview.');
      }

      const data = await res.json();
      setSessionId(data.session_id);
      setCurrentQuestion(data.initial_question);
      setRoundNumber(1);
      setUserAnswer('');
      setLatestEvaluation(null);
      setHistory([]);
      setFinalReport(null);
      setStage('interview');

      // Auto-speak initial question
      setTimeout(() => {
        speakQuestion(data.initial_question.question_text);
      }, 400);
    } catch (e) {
      console.error('Start interview error:', e);
      setErrorMsg(e.message || 'Could not initiate interview session.');
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  // Step 3: Submit answer
  const handleSubmitAnswer = async () => {
    stopVoiceRecognition();
    cancelSpeech();

    if (!userAnswer.trim()) {
      setErrorMsg('Please articulate your response before submitting.');
      return;
    }

    setLoading(true);
    setLoadingMsg(
      roundNumber === 5
        ? 'Evaluating final round & synthesizing comprehensive interview readiness report...'
        : 'Evaluating reasoning depth & preparing adaptive follow-up...'
    );
    setErrorMsg('');

    try {
      const payload = {
        session_id: sessionId,
        topic: selectedTopic,
        difficulty: selectedDifficulty,
        current_round: roundNumber,
        question_text: currentQuestion.question_text,
        answer_text: userAnswer.trim(),
        history: history,
        targeted_role: getEffectiveRole(),
        resume_context: resumeContext,
      };

      const res = await fetch(`${API_BASE_URL}/api/interview/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to evaluate response.');
      }

      const data = await res.json();
      const evalData = data.evaluation;

      const newTurn = {
        round_number: roundNumber,
        question: currentQuestion.question_text,
        answer: userAnswer.trim(),
        assessment: evalData?.assessment,
        strengths: evalData?.strengths,
        gaps: evalData?.gaps,
      };
      setHistory((prev) => [...prev, newTurn]);
      setLatestEvaluation(evalData);

      if (data.is_final_round && data.final_report) {
        setFinalReport(data.final_report);
        setStage('report');
        stopMediaStream();
        stopVoiceRecognition();
        cancelSpeech();
      } else if (data.next_question) {
        setCurrentQuestion(data.next_question);
        setRoundNumber(data.next_question.round_number);
        setUserAnswer('');
        setInterimTranscript('');
        baseAnswerRef.current = '';
        currentSessionTranscriptRef.current = '';
        // Auto-speak next question
        setTimeout(() => {
          speakQuestion(data.next_question.question_text);
        }, 400);
      }
    } catch (e) {
      console.error('Submit answer error:', e);
      setErrorMsg(e.message || 'Could not submit answer. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!loading) {
        handleSubmitAnswer();
      }
    }
  };

  const handleResetToSetup = () => {
    stopMediaStream();
    stopVoiceRecognition();
    cancelSpeech();
    setStage('setup');
    setUserAnswer('');
    setInterimTranscript('');
    baseAnswerRef.current = '';
    currentSessionTranscriptRef.current = '';
    setLatestEvaluation(null);
    setHistory([]);
    setFinalReport(null);
    setErrorMsg('');
    setMediaError('');
    setVoiceError('');
    setIsSpeakingQuestion(false);
  };

  return (
    <div className="interview-page-container" role="main" aria-label="AI Technical Interview">
      {/* =========================================================================
          STAGE 1: RESUME-GROUNDED SETUP
          ========================================================================= */}
      {stage === 'setup' && (
        <div className="interview-setup-wrapper animate-fadeIn">
          {/* Header section */}
          <div className="interview-hero-header">
            <div className="interview-hero-badge">
              <Sparkles size={14} className="sparkle-icon" aria-hidden="true" />
              <span>AI Interview 2.0 • Resume Grounded & Voice Ready</span>
            </div>
            <h1 className="interview-hero-title">
              Prove your engineering depth. <span className="title-accent">Ground inquiries in your real work.</span>
            </h1>
            <p className="interview-hero-sub">
              Upload your technical resume to anchor your adaptive 5-round technical interview in your actual projects, architectural decisions, and target engineering direction.
            </p>
          </div>

          {/* Setup Configuration Form */}
          <div className="interview-config-card">
            {/* Step 1: Upload Technical Resume (REQUIRED) */}
            <div className="config-section">
              <label className="config-label">
                <span className="config-step-num">1</span>
                <span>Upload Technical Resume (PDF Required)</span>
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="sr-only"
                onChange={handleFileSelect}
              />

              {!resumeFile ? (
                <div
                  className={`interview-resume-dropzone ${dragActive ? 'drag-active' : ''}`}
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
                  <div className="dropzone-icon-wrap" aria-hidden="true">
                    <UploadCloud size={32} />
                  </div>
                  <div className="dropzone-text-group">
                    <strong>Drop your technical resume here or click to browse</strong>
                    <span>PDF format required • Up to 10 MB</span>
                  </div>
                </div>
              ) : (
                <div className="interview-selected-resume-card">
                  <div className="resume-card-left">
                    <FileText size={22} className="resume-icon-forest" aria-hidden="true" />
                    <div className="resume-card-info">
                      <span className="resume-filename">{resumeFile.name}</span>
                      <span className="resume-filesize">{(resumeFile.size / (1024 * 1024)).toFixed(2)} MB • PDF Verified</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-text-remove-resume"
                    onClick={() => {
                      setResumeFile(null);
                      setResumeContext('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    disabled={loading}
                    aria-label="Change uploaded resume"
                  >
                    ✕ Change File
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Select Targeted Role */}
            <div className="config-section">
              <label className="config-label">
                <span className="config-step-num">2</span>
                <span>Targeted Career Direction</span>
              </label>
              <div className="role-selector-wrap">
                <select
                  className="editorial-select"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  disabled={loading}
                  aria-label="Select target role"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {selectedRole === 'custom' && (
                  <div className="custom-role-input-wrap">
                    <input
                      type="text"
                      className="editorial-input"
                      placeholder="e.g. Distributed Systems Infrastructure Engineer"
                      value={customRoleInput}
                      onChange={(e) => setCustomRoleInput(e.target.value)}
                      maxLength={100}
                      disabled={loading}
                      aria-label="Enter custom target role"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Select Technical Domain */}
            <div className="config-section">
              <label className="config-label">
                <span className="config-step-num">3</span>
                <span>Technical Focus Area</span>
              </label>
              <div className="topic-grid">
                {TOPICS.map((topic) => {
                  const Icon = topic.icon;
                  const isSelected = selectedTopic === topic.id;
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      className={`topic-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedTopic(topic.id)}
                      aria-pressed={isSelected}
                    >
                      <div className="topic-card-icon" aria-hidden="true">
                        <Icon size={20} />
                      </div>
                      <div className="topic-card-body">
                        <div className="topic-card-title">{topic.title}</div>
                        <div className="topic-card-desc">{topic.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 4: Select Interview Rigor */}
            <div className="config-section">
              <label className="config-label">
                <span className="config-step-num">4</span>
                <span>Interview Rigor</span>
              </label>
              <div className="difficulty-grid">
                {DIFFICULTIES.map((diff) => {
                  const isSelected = selectedDifficulty === diff.id;
                  return (
                    <button
                      key={diff.id}
                      type="button"
                      className={`difficulty-pill ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedDifficulty(diff.id)}
                      aria-pressed={isSelected}
                    >
                      <div className="diff-name">{diff.label}</div>
                      <div className="diff-desc">{diff.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="interview-error-banner" role="alert">
                <AlertCircle size={16} aria-hidden="true" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Action Bar */}
            <div className="config-action-row">
              <button
                type="button"
                className="btn-start-interview"
                onClick={handleProceedToPreflight}
                disabled={loading || !resumeFile}
                aria-label="Continue to Camera and Microphone Preflight"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animated-spinner" aria-hidden="true" />
                    <span>{loadingMsg || 'Processing Resume Evidence...'}</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Camera & Mic Preflight</span>
                    <ArrowRight size={18} aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          STAGE 2: CAMERA + MICROPHONE PREFLIGHT
          ========================================================================= */}
      {stage === 'preflight' && (
        <div className="interview-preflight-wrapper animate-fadeIn">
          {/* Header */}
          <div className="preflight-header">
            <div className="preflight-badge">
              <ShieldCheck size={14} aria-hidden="true" />
              <span>Step 2 of 2: Hardware Preflight</span>
            </div>
            <h1 className="preflight-title">Camera & Audio Verification</h1>
            <p className="preflight-sub">
              Verify your camera stream and microphone presence before stepping into the 5-round technical interview chamber.
            </p>
          </div>

          {/* Context Grounding Summary Banner */}
          <div className="preflight-grounding-banner">
            <div className="grounding-item">
              <Target size={14} className="grounding-icon" aria-hidden="true" />
              <span>Target Role: <strong>{getEffectiveRole()}</strong></span>
            </div>
            <div className="grounding-item">
              <FileText size={14} className="grounding-icon" aria-hidden="true" />
              <span>Grounded Resume: <strong>{resumeFile?.name}</strong></span>
            </div>
            <div className="grounding-item">
              <Layers size={14} className="grounding-icon" aria-hidden="true" />
              <span>Domain: <strong>{selectedTopic}</strong> ({selectedDifficulty})</span>
            </div>
          </div>

          {/* Preflight Dual Column */}
          <div className="preflight-main-card">
            <div className="preflight-grid">
              {/* Left Column: Camera Preview Box */}
              <div className="camera-preview-pane">
                <div className="camera-frame-box">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`camera-video-feed ${cameraActive ? 'feed-live' : 'feed-offline'}`}
                    aria-label="Candidate live camera preview"
                  />
                  {!cameraActive && (
                    <div className="camera-offline-overlay">
                      <VideoOff size={44} className="icon-offline" aria-hidden="true" />
                      <span>Camera Preview Inactive</span>
                    </div>
                  )}
                  <div className="camera-live-pill">
                    {cameraActive ? (
                      <>
                        <span className="live-dot dot-green" aria-hidden="true"></span>
                        <span>Camera Active</span>
                      </>
                    ) : (
                      <>
                        <span className="live-dot dot-red" aria-hidden="true"></span>
                        <span>Camera Offline</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Preflight Status Checklist */}
              <div className="preflight-status-pane">
                <h3 className="status-pane-heading">Media Readiness Checklist</h3>

                <div className="status-checklist">
                  {/* Camera Status Item */}
                  <div className={`status-item ${cameraActive ? 'status-pass' : 'status-fail'}`}>
                    <div className="status-item-icon" aria-hidden="true">
                      {cameraActive ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                    </div>
                    <div className="status-item-text">
                      <strong>Camera Stream</strong>
                      <span>{cameraActive ? 'Live video feed verified.' : 'Camera access required for interview presence.'}</span>
                    </div>
                  </div>

                  {/* Microphone Status Item */}
                  <div className={`status-item ${micActive ? 'status-pass' : 'status-fail'}`}>
                    <div className="status-item-icon" aria-hidden="true">
                      {micActive ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                    </div>
                    <div className="status-item-text">
                      <strong>Microphone Input</strong>
                      <span>{micActive ? 'Audio stream active & connected.' : 'Microphone access required for speech input.'}</span>
                    </div>
                  </div>

                  {/* Speech Recognition Engine Capability Status */}
                  <div className="status-item status-info">
                    <div className="status-item-icon" aria-hidden="true">
                      <Brain size={20} />
                    </div>
                    <div className="status-item-text">
                      <strong>Speech Recognition Capability</strong>
                      <span>
                        {speechRecognitionSupported
                          ? 'Native speech recognition engine active (Voice answers enabled).'
                          : 'Speech recognition engine not detected in this browser. Standard high-speed typed responses active.'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Media Error State */}
                {mediaError && (
                  <div className="preflight-error-callout" role="alert">
                    <AlertCircle size={18} aria-hidden="true" />
                    <div>
                      <strong>Access Required</strong>
                      <p>{mediaError}</p>
                    </div>
                  </div>
                )}

                {/* Preflight Actions */}
                <div className="preflight-action-buttons">
                  {(!cameraActive || !micActive) && (
                    <button
                      type="button"
                      className="btn-editorial-secondary"
                      onClick={initMediaCheck}
                      disabled={loading}
                    >
                      <RotateCcw size={15} aria-hidden="true" />
                      <span>Retry Media Permissions</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn-editorial-secondary"
                    onClick={handleResetToSetup}
                    disabled={loading}
                  >
                    <span>← Back to Setup</span>
                  </button>

                  <button
                    type="button"
                    className="btn-start-interview"
                    onClick={handleStartInterview}
                    disabled={!cameraActive || !micActive || loading}
                    aria-label="Enter Technical Interview Chamber"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animated-spinner" aria-hidden="true" />
                        <span>{loadingMsg || 'Entering Chamber...'}</span>
                      </>
                    ) : (
                      <>
                        <span>Enter Interview Chamber</span>
                        <ArrowRight size={18} aria-hidden="true" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          STAGE 3: ACTIVE INTERVIEW CHAMBER (5 ROUNDS)
          ========================================================================= */}
      {stage === 'interview' && currentQuestion && (
        <div className="interview-chamber-wrapper animate-fadeIn">
          {/* Top Bar with Grounding Badge & Candidate PiP */}
          <div className="chamber-top-bar">
            <div className="chamber-meta-group">
              <div className="chamber-round-pill">
                <span>Round {roundNumber} of 5</span>
              </div>
              <span className="chamber-role-badge">Target: {getEffectiveRole()}</span>
              <span className="chamber-resume-badge">Resume: {resumeFile?.name}</span>
            </div>

            <div className="chamber-presence-box">
              <video
                ref={pipVideoRef}
                autoPlay
                playsInline
                muted
                className="chamber-pip-video"
                aria-label="Candidate live presence feed"
              />
              <div className="pip-indicator">
                <span className="live-dot dot-green" aria-hidden="true"></span>
                <span>Live Feed</span>
              </div>
            </div>
          </div>

          {/* Interviewer Inquiry Box with Speak Aloud / Replay TTS */}
          <div className="interviewer-question-card">
            <div className="question-header-row">
              <div className="interviewer-avatar-badge">
                <Brain size={18} aria-hidden="true" />
                <span>Aven.better Technical Interviewer</span>
              </div>
              <div className="question-actions-group">
                <span className="question-type-badge">{currentQuestion.question_type || 'technical'}</span>
                
                {/* Interviewer TTS Replay Button */}
                {isSpeechSynthesisSupported() && (
                  <button
                    type="button"
                    className={`btn-tts-replay ${isSpeakingQuestion ? 'speaking-active' : ''}`}
                    onClick={() => {
                      if (isSpeakingQuestion) {
                        handleStopQuestionSpeech();
                      } else {
                        speakQuestion(currentQuestion.question_text);
                      }
                    }}
                    title={isSpeakingQuestion ? 'Stop reading question' : 'Replay question audio'}
                    aria-label={isSpeakingQuestion ? 'Stop reading question' : 'Replay question audio'}
                  >
                    {isSpeakingQuestion ? (
                      <>
                        <Square size={14} className="icon-speaking" aria-hidden="true" />
                        <span>Stop Voice</span>
                      </>
                    ) : (
                      <>
                        <Volume2 size={14} aria-hidden="true" />
                        <span>Replay Question</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <h2 className="interview-question-text">
              {currentQuestion.question_text}
            </h2>
          </div>

          {/* Previous Evaluation Feedback (Rounds 2-5) */}
          {latestEvaluation && (
            <div className="previous-eval-card animate-fadeIn">
              <div className="eval-card-header">
                <CheckCircle2 size={16} className="eval-icon-pass" aria-hidden="true" />
                <span className="eval-header-title">Round {roundNumber - 1} Evaluation Feedback</span>
                <span className="eval-score-tag">
                  Correctness: {Math.round(latestEvaluation.correctness)}% • Depth: {Math.round(latestEvaluation.depth)}%
                </span>
              </div>
              <p className="eval-assessment-text">{latestEvaluation.assessment}</p>
            </div>
          )}

          {/* Candidate Response Chamber (Dual Mode: Voice & Typed) */}
          <div className="interview-response-card">
            {/* Mode Selector & Header */}
            <div className="response-header-row">
              <div className="response-mode-selector">
                <button
                  type="button"
                  className={`mode-tab-btn ${answerMode === 'voice' ? 'active-mode' : ''}`}
                  onClick={() => {
                    setAnswerMode('voice');
                    setVoiceError('');
                  }}
                  disabled={loading}
                  aria-pressed={answerMode === 'voice'}
                >
                  <Mic size={15} aria-hidden="true" />
                  <span>🎙 Speak Answer</span>
                </button>

                <button
                  type="button"
                  className={`mode-tab-btn ${answerMode === 'type' ? 'active-mode' : ''}`}
                  onClick={() => {
                    stopVoiceRecognition();
                    setAnswerMode('type');
                    setVoiceError('');
                  }}
                  disabled={loading}
                  aria-pressed={answerMode === 'type'}
                >
                  <Terminal size={15} aria-hidden="true" />
                  <span>⌨ Type Answer</span>
                </button>
              </div>

              <span className="response-hint">Press <strong>Ctrl + Enter</strong> to submit</span>
            </div>

            {/* Voice Input Active Action Panel */}
            {answerMode === 'voice' && (
              <div className="voice-input-panel">
                {speechRecognitionSupported ? (
                  <div className="voice-controls-bar">
                    {!isListening ? (
                      <button
                        type="button"
                        className="btn-mic-record"
                        onClick={startVoiceRecognition}
                        disabled={loading}
                      >
                        <Mic size={16} className="icon-mic-idle" aria-hidden="true" />
                        <span>Start Speaking Answer</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-mic-record recording-pulse"
                        onClick={stopVoiceRecognition}
                        disabled={loading}
                      >
                        <Square size={14} className="icon-mic-stop" aria-hidden="true" />
                        <span>Listening... (Click to Finish Speaking)</span>
                      </button>
                    )}

                    <span className="voice-guidance-note">
                      {isListening
                        ? 'Live speech is transcribing directly into the editable text area below.'
                        : 'Click to start recording your response. You can review and edit text before submitting.'}
                    </span>
                  </div>
                ) : (
                  <div className="voice-fallback-notice">
                    <AlertCircle size={16} aria-hidden="true" />
                    <span>Voice input is not natively supported in this browser. You can type your response below.</span>
                  </div>
                )}

                {/* Voice Error Banner */}
                {voiceError && (
                  <div className="interview-error-banner" role="alert">
                    <AlertCircle size={15} aria-hidden="true" />
                    <span>{voiceError}</span>
                  </div>
                )}
              </div>
            )}

            {/* Response Textarea (Always Editable for reviewing speech or typing directly) */}
            <div className="response-textarea-wrap">
              <textarea
                id="interview-answer-input"
                ref={responseInputRef}
                className="interview-response-textarea"
                placeholder={
                  answerMode === 'voice'
                    ? "Click 'Start Speaking Answer' above or type directly. Your spoken transcript will appear here for review and editing before submission..."
                    : "Structure your thoughts clearly. Explain the underlying mechanics, trade-offs, architecture decisions, and edge cases..."
                }
                rows={7}
                value={userAnswer}
                onChange={(e) => {
                  setUserAnswer(e.target.value);
                  baseAnswerRef.current = e.target.value;
                }}
                onKeyDown={handleKeyDown}
                disabled={loading}
                aria-label="Your technical response text"
              />
            </div>

            {errorMsg && (
              <div className="interview-error-banner" role="alert">
                <AlertCircle size={16} aria-hidden="true" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="response-action-row">
              <button
                type="button"
                className="btn-editorial-secondary"
                onClick={handleResetToSetup}
                disabled={loading}
              >
                <RotateCcw size={14} aria-hidden="true" />
                <span>Reset Interview</span>
              </button>

              <button
                type="button"
                className="btn-forest-primary btn-submit-response"
                onClick={handleSubmitAnswer}
                disabled={loading || !userAnswer.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animated-spinner" aria-hidden="true" />
                    <span>{loadingMsg || 'Evaluating Response...'}</span>
                  </>
                ) : (
                  <>
                    <span>Submit Round {roundNumber} Response</span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          STAGE 4: COMPREHENSIVE FINAL REPORT
          ========================================================================= */}
      {stage === 'report' && finalReport && (
        <div className="interview-report-wrapper animate-fadeIn">
          {/* Report Hero Card */}
          <div className="report-hero-card">
            <div className="report-hero-top">
              <div className="report-badge">
                <ShieldCheck size={14} aria-hidden="true" />
                <span>Verified Interview Evaluation Report</span>
              </div>
              <span className="report-meta-role">Target Role: {getEffectiveRole()}</span>
            </div>

            <div className="report-hero-grid">
              <div className="report-score-box">
                <span className="score-num">{Math.round(finalReport.overall_score)}</span>
                <span className="score-unit">/ 100</span>
                <span className="score-label">Readiness Score</span>
              </div>

              <div className="report-summary-box">
                <h3 className="report-summary-title">Executive Summary</h3>
                <p className="report-summary-p">{finalReport.summary}</p>
              </div>
            </div>
          </div>

          {/* Performance Dimensions Quad Grid */}
          <div className="report-dimensions-grid">
            <div className="dimension-card">
              <span className="dim-score">{Math.round(finalReport.technical_understanding)}%</span>
              <span className="dim-title">Technical Mastery</span>
              <p className="dim-desc">Core mechanics, runtime fundamentals, and algorithm accuracy.</p>
            </div>

            <div className="dimension-card">
              <span className="dim-score">{Math.round(finalReport.problem_solving)}%</span>
              <span className="dim-title">Problem Solving</span>
              <p className="dim-desc">Systematic approach, edge case identification, and adaptation.</p>
            </div>

            <div className="dimension-card">
              <span className="dim-score">{Math.round(finalReport.reasoning_depth)}%</span>
              <span className="dim-title">Reasoning Depth</span>
              <p className="dim-desc">Architectural trade-off analysis, scale limits, and failure modes.</p>
            </div>

            <div className="dimension-card">
              <span className="dim-score">{Math.round(finalReport.communication)}%</span>
              <span className="dim-title">Clarity & Precision</span>
              <p className="dim-desc">Structured explanations and precise engineering communication.</p>
            </div>
          </div>

          {/* Strengths & Gaps */}
          <div className="report-strengths-gaps-grid">
            <div className="report-col col-strengths">
              <h4 className="col-title">
                <CheckCircle2 size={18} className="col-icon-forest" aria-hidden="true" />
                <span>Demonstrated Strengths</span>
              </h4>
              <ul className="report-list">
                {(finalReport.strengths || []).map((s, idx) => (
                  <li key={idx} className="report-list-item">
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="report-col col-gaps">
              <h4 className="col-title">
                <AlertTriangle size={18} className="col-icon-amber" aria-hidden="true" />
                <span>Identified Improvement Areas</span>
              </h4>
              <ul className="report-list">
                {(finalReport.gaps || []).map((g, idx) => (
                  <li key={idx} className="report-list-item">
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommendations */}
          {(finalReport.recommendations || []).length > 0 && (
            <div className="report-recommendations-card">
              <h4 className="rec-title">
                <ChevronRight size={18} className="col-icon-forest" aria-hidden="true" />
                <span>Targeted Next Practice Recommendations</span>
              </h4>
              <ul className="rec-list">
                {finalReport.recommendations.map((rec, idx) => (
                  <li key={idx} className="rec-item">
                    <span className="rec-bullet">{idx + 1}</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Report Footer Actions */}
          <div className="report-action-footer">
            <button
              type="button"
              className="btn-editorial-secondary"
              onClick={handleResetToSetup}
            >
              <RotateCcw size={15} aria-hidden="true" />
              <span>Start New Interview</span>
            </button>

            <button
              type="button"
              className="btn-forest-primary"
              onClick={onNavigateDashboard}
            >
              <LayoutDashboard size={15} aria-hidden="true" />
              <span>Return to Dashboard</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
