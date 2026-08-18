from faster_whisper import WhisperModel
from app.models.transcription import TranscriptSegment

class TranscriptionService:
    _instance = None
    
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        print("Loading WhisperModel (small)...")
        self.model = WhisperModel(
            "small",
            device="cpu",
            compute_type="int8"
        )
    
    def transcribe(self, file_path: str):
        segments_gen, info = self.model.transcribe(
            file_path,
            beam_size=5
        )
        
        segments = []
        for segment in segments_gen:
            segments.append(TranscriptSegment(
                start=segment.start,
                end=segment.end,
                text=segment.text.strip()
            ))
            
        return segments, info.language
