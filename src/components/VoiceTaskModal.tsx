import React, { useState, useEffect, useRef } from 'react';
import { parseVoiceInputToTask, ParsedVoiceTask } from '../utils/voiceParser';
import { formatTimeDisplay, formatDateLabel, getTodayDateString } from '../utils/time';
import { CATEGORY_COLORS } from './DayArc';
import { Task } from '../types';

interface VoiceTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTask: (taskData: Omit<Task, 'id' | 'createdAt'> & { id?: string }) => void;
  onEditInModal?: (parsed: ParsedVoiceTask) => void;
  defaultDate?: string;
}

// Typing for Web Speech API
interface SpeechRecognitionEventLike extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal?: boolean;
    };
    length: number;
  };
  resultIndex: number;
}

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

export const VoiceTaskModal: React.FC<VoiceTaskModalProps> = ({
  isOpen,
  onClose,
  onSaveTask,
  onEditInModal,
  defaultDate,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedResult, setParsedResult] = useState<ParsedVoiceTask | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const activeDate = defaultDate || getTodayDateString();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechClass) {
      setIsSupported(false);
    }
  }, []);

  // Initialize or restart recognition on open
  useEffect(() => {
    if (!isOpen) {
      stopListening();
      setTranscript('');
      setParsedResult(null);
      setErrorNotice(null);
      setManualInput('');
      return;
    }

    const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechClass) {
      startListening();
    }
  }, [isOpen]);

  const startListening = () => {
    setErrorNotice(null);
    setTranscript('');
    setParsedResult(null);

    const SpeechClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechClass) {
      setIsSupported(false);
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }

      const recognition = new SpeechClass();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let currentText = '';
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);

        if (currentText.trim()) {
          const parsed = parseVoiceInputToTask(currentText, activeDate);
          setParsedResult(parsed);
        }
      };

      recognition.onerror = (e) => {
        console.warn('Speech recognition error:', e.error);
        setIsListening(false);
        if (e.error === 'not-allowed') {
          setErrorNotice('Microphone access was denied. You can enable it in browser settings or type your task below.');
        } else if (e.error === 'no-speech') {
          setErrorNotice('No speech detected. Tap the microphone to try again.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const parsed = parseVoiceInputToTask(manualInput, activeDate);
    setTranscript(manualInput);
    setParsedResult(parsed);
    setManualInput('');
  };

  const handleConfirmTask = () => {
    if (!parsedResult || !parsedResult.title) return;

    onSaveTask({
      title: parsedResult.title,
      date: parsedResult.date,
      startTime: parsedResult.startTime,
      durationMinutes: parsedResult.durationMinutes,
      category: parsedResult.category,
      priority: parsedResult.priority,
      completed: false,
      steps: [],
      reminderLeadMinutes: parsedResult.startTime ? 10 : undefined,
    });

    onClose();
  };

  const handleEditDetails = () => {
    if (!parsedResult) return;
    if (onEditInModal) {
      onEditInModal(parsedResult);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-[24px] border border-[#DDE5EA] p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EEF3F6]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#17212B] text-white flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
            </div>
            <div>
              <h2 id="voice-modal-title" className="font-heading text-lg font-bold text-[#17212B]">
                Add Task by Voice
              </h2>
              <p className="font-body text-xs text-[#55636F]">
                Tell ZenPlan what you need to do and when
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close voice input"
            className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-full text-[#55636F] hover:bg-[#EEF3F6] active:scale-90 transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Central Audio Microphone Indicator */}
        <div className="flex flex-col items-center justify-center py-4 space-y-3 text-center">
          <div className="relative">
            {/* Animated pulsating halo rings when active */}
            {isListening && (
              <>
                <div className="absolute inset-0 rounded-full bg-[#F2A33A]/30 animate-ping pointer-events-none" />
                <div className="absolute -inset-2 rounded-full border-2 border-[#F2A33A]/40 animate-pulse pointer-events-none" />
              </>
            )}

            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              aria-label={isListening ? 'Stop listening' : 'Start voice recording'}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
                isListening
                  ? 'bg-[#E4572E] text-white scale-105'
                  : 'bg-[#17212B] text-white hover:bg-black'
              }`}
            >
              {isListening ? (
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-6 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-8 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
              )}
            </button>
          </div>

          <div>
            <p className="font-heading font-bold text-sm text-[#17212B]">
              {isListening ? 'Listening... Speak now' : 'Tap to Speak'}
            </p>
            <p className="text-xs text-[#55636F] max-w-xs mt-0.5">
              {isListening
                ? 'Say your task, time & date naturally'
                : 'Say e.g. "Team meeting tomorrow at 10 AM"'}
            </p>
          </div>
        </div>

        {/* Live Speech Transcript / Feedback */}
        {transcript ? (
          <div className="p-3.5 rounded-[18px] bg-[#EEF3F6] border border-[#DDE5EA] text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#55636F] block mb-1">
              Spoken words
            </span>
            <p className="font-body text-sm font-medium text-[#17212B] italic">
              &quot;{transcript}&quot;
            </p>
          </div>
        ) : null}

        {/* Error Notice */}
        {errorNotice && (
          <div className="p-3 rounded-xl bg-[#FBE3DC] text-[#A3321A] text-xs font-medium">
            {errorNotice}
          </div>
        )}

        {/* Parsed Structure Preview Card */}
        {parsedResult && parsedResult.title && (
          <div className="p-4 rounded-[20px] bg-[#FAFCFD] border-2 border-[#17212B]/10 space-y-3 shadow-xs animate-fadeIn">
            <div className="flex items-center justify-between gap-2 border-b border-[#EEF3F6] pb-2">
              <span className="text-xs font-bold text-[#17212B] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2A8C8C]" />
                Ready to Add
              </span>
              <span
                className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-white"
                style={{ backgroundColor: CATEGORY_COLORS[parsedResult.category] || '#2F3E8F' }}
              >
                {parsedResult.category.toUpperCase()}
              </span>
            </div>

            <div>
              <h3 className="font-heading text-[17px] font-bold text-[#17212B] leading-snug">
                {parsedResult.title}
              </h3>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              {/* Date chip */}
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#E3E8F6] text-[#2F3E8F] font-semibold">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>{parsedResult.date === getTodayDateString() ? 'Today' : formatDateLabel(parsedResult.date)}</span>
              </div>

              {/* Time chip */}
              {parsedResult.startTime ? (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FFF3D6] text-[#8A5A0C] font-semibold">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>{formatTimeDisplay(parsedResult.startTime)}</span>
                </div>
              ) : (
                <div className="px-2 py-1 rounded-lg bg-[#EEF3F6] text-[#55636F]">
                  Anytime today
                </div>
              )}

              {/* Duration chip */}
              <div className="px-2 py-1 rounded-lg bg-[#EEF3F6] text-[#55636F]">
                {parsedResult.durationMinutes} mins
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleConfirmTask}
                className="flex-1 min-h-[46px] py-2.5 px-4 rounded-[16px] bg-[#17212B] hover:bg-black text-white font-heading font-bold text-sm shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Add Task</span>
              </button>

              <button
                type="button"
                onClick={handleEditDetails}
                className="min-h-[46px] px-3.5 py-2.5 rounded-[16px] border border-[#DDE5EA] text-[#55636F] hover:text-[#17212B] font-body text-xs font-semibold hover:bg-[#EEF3F6] active:scale-95 transition-all cursor-pointer"
              >
                Edit
              </button>
            </div>
          </div>
        )}

        {/* Example Suggestions for quick reference */}
        {!parsedResult && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-[#55636F] uppercase tracking-wider block">
              Try saying:
            </span>
            <div className="space-y-1">
              {[
                'Team meeting tomorrow at 10 AM',
                'Dentist appointment at 2:30 pm',
                'Leg workout today at 5 pm for 45 minutes',
                'Call Sarah in 30 minutes',
              ].map((example, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    const parsed = parseVoiceInputToTask(example, activeDate);
                    setTranscript(example);
                    setParsedResult(parsed);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-xl bg-[#FAFCFD] border border-[#DDE5EA]/80 hover:border-[#F2A33A] text-xs text-[#55636F] hover:text-[#17212B] flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span>&quot;{example}&quot;</span>
                  <span className="text-[10px] text-[#F2A33A] font-semibold">Try</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Natural Text Type Fallback */}
        <form onSubmit={handleManualSubmit} className="pt-2 border-t border-[#EEF3F6] flex gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Or type natural task & time..."
            className="flex-1 px-3.5 py-2 rounded-xl border border-[#DDE5EA] bg-white text-xs font-body text-[#17212B] focus:border-[#F2A33A] focus:outline-none"
          />
          <button
            type="submit"
            disabled={!manualInput.trim()}
            className="min-h-[40px] px-3 py-2 rounded-xl bg-[#EEF3F6] hover:bg-[#DDE5EA] text-[#17212B] text-xs font-semibold disabled:opacity-40 cursor-pointer transition-colors"
          >
            Parse
          </button>
        </form>
      </div>
    </div>
  );
};
