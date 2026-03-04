"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function UnlockButton({ trackId }: { trackId: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("roasttrack_token");
    if (saved) {
      setToken(saved);
      // Fetch credits
      fetch(`/api/me?token=${saved}`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data) setCredits(data.credits);
        })
        .catch(() => {});
    }
  }, []);

  const handleUnlock = async () => {
    if (!token) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId, accessToken: token }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to unlock");
        return;
      }

      // Reload page to show full track
      window.location.reload();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // No token or no credits — show buy button
  if (!token || (credits !== null && credits < 1)) {
    return (
      <Link
        href="/#pricing"
        className="block w-full text-center py-4 gradient-btn rounded-2xl font-bold text-lg"
      >
        Get Full Track — Buy Credits
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={handleUnlock}
        disabled={loading}
        className="w-full py-4 gradient-btn rounded-2xl font-bold text-lg disabled:opacity-50 cursor-pointer"
      >
        {loading ? "Unlocking..." : `Unlock Full Track (1 credit)`}
      </button>
      {credits !== null && (
        <p className="text-center text-white/40 text-xs mt-2">
          You have {credits} credit{credits !== 1 ? "s" : ""} remaining
        </p>
      )}
      {error && (
        <p className="text-center text-red-400 text-sm mt-2">{error}</p>
      )}
    </div>
  );
}
