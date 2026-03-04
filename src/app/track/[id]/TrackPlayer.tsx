"use client";

import { useState, useRef, useEffect } from "react";

export default function TrackPlayer({ audioUrl }: { audioUrl: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => setPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
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
    audio.currentTime = percent * duration;
  };

  const formatTime = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className={`w-18 h-18 mx-auto mb-5 flex items-center justify-center rounded-full transition-all cursor-pointer ${
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

      {/* Progress Bar */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-400 w-10 text-right font-mono">
          {formatTime(currentTime)}
        </span>
        <div
          className="flex-1 h-2 bg-white/10 rounded-full cursor-pointer group relative"
          onClick={seek}
        >
          <div
            className="h-full rounded-full transition-[width] duration-100"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #ff6b35, #f7418f)",
            }}
          />
          {/* Seek dot */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>
        <span className="text-xs text-zinc-400 w-10 font-mono">
          {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
