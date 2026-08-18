import { useState } from 'react'

function App() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, transcribing, success, error
  const [errorMsg, setErrorMsg] = useState('');
  const [transcriptData, setTranscriptData] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setStatus('idle');
      setErrorMsg('');
      setTranscriptData(null);
    }
  };

  const processLecture = async () => {
    if (!file) return;

    setStatus('uploading');
    setErrorMsg('');
    setTranscriptData(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      setStatus('transcribing');
      const response = await fetch('http://localhost:8000/api/lectures/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to upload/transcribe');
      }

      const data = await response.json();
      setTranscriptData(data);
      setStatus('success');
    } catch (error) {
      console.error(error);
      setStatus('error');
      setErrorMsg(error.message || 'An error occurred during processing.');
    }
  };

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>AccessLearn</h1>
      <p>Turn a lecture into an accessible learning experience.</p>
      
      <div style={{ padding: '2rem', background: '#f5f5f5', borderRadius: '8px', marginBottom: '2rem' }}>
        {!file && (
          <label style={{ cursor: 'pointer', background: '#0070f3', color: 'white', padding: '10px 20px', borderRadius: '5px' }}>
            Upload Lecture
            <input type="file" style={{ display: 'none' }} accept="video/mp4,video/webm,video/quicktime" onChange={handleFileChange} />
          </label>
        )}
        
        {file && (
          <div>
            <p><strong>{file.name}</strong></p>
            {status === 'idle' && (
              <button onClick={processLecture} style={{ background: '#0070f3', color: 'white', padding: '10px 20px', borderRadius: '5px', border: 'none', cursor: 'pointer' }}>
                Process Lecture
              </button>
            )}
            {status === 'uploading' && <p>Uploading lecture...</p>}
            {status === 'transcribing' && <p>Processing lecture...<br/>Transcribing audio...</p>}
            {status === 'error' && <p style={{ color: 'red' }}>Error: {errorMsg}</p>}
          </div>
        )}
      </div>

      {status === 'success' && transcriptData && (
        <div>
          <h2>TRANSCRIPT</h2>
          {transcriptData.language && <p style={{ color: '#666' }}>Detected Language: {transcriptData.language}</p>}
          
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {transcriptData.segments.map((seg, idx) => (
              <div key={idx} style={{ borderLeft: '4px solid #0070f3', paddingLeft: '1rem' }}>
                <div style={{ fontWeight: 'bold', color: '#666', fontSize: '0.9rem' }}>
                  {formatTime(seg.start)}
                </div>
                <div>{seg.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
