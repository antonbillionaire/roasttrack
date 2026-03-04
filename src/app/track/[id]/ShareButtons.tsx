"use client";

import { useState, useEffect } from "react";

export default function ShareButtons({
  name,
  trackId,
}: {
  name: string;
  trackId: string;
}) {
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const getShareUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/track/${trackId}`;
    }
    return `/track/${trackId}`;
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const shareOnX = () => {
    const text = `${name} just got ROASTED 🔥🎤\nListen to their AI diss track:`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(getShareUrl())}`;
    window.open(url, "_blank");
  };

  const shareNative = async () => {
    try {
      await navigator.share({
        title: `${name}'s Roast - RoastTrack`,
        text: `${name} just got ROASTED! Listen to their AI diss track`,
        url: getShareUrl(),
      });
    } catch {
      // User cancelled
    }
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={copyLink}
        className="flex-1 py-3 card rounded-xl font-medium text-sm cursor-pointer text-gray-600 hover:text-gray-800"
      >
        {copied ? "Copied! ✓" : "📋 Copy Link"}
      </button>
      <button
        onClick={shareOnX}
        className="flex-1 py-3 card rounded-xl font-medium text-sm cursor-pointer text-gray-600 hover:text-gray-800"
      >
        𝕏 Share
      </button>
      {canShare && (
        <button
          onClick={shareNative}
          className="flex-1 py-3 card rounded-xl font-medium text-sm cursor-pointer text-gray-600 hover:text-gray-800"
        >
          📤 Share
        </button>
      )}
    </div>
  );
}
