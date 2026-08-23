/**
 * Shared Speech Synthesis (TTS) Engine for Aven.better
 * Single source of truth for all browser speech synthesis across Learning Studio and AI Interview.
 */

export const isSpeechSynthesisSupported = () => {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
};

export const isSpeechRecognitionSupported = () => {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
};

export const getSpeechRecognitionClass = () => {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

/**
 * Speak text with standard parameters and callbacks
 */
export const speakText = (text, {
  rate = 1.0,
  pitch = 1.0,
  lang = 'en-US',
  onStart,
  onEnd,
  onError,
  onPause,
  onResume,
} = {}) => {
  if (!isSpeechSynthesisSupported()) {
    console.warn('SpeechSynthesis is not supported in this browser environment.');
    if (onError) onError(new Error('SpeechSynthesis not supported'));
    return null;
  }

  // Cancel any ongoing speech first
  window.speechSynthesis.cancel();

  const cleanText = (text || '').replace(/[*_#`~]/g, '').trim();
  if (!cleanText) return null;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.lang = lang;

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  if (onError) {
    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis utterance error:', e);
      onError(e);
    };
  }
  if (onPause) utterance.onpause = onPause;
  if (onResume) utterance.onresume = onResume;

  window.speechSynthesis.speak(utterance);
  return utterance;
};

export const pauseSpeech = () => {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.pause();
  }
};

export const resumeSpeech = () => {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.resume();
  }
};

export const cancelSpeech = () => {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
};
