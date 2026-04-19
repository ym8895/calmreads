'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';

interface AudioPlayerProps {
  text: string;
}

// Split text into sentence-aware chunks
function splitTextIntoChunks(text: string, maxLen: number): string[] {
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) { chunks.push(remaining); break; }
    let splitAt = maxLen;
    const lastPeriod = remaining.lastIndexOf('.', maxLen);
    const lastComma = remaining.lastIndexOf(',', maxLen);
    const lastSpace = remaining.lastIndexOf(' ', maxLen);
    if (lastPeriod > maxLen * 0.5) splitAt = lastPeriod + 1;
    else if (lastComma > maxLen * 0.5) splitAt = lastComma + 1;
    else if (lastSpace > maxLen * 0.5) splitAt = lastSpace + 1;
    chunks.push(remaining.slice(0, splitAt).trim());
    remaining = remaining.slice(splitAt).trim();
  }
  return chunks;
}

export function stopGlobalSpeech() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  // Chrome bug workaround: cancel, then resume, then cancel again
  window.speechSynthesis.cancel();
  // Some browsers need a brief delay for cancel to take effect
  setTimeout(() => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }, 50);
}

export function AudioPlayer({ text }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [speed, setSpeed] = useState(1);

  const mountedRef = useRef(true);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef = useRef<string[]>([]);
  const chunkIdxRef = useRef(0);
  const charOffsetRef = useRef(0);
  const speakingRef = useRef(false); // tracks if we intentionally want speech

  // Check browser support
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setIsSupported(false);
    }
  }, []);

  // CRITICAL: Cleanup on unmount — stop ALL speech
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      speakingRef.current = false;
      stopGlobalSpeech();
      clearProgressTimer();
    };
  }, []);

  const clearProgressTimer = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  const startProgressTimer = useCallback((startIdx: number) => {
    clearProgressTimer();
    progressTimerRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      setCurrentCharIndex((prev) => {
        const next = prev + speed * 12;
        return next >= text.length ? text.length : next;
      });
    }, 100);
  }, [text, speed, clearProgressTimer]);

  const setStateIfMounted = useCallback((updater: () => void) => {
    if (mountedRef.current) updater();
  }, []);

  // Core: speak the next chunk in queue
  const speakNextChunk = useCallback(() => {
    if (!mountedRef.current || !speakingRef.current) return;

    const chunks = chunksRef.current;
    const idx = chunkIdxRef.current;

    if (idx >= chunks.length) {
      // Finished all chunks
      setStateIfMounted(() => {
        setIsPlaying(false);
        speakingRef.current = false;
      });
      clearProgressTimer();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(chunks[idx]);
    utterance.rate = speed;
    utterance.pitch = 1;
    utterance.volume = isMuted ? 0 : 1;

    // Pick a good voice
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel'))
    ) || voices.find((v) => v.lang.startsWith('en'));
    if (voice) utterance.voice = voice;

    utterance.onstart = () => {
      if (!mountedRef.current) return;
      setCurrentCharIndex(charOffsetRef.current);
    };

    utterance.onend = () => {
      if (!mountedRef.current) return;
      charOffsetRef.current += chunks[idx].length;
      chunkIdxRef.current = idx + 1;
      setCurrentCharIndex(charOffsetRef.current);

      if (chunkIdxRef.current < chunks.length && speakingRef.current) {
        // Small gap between chunks
        setTimeout(() => speakNextChunk(), 50);
      } else {
        setIsPlaying(false);
        speakingRef.current = false;
        clearProgressTimer();
      }
    };

    utterance.onerror = (e) => {
      // "canceled" = we intentionally stopped, "interrupted" = Chrome quirk
      // Both are safe to ignore — just stop
      console.warn('Speech event:', e.error);
      if (!mountedRef.current) return;

      // Don't retry on any error — just stop cleanly
      speakingRef.current = false;
      setIsPlaying(false);
      clearProgressTimer();
    };

    window.speechSynthesis.speak(utterance);
  }, [speed, isMuted, clearProgressTimer, setStateIfMounted]);

  // Play / Resume
  const handlePlay = useCallback(() => {
    if (!text || !isSupported || !mountedRef.current) return;

    // Resume from pause
    if (isPaused && currentCharIndex > 0) {
      speakingRef.current = true;
      setIsPaused(false);
      setIsPlaying(true);
      window.speechSynthesis.resume();
      startProgressTimer(currentCharIndex);
      return;
    }

    // Fresh start
    stopGlobalSpeech();
    clearProgressTimer();

    chunksRef.current = splitTextIntoChunks(text, 180);
    chunkIdxRef.current = 0;
    charOffsetRef.current = 0;
    setCurrentCharIndex(0);
    setIsPlaying(true);
    setIsPaused(false);
    speakingRef.current = true;

    startProgressTimer(0);

    // Ensure voices are loaded before speaking
    const doStart = () => {
      if (mountedRef.current && speakingRef.current) speakNextChunk();
    };
    if (window.speechSynthesis.getVoices().length > 0) {
      doStart();
    } else {
      window.speechSynthesis.onvoiceschanged = () => doStart();
    }
  }, [text, isSupported, isPaused, currentCharIndex, startProgressTimer, speakNextChunk, clearProgressTimer]);

  // Pause
  const handlePause = useCallback(() => {
    speakingRef.current = false;
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
    clearProgressTimer();
  }, [clearProgressTimer]);

  // Stop — full reset to beginning
  const handleStop = useCallback(() => {
    speakingRef.current = false;
    stopGlobalSpeech();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentCharIndex(0);
    chunkIdxRef.current = 0;
    charOffsetRef.current = 0;
    clearProgressTimer();
  }, [clearProgressTimer]);

  // Skip forward/back
  const handleSkip = useCallback((direction: 'back' | 'forward') => {
    const jump = text.length * 0.1;
    const newIndex = direction === 'back'
      ? Math.max(0, currentCharIndex - jump)
      : Math.min(text.length, currentCharIndex + jump);

    // Full stop first
    speakingRef.current = false;
    stopGlobalSpeech();
    clearProgressTimer();

    setCurrentCharIndex(Math.floor(newIndex));
    setIsPlaying(false);
    setIsPaused(false);

    // Speak from new position
    const remainingText = text.slice(Math.floor(newIndex));
    if (remainingText.length < 10) return;

    chunksRef.current = splitTextIntoChunks(remainingText, 180);
    chunkIdxRef.current = 0;
    charOffsetRef.current = Math.floor(newIndex);
    speakingRef.current = true;
    setIsPlaying(true);

    startProgressTimer(Math.floor(newIndex));
    speakNextChunk();
  }, [text, currentCharIndex, startProgressTimer, speakNextChunk, clearProgressTimer]);

  // Toggle mute (update current utterance volume)
  const handleMuteToggle = useCallback(() => {
    setIsMuted(prev => {
      const next = !prev;
      // Update volume of currently playing speech
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        setTimeout(() => window.speechSynthesis.resume(), 10);
      }
      return next;
    });
  }, []);

  const progressPercent = text.length > 0 ? (currentCharIndex / text.length) * 100 : 0;

  const formatTime = () => {
    const charsPerMin = 750 * speed;
    const elapsed = currentCharIndex / charsPerMin;
    const remaining = (text.length - currentCharIndex) / charsPerMin;
    const fmt = (m: number) => {
      const mins = Math.floor(m);
      const secs = Math.floor((m - mins) * 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    return { elapsed: fmt(elapsed), remaining: fmt(remaining) };
  };

  if (!isSupported) {
    return (
      <div className="bg-card border border-border/50 rounded-2xl p-6 text-center">
        <Volume2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          Audio playback is not supported in this browser. Try Chrome, Edge, or Safari.
        </p>
      </div>
    );
  }

  const time = formatTime();

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 sm:p-6">
      {/* Waveform Visualization */}
      <div className="mb-4">
        <div className="flex items-end justify-center gap-[3px] h-14 mb-4 px-2">
          {Array.from({ length: 50 }).map((_, i) => {
            const height = Math.sin(i * 0.3) * 30 + Math.cos(i * 0.15) * 20 + 40;
            const isPlayed = (i / 50) * 100 < progressPercent;
            return (
              <div
                key={i}
                className={`w-[5px] rounded-full transition-all duration-200 ${
                  isPlayed ? 'bg-[#8FB9A8]' : 'bg-muted-foreground/12'
                }`}
                style={{ height: `${height}%`, minHeight: '6px' }}
              />
            );
          })}
        </div>

        {/* Progress Bar */}
        <div
          className="relative h-1.5 bg-muted rounded-full cursor-pointer group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const pct = x / rect.width;
            const newIdx = Math.floor(pct * text.length);
            // Stop current and restart from new position
            speakingRef.current = false;
            stopGlobalSpeech();
            clearProgressTimer();
            setIsPlaying(false);
            setIsPaused(false);
            setCurrentCharIndex(newIdx);
            chunkIdxRef.current = 0;
            charOffsetRef.current = newIdx;
          }}
        >
          <div
            className="absolute top-0 left-0 h-full bg-[#8FB9A8] rounded-full transition-all duration-150"
            style={{ width: `${progressPercent}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-[#8FB9A8] rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${progressPercent}%`, marginLeft: '-7px' }}
          />
        </div>

        {/* Time Display */}
        <div className="flex justify-between mt-2">
          <span className="text-xs text-muted-foreground font-mono">{time.elapsed}</span>
          <span className="text-xs text-muted-foreground font-mono">-{time.remaining}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 sm:gap-5">
        {/* Speed */}
        <button
          onClick={() => setSpeed(s => s === 1 ? 1.5 : s === 1.5 ? 2 : s === 2 ? 0.75 : 1)}
          className="px-2.5 py-1 rounded-lg text-xs font-mono text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer"
        >
          {speed}x
        </button>

        {/* Skip Back */}
        <button
          onClick={() => handleSkip('back')}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
        >
          <SkipBack className="w-5 h-5" />
        </button>

        {/* Mute */}
        <button
          onClick={handleMuteToggle}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        {/* Play / Pause — main button */}
        <button
          onClick={isPlaying ? handlePause : handlePlay}
          className="w-14 h-14 rounded-2xl bg-[#8FB9A8] hover:bg-[#7AA896] text-white flex items-center justify-center shadow-lg shadow-[#8FB9A8]/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
        </button>

        {/* Stop */}
        <button
          onClick={handleStop}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        </button>

        {/* Skip Forward */}
        <button
          onClick={() => handleSkip('forward')}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
        >
          <SkipForward className="w-5 h-5" />
        </button>

        <div className="w-[52px]" />
      </div>
    </div>
  );
}
