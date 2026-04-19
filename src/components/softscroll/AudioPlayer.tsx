'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, AlertCircle } from 'lucide-react';

interface AudioPlayerProps {
  text: string;
}

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

// Stop any active speech globally
export function stopGlobalSpeech() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
  } catch (e) { /* ignore */ }
}

export function AudioPlayer({ text }: AudioPlayerProps) {
  const [status, setStatus] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const selectedVoice = 'Microsoft Natasha - English (United States)';
  const [isSupported] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!window.speechSynthesis;
  });

  const mountedRef = useRef(true);
  const chunksRef = useRef<string[]>([]);
  const chunkIdxRef = useRef(0);
  const charOffsetRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speakingRef = useRef(false);
  const doSpeakRef = useRef<() => void>(() => {});

  // Load available voices for the dropdown (optional)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      voicesRef.current = availableVoices;
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      speakingRef.current = false;
      try { window.speechSynthesis?.cancel(); } catch {}
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const startTimer = useCallback((fromChar: number) => {
    clearTimer();
    timerRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      setProgress(prev => {
        const next = prev + speed * 12;
        return next >= text.length ? text.length : next;
      });
    }, 100);
  }, [text, speed, clearTimer]);

  const doSpeak = useCallback(() => {
    if (!mountedRef.current || !speakingRef.current) return;
    const chunks = chunksRef.current;
    const idx = chunkIdxRef.current;

    if (idx >= chunks.length) {
      speakingRef.current = false;
      if (mountedRef.current) setStatus('idle');
      clearTimer();
      return;
    }

    const utt = new SpeechSynthesisUtterance(chunks[idx]);
    utt.rate = speed;
    utt.volume = isMuted ? 0 : 1;

    // Use Microsoft Natasha voice - hardcoded
    const availableVoices = voicesRef.current.length > 0 ? voicesRef.current : window.speechSynthesis.getVoices();
    const voice = availableVoices.find(v => v.name === selectedVoice)
      || availableVoices.find(v => v.name.includes('Natasha'))
      || availableVoices.find(v => v.lang.startsWith('en'))
      || availableVoices[0];
    if (voice) utt.voice = voice;

    utt.onstart = () => {
      if (!mountedRef.current) return;
      setProgress(charOffsetRef.current);
    };

    utt.onend = () => {
      if (!mountedRef.current || !speakingRef.current) return;
      charOffsetRef.current += chunks[idx].length;
      chunkIdxRef.current = idx + 1;
      setProgress(charOffsetRef.current);
      setTimeout(() => doSpeakRef.current(), 30);
    };

    utt.onerror = (e) => {
      // On any error, stop cleanly — don't retry
      console.warn('Speech ended:', e.error);
      speakingRef.current = false;
      if (mountedRef.current) setStatus('idle');
      clearTimer();
    };

    try {
      window.speechSynthesis.speak(utt);
    } catch (e) {
      console.error('speak() failed:', e);
      speakingRef.current = false;
      if (mountedRef.current) setStatus('idle');
      clearTimer();
    }
  }, [speed, isMuted, clearTimer, doSpeakRef, selectedVoice]);

  useEffect(() => {
    doSpeakRef.current = doSpeak;
  }, [doSpeak]);

  const handlePlay = useCallback(() => {
    if (!text || !mountedRef.current) return;
    setError(null);

    // Resume from pause
    if (status === 'paused') {
      speakingRef.current = true;
      setStatus('playing');
      try { window.speechSynthesis.resume(); } catch {}
      startTimer(progress);
      return;
    }

    // Fresh start
    try { window.speechSynthesis.cancel(); } catch {}
    clearTimer();

    chunksRef.current = splitTextIntoChunks(text, 200);
    chunkIdxRef.current = 0;
    charOffsetRef.current = 0;
    setProgress(0);
    speakingRef.current = true;
    setStatus('playing');

    startTimer(0);

    const go = () => { if (mountedRef.current && speakingRef.current) doSpeak(); };
    if (window.speechSynthesis.getVoices().length > 0) {
      go();
    } else {
      window.speechSynthesis.onvoiceschanged = () => go();
      // Timeout fallback — if voices never load, just try anyway
      setTimeout(() => {
        if (speakingRef.current && chunkIdxRef.current === 0) go();
      }, 1000);
    }
  }, [text, status, progress, doSpeak, startTimer, clearTimer]);

  const handlePause = useCallback(() => {
    speakingRef.current = false;
    setStatus('paused');
    clearTimer();
    try { window.speechSynthesis.pause(); } catch {}
  }, [clearTimer]);

  const handleStop = useCallback(() => {
    speakingRef.current = false;
    setStatus('idle');
    setProgress(0);
    chunkIdxRef.current = 0;
    charOffsetRef.current = 0;
    clearTimer();
    try { window.speechSynthesis.cancel(); } catch {}
  }, [clearTimer]);

  const handleSkip = useCallback((dir: 'back' | 'forward') => {
    const jump = text.length * 0.1;
    const newPos = dir === 'back'
      ? Math.max(0, progress - jump)
      : Math.min(text.length, progress + jump);

    speakingRef.current = false;
    try { window.speechSynthesis.cancel(); } catch {}
    clearTimer();

    const fromIdx = Math.floor(newPos);
    setProgress(fromIdx);
    setStatus('idle');

    const remaining = text.slice(fromIdx);
    if (remaining.length < 10) return;

    chunksRef.current = splitTextIntoChunks(remaining, 200);
    chunkIdxRef.current = 0;
    charOffsetRef.current = fromIdx;
    speakingRef.current = true;
    setStatus('playing');
    startTimer(fromIdx);
    doSpeak();
  }, [text, progress, doSpeak, startTimer, clearTimer]);

  const progressPct = text.length > 0 ? (progress / text.length) * 100 : 0;

  const fmtTime = (chars: number) => {
    const mins = Math.floor(chars / (750 * speed));
    const secs = Math.floor(((chars / (750 * speed)) - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isSupported) {
    return (
      <div className="bg-card border border-border/50 rounded-2xl p-6 text-center">
        <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          Audio is not supported in this browser. Please use Chrome, Edge, or Safari.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 sm:p-6">
      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm mb-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/20">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Status indicator */}
      <div className="text-center mb-4">
        <span className={`inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full ${
          status === 'playing' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
          status === 'paused' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
          'bg-muted text-muted-foreground'
        }`}>
          {status === 'playing' && <><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Playing</>}
          {status === 'paused' && <><span className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> Paused</>}
          {status === 'idle' && <>Ready</>}
        </span>
      </div>

      {/* Waveform */}
      <div className="mb-4">
        <div className="flex items-end justify-center gap-[3px] h-14 mb-4 px-2">
          {Array.from({ length: 50 }).map((_, i) => {
            const h = Math.sin(i * 0.3) * 30 + Math.cos(i * 0.15) * 20 + 40;
            const played = (i / 50) * 100 < progressPct;
            return (
              <div key={i}
                className={`w-[5px] rounded-full transition-all duration-200 ${played ? 'bg-[#8FB9A8]' : 'bg-muted-foreground/12'}`}
                style={{ height: `${h}%`, minHeight: '6px' }}
              />
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="relative h-1.5 bg-muted rounded-full cursor-pointer group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            const newIdx = Math.floor(pct * text.length);
            handleStop();
            setProgress(newIdx);
            charOffsetRef.current = newIdx;
          }}
        >
          <div className="absolute top-0 left-0 h-full bg-[#8FB9A8] rounded-full transition-all duration-150"
            style={{ width: `${progressPct}%` }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-[#8FB9A8] rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${progressPct}%`, marginLeft: '-7px' }} />
        </div>

        <div className="flex justify-between mt-2">
          <span className="text-xs text-muted-foreground font-mono">{fmtTime(progress)}</span>
          <span className="text-xs text-muted-foreground font-mono">-{fmtTime(text.length - progress)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap mb-3">
        <button onClick={() => setSpeed(s => s === 1 ? 1.5 : s === 1.5 ? 2 : s === 2 ? 0.75 : 1)}
          className="px-2 py-1 rounded-lg text-xs font-mono text-muted-foreground hover:bg-muted/50 cursor-pointer">
          {speed}x
        </button>

        <button onClick={() => handleSkip('back')}
          className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer">
          <SkipBack className="w-4 h-4" />
        </button>

        <button onClick={() => setIsMuted(m => !m)}
          className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer">
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button onClick={status === 'playing' ? handlePause : handlePlay}
          className="w-12 h-12 rounded-2xl bg-[#8FB9A8] hover:bg-[#7AA896] text-white flex items-center justify-center shadow-lg shadow-[#8FB9A8]/25 transition-all hover:scale-105 active:scale-95 cursor-pointer">
          {status === 'playing' ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>

        <button onClick={handleStop}
          className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
        </button>

        <button onClick={() => handleSkip('forward')}
          className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer">
          <SkipForward className="w-4 h-4" />
        </button>

        <div className="w-[52px]" />
      </div>
    </div>
  );
}

interface AIAudioPlayerProps {
  audioUrl: string;
}

export function AIAudioPlayer({ audioUrl }: AIAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'playing' | 'paused'>('idle');
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
      setStatus('idle');
    });

    audio.addEventListener('timeupdate', () => {
      setProgress(audio.currentTime);
    });

    audio.addEventListener('ended', () => {
      setStatus('idle');
      setProgress(0);
    });

    audio.addEventListener('play', () => setStatus('playing'));
    audio.addEventListener('pause', () => setStatus('paused'));

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl]);

  const handlePlay = () => {
    if (!audioRef.current) return;
    audioRef.current.play();
  };

  const handlePause = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
  };

  const handleStop = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setProgress(0);
  };

  const progressPct = duration > 0 ? (progress / duration) * 100 : 0;

  const fmtTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 sm:p-6">
      <div className="text-center mb-4">
        <span className={`inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full ${
          status === 'playing' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
          status === 'paused' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
          'bg-muted text-muted-foreground'
        }`}>
          {status === 'playing' && <><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Playing</>}
          {status === 'paused' && <><span className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> Paused</>}
          {status === 'idle' && <>Ready</>}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex items-end justify-center gap-[3px] h-14 mb-4 px-2">
          {Array.from({ length: 50 }).map((_, i) => {
            const h = Math.sin(i * 0.3) * 30 + Math.cos(i * 0.15) * 20 + 40;
            const played = (i / 50) * 100 < progressPct;
            return (
              <div key={i}
                className={`w-[5px] rounded-full transition-all duration-200 ${played ? 'bg-[#8FB9A8]' : 'bg-muted-foreground/12'}`}
                style={{ height: `${h}%`, minHeight: '6px' }}
              />
            );
          })}
        </div>

        <div className="relative h-1.5 bg-muted rounded-full">
          <div className="absolute top-0 left-0 h-full bg-[#8FB9A8] rounded-full transition-all duration-150"
            style={{ width: `${progressPct}%` }} />
        </div>

        <div className="flex justify-between mt-2">
          <span className="text-xs text-muted-foreground font-mono">{fmtTime(progress)}</span>
          <span className="text-xs text-muted-foreground font-mono">-{fmtTime(duration - progress)}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-5">
        <button onClick={handleStop}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
        </button>

        <button onClick={status === 'playing' ? handlePause : handlePlay}
          className="w-14 h-14 rounded-2xl bg-[#8FB9A8] hover:bg-[#7AA896] text-white flex items-center justify-center shadow-lg shadow-[#8FB9A8]/25 transition-all hover:scale-105 active:scale-95 cursor-pointer">
          {status === 'playing' ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 ml-0.5" />
          )}
        </button>

        <div className="w-9" />
      </div>
    </div>
  );
}
