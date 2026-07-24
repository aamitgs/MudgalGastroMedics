"use client";

import { Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type SpeechRecognitionResult = { 0: { transcript: string } };
type SpeechRecognitionEvent = { results: ArrayLike<SpeechRecognitionResult> };

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

/** Not in TypeScript's standard DOM lib (still non-standard/vendor-prefixed) — a narrow, exact-surface cast instead of pulling in a types-only dependency for one API. */
function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  const globalWithSpeech = window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
  return globalWithSpeech.SpeechRecognition || globalWithSpeech.webkitSpeechRecognition;
}

/**
 * Voice dictation for free-text clinical fields (Track: voice dictation) via
 * the browser's native Web Speech API — no external service, no new
 * dependency. Feature-detected: renders nothing where unsupported (Firefox
 * and most non-Chromium browsers) rather than showing a button that would
 * just fail. General dictation, not a medical-specific model — same
 * "doctor reviews before it counts as documentation" posture as AI drafts
 * and clinical templates elsewhere in this app.
 */
export function VoiceDictationButton({ onResult, disabled }: { onResult: (transcript: string) => void; disabled?: boolean }) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  });

  useEffect(() => {
    const timer = window.setTimeout(() => setSupported(Boolean(getSpeechRecognitionCtor())), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  function toggle() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = "en-IN";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((result) => result[0].transcript).join(" ").trim();
      if (transcript) onResultRef.current(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      aria-label={listening ? "Stop voice dictation" : "Start voice dictation"}
      aria-pressed={listening}
      title={listening ? "Listening… click to stop" : "Dictate with voice"}
      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-50 ${
        listening ? "animate-pulse border-red-300 bg-red-50 text-red-600" : "border-line bg-white text-muted hover:border-brand hover:text-brand"
      }`}
    >
      {listening ? <MicOff size={12} /> : <Mic size={12} />}
    </button>
  );
}
