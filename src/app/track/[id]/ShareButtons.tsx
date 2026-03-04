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

  const shareText = `${name} just got ROASTED! Listen to their AI diss track`;

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
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(getShareUrl())}`;
    window.open(url, "_blank");
  };

  const shareOnWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${getShareUrl()}`)}`;
    window.open(url, "_blank");
  };

  const shareOnTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(getShareUrl())}&text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
  };

  const shareNative = async () => {
    try {
      await navigator.share({
        title: `${name}'s Roast - RoastTrack`,
        text: shareText,
        url: getShareUrl(),
      });
    } catch {
      // User cancelled
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={shareOnWhatsApp}
          className="py-3 card rounded-xl font-medium text-sm cursor-pointer text-gray-600 hover:text-green-600 hover:border-green-200 transition-colors"
        >
          WhatsApp
        </button>
        <button
          onClick={shareOnTelegram}
          className="py-3 card rounded-xl font-medium text-sm cursor-pointer text-gray-600 hover:text-blue-500 hover:border-blue-200 transition-colors"
        >
          Telegram
        </button>
        <button
          onClick={shareOnX}
          className="py-3 card rounded-xl font-medium text-sm cursor-pointer text-gray-600 hover:text-gray-800 transition-colors"
        >
          Share on X
        </button>
        <button
          onClick={copyLink}
          className="py-3 card rounded-xl font-medium text-sm cursor-pointer text-gray-600 hover:text-gray-800 transition-colors"
        >
          {copied ? "Copied!" : "Copy Link"}
        </button>
      </div>
      {canShare && (
        <button
          onClick={shareNative}
          className="w-full py-3 card rounded-xl font-medium text-sm cursor-pointer text-gray-600 hover:text-gray-800"
        >
          More sharing options...
        </button>
      )}
    </div>
  );
}
