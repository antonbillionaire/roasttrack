"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const PREVIEW_LIMIT = 15; // seconds
const FADE_START = 13; // start fading at 13s, fully muted by 15s

interface TrackPlayerProps {
  audioUrl: string;
  isFreePreview: boolean;
}

export default function TrackPlayer({ audioUrl, isFreePreview }: TrackPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [previewEnded, setPreviewEnded] = useState(false);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setCurrentTime(audio.currentTime);

    if (isFreePreview && audio.currentTime >= FADE_START) {
      // Fade out volume between FADE_START and PREVIEW_LIMIT
      const fadeProgress = (audio.currentTime - FADE_START) / (PREVIEW_LIMIT - FADE_START);
      audio.volume = Math.max(0, 1 - fadeProgress);

      if (audio.currentTime >= PREVIEW_LIMIT) {
        audio.pause();
        audio.volume = 1;
        setPlaying(false);
        setPreviewEnded(true);
      }
    }
  }, [isFreePreview]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => setPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, [handleTimeUpdate]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isFreePreview && previewEnded) {
      // Restart from beginning for preview
      audio.currentTime = 0;
      audio.volume = 1;
      setPreviewEnded(false);
    }

    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = percent * displayDuration;

    // For previews, don't allow seeking past limit
    if (isFreePreview && targetTime >= PREVIEW_LIMIT) return;

    audio.currentTime = targetTime;
    if (previewEnded) {
      setPreviewEnded(false);
      audio.volume = 1;
    }
  };

  const formatTime = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // For free previews, show preview limit as duration
  const displayDuration = isFreePreview ? Math.min(duration, PREVIEW_LIMIT) : duration;
  const displayTime = isFreePreview ? Math.min(currentTime, PREVIEW_LIMIT) : currentTime;
  const progress = displayDuration > 0 ? (displayTime / displayDuration) * 100 : 0;

  return (
    <div>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className={`mx-auto mb-5 flex items-center justify-center rounded-full transition-all cursor-pointer ${
          playing
            ? "gradient-btn animate-pulse-glow scale-110"
            : "gradient-btn hover:scale-110 active:scale-95"
        }`}
        style={{ width: "72px", height: "72px" }}
      >
        {playing ? (
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg className="w-7 h-7 ml-1" fill="currentColor" viewBox="0 0 24 24">
            <polygon points="5,3 19,12 5,21" />
          </svg>
        )}
      </button>

      {/* Waveform when playing */}
      {playing && (
        <div className="flex items-end justify-center gap-1 h-6 mb-3">
          {[...Array(7)].map((_, i) => (
            <span
              key={i}
              className="waveform-bar w-1 rounded-full"
              style={{
                height: "6px",
                background: "linear-gradient(to top, #ff6b35, #f7418f)",
              }}
            />
          ))}
        </div>
      )}

      {/* Preview ended overlay */}
      {isFreePreview && previewEnded && (
        <div className="text-center mb-3 py-2 px-4 bg-white/10 rounded-xl">
          <p className="text-white/80 text-sm font-medium">
            Preview ended — unlock the full track below
          </p>
        </div>
      )}

      {/* Progress Bar */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-white/50 w-10 text-right font-mono">
          {formatTime(displayTime)}
        </span>
        <div
          className="flex-1 h-2 bg-white/15 rounded-full cursor-pointer group relative"
          onClick={seek}
        >
          <div
            className="h-full rounded-full transition-[width] duration-100"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #ff6b35, #f7418f)",
            }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>
        <span className="text-xs text-white/50 w-10 font-mono">
          {isFreePreview ? `0:${PREVIEW_LIMIT}` : formatTime(duration)}
        </span>
      </div>

      {/* Preview badge */}
      {isFreePreview && (
        <div className="text-center mt-3">
          <span className="text-xs text-white/40">
            Free preview — {PREVIEW_LIMIT}s of full track
          </span>
        </div>
      )}
    </div>
  );
}
