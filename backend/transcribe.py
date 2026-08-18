from faster_whisper import WhisperModel

print("Loading Whisper...")

model = WhisperModel(
    "small",
    device="cpu",
    compute_type="int8"
)

print("Transcribing...")

segments, info = model.transcribe(
    "backend/lecture1.mp4",
    beam_size=5
)

print(f"\nDetected language: {info.language}")
print(f"Language probability: {info.language_probability:.2f}\n")

for segment in segments:
    print(
        f"[{segment.start:.2f}s -> {segment.end:.2f}s] "
        f"{segment.text}"
    )