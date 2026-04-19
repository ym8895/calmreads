'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';

interface AudioPlayerProps {
  text: string;
}

export function AudioPlayer({ text }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [speed, setSpeed] = useState(1);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check for Web Speech API support
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setIsSupported(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const handlePlay = useCallback(() => {
    if (!text || !isSupported) return;

    // If resuming from pause
    if (isPaused && currentCharIndex > 0) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);

      // Resume progress tracking
      progressIntervalRef.current = setInterval(() => {
        setCurrentCharIndex((prev) => {
          const next = prev + speed * 15;
          if (next >= text.length) {
            stopProgressTracking();
            setIsPlaying(false);
            return text.length;
          }
          return next;
        });
        setProgress(0); // Will be recalculated
      }, 100);
      return;
    }

    // Fresh start
    window.speechSynthesis.cancel();
    stopProgressTracking();

    // Split text into chunks (speechSynthesis has limits ~200 chars)
    const chunks = splitTextIntoChunks(text, 180);
    let charOffset = 0;
    let chunkIndex = 0;

    const speakChunk = () => {
      if (chunkIndex >= chunks.length) {
        setIsPlaying(false);
        stopProgressTracking();
        window.speechSynthesis.cancel();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunks[chunkIndex]);
      utterance.rate = speed;
      utterance.pitch = 1;
      utterance.volume = isMuted ? 0 : 1;

      // Try to pick a good voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel'))
      ) || voices.find((v) => v.lang.startsWith('en'));
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onstart = () => {
        setCurrentCharIndex(charOffset);
      };

      utterance.onend = () => {
        charOffset += chunks[chunkIndex].length;
        chunkIndex++;
        setCurrentCharIndex(charOffset);
        if (chunkIndex < chunks.length) {
          // Small gap between chunks
          setTimeout(speakChunk, 50);
        } else {
          setIsPlaying(false);
          stopProgressTracking();
        }
      };

      utterance.onerror = (e) => {
        if (e.error !== 'canceled') {
          console.error('Speech error:', e.error);
          chunkIndex++;
          if (chunkIndex < chunks.length) {
            setTimeout(speakChunk, 100);
          } else {
            setIsPlaying(false);
            stopProgressTracking();
          }
        }
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };

    setIsPlaying(true);
    setIsPaused(false);
    setCurrentCharIndex(0);

    // Start progress tracking
    progressIntervalRef.current = setInterval(() => {
      setCurrentCharIndex((prev) => {
        const next = prev + speed * 12;
        if (next >= text.length) return text.length;
        return next;
      });
    }, 100);

    // Load voices and start speaking
    const startSpeaking = () => {
      speakChunk();
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      startSpeaking();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        startSpeaking();
      };
    }
  }, [text, isSupported, isPaused, currentCharIndex, speed, isMuted, stopProgressTracking]);

  const handlePause = useCallback(() => {
    window.speechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
    stopProgressTracking();
  }, [stopProgressTracking]);

  const handleStop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentCharIndex(0);
    stopProgressTracking();
  }, [stopProgressTracking]);

  const handleSkip = useCallback((direction: 'back' | 'forward') => {
    const jumpAmount = text.length * 0.1; // 10% jump
    const newIndex = direction === 'back'
      ? Math.max(0, currentCharIndex - jumpAmount)
      : Math.min(text.length, currentCharIndex + jumpAmount);
    setCurrentCharIndex(newIndex);

    // Restart from new position
    window.speechSynthesis.cancel();
    stopProgressTracking();
    setIsPlaying(false);
    setIsPaused(false);

    // Update the text to start from the new position
    const remainingText = text.slice(Math.floor(newIndex));
    if (remainingText.length > 10) {
      const chunks = splitTextIntoChunks(remainingText, 180);
      let chunkIndex = 0;

      const speakChunk = () => {
        if (chunkIndex >= chunks.length) {
          setIsPlaying(false);
          stopProgressTracking();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(chunks[chunkIndex]);
        utterance.rate = speed;
        utterance.volume = isMuted ? 0 : 1;

        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(
          (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel'))
        ) || voices.find((v) => v.lang.startsWith('en'));
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onend = () => {
          chunkIndex++;
          setCurrentCharIndex((prev) => Math.min(text.length, prev + chunks[chunkIndex - 1]?.length || 0));
          if (chunkIndex < chunks.length) {
            setTimeout(speakChunk, 50);
          } else {
            setIsPlaying(false);
            stopProgressTracking();
          }
        };

        utterance.onerror = () => {
          chunkIndex++;
          if (chunkIndex < chunks.length) setTimeout(speakChunk, 100);
          else { setIsPlaying(false); stopProgressTracking(); }
        };

        window.speechSynthesis.speak(utterance);
      };

      setIsPlaying(true);
      setIsPaused(false);

      progressIntervalRef.current = setInterval(() => {
        setCurrentCharIndex((prev) => {
          const next = prev + speed * 12;
          if (next >= text.length) return text.length;
          return next;
        });
      }, 100);

      speakChunk();
    }
  }, [text, currentCharIndex, speed, isMuted, stopProgressTracking]);

  const progressPercent = text.length > 0 ? (currentCharIndex / text.length) * 100 : 0;

  const formatTime = () => {
    // Estimate: ~150 words/min, ~5 chars/word average
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
                  isPlayed
                    ? 'bg-[#8FB9A8]'
                    : 'bg-muted-foreground/12'
                }`}
                style={{ height: `${height}%`, minHeight: '6px' }}
              />
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="relative h-1.5 bg-muted rounded-full cursor-pointer group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percent = x / rect.width;
            const newCharIndex = Math.floor(percent * text.length);
            handleStop();
            setCurrentCharIndex(newCharIndex);
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
        {/* Speed Control */}
        <button
          onClick={() => setSpeed(speed === 1 ? 1.5 : speed === 1.5 ? 2 : speed === 2 ? 0.75 : 1)}
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
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        {/* Play/Pause */}
        <button
          onClick={isPlaying ? handlePause : handlePlay}
          className="w-14 h-14 rounded-2xl bg-[#8FB9A8] hover:bg-[#7AA896] text-white flex items-center justify-center shadow-lg shadow-[#8FB9A8]/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          {isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 ml-0.5" />
          )}
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

        {/* Spacer for centering */}
        <div className="w-[52px]" />
      </div>
    </div>
  );
}

function splitTextIntoChunks(text: string, maxLen: number): string[] {
  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }

    // Find a good split point (period, comma, space)
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
