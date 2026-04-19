'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
}

export function AudioPlayer({ src }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [src]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    audio.currentTime = percent * duration;
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-5 sm:p-6">
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Waveform / Progress Visualization */}
      <div className="mb-4">
        {/* Decorative waveform bars */}
        <div className="flex items-end justify-center gap-1 h-12 mb-4">
          {Array.from({ length: 40 }).map((_, i) => {
            const height = Math.random() * 60 + 20;
            const isPlayed = (i / 40) * 100 < progress;
            return (
              <div
                key={i}
                className={`w-1.5 rounded-full transition-all duration-300 ${
                  isPlayed
                    ? 'bg-[#8FB9A8] dark:bg-[#8FB9A8]'
                    : 'bg-muted-foreground/15 dark:bg-muted-foreground/10'
                }`}
                style={{ height: `${height}%`, minHeight: '4px' }}
              />
            );
          })}
        </div>

        {/* Progress Bar */}
        <div
          className="relative h-2 bg-muted rounded-full cursor-pointer group"
          onClick={handleSeek}
        >
          <div
            className="absolute top-0 left-0 h-full bg-[#8FB9A8] dark:bg-[#8FB9A8] rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-[#8FB9A8] rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${progress}%`, marginLeft: '-8px' }}
          />
        </div>

        {/* Time Display */}
        <div className="flex justify-between mt-2">
          <span className="text-xs text-muted-foreground font-mono">
            {formatTime(currentTime)}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>

        <button
          onClick={togglePlay}
          disabled={isLoading}
          className="w-14 h-14 rounded-2xl bg-[#8FB9A8] hover:bg-[#7AA896] text-white flex items-center justify-center shadow-lg shadow-[#8FB9A8]/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 ml-0.5" />
          )}
        </button>

        <div className="w-9" /> {/* Spacer for centering */}
      </div>
    </div>
  );
}
