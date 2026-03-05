"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import RestoreCredits from "@/components/RestoreCredits";

interface UserData {
  email: string;
  credits: number;
  totalPurchased: number;
  generations: {
    id: string;
    name: string;
    genre: string;
    createdAt: string;
  }[];
}

const GENRE_EMOJIS: Record<string, string> = {
  hiphop: "🎤",
  pop: "🎵",
  kpop: "💜",
  reggaeton: "🌴",
  rnb: "🎹",
  country: "🤠",
  rock: "🎸",
  edm: "🎧",
  afrobeat: "🥁",
};

function MyPageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("No access token. Check your email for your personal link.");
      setLoading(false);
      return;
    }

    localStorage.setItem("rt_token", token);

    fetch(`/api/me?token=${token}`)
      .then((res) => {
        if (!res.ok) throw new Error("Invalid or expired token");
        return res.json();
      })
      .then(setUser)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm">
        <div className="text-4xl fire-bounce">🔥</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-warm">
        <div className="text-6xl mb-6">🔒</div>
        <h1 className="text-2xl font-black mb-2">Access Required</h1>
        <p className="text-gray-500 mb-6 text-center max-w-sm">
          {error || "Check your email for your personal access link."}
        </p>
        <div className="w-full max-w-sm mb-6">
          <RestoreCredits />
        </div>
        <Link href="/" className="gradient-btn px-8 py-3 rounded-xl font-bold">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12 bg-warm">
      <Link href="/" className="text-2xl font-black tracking-tight mb-8">
        <span className="gradient-text">Roast</span>
        <span>Track</span>
      </Link>

      <div className="w-full max-w-md space-y-5">
        {/* Credits Card */}
        <div className="card rounded-2xl p-6 text-center">
          <p className="text-sm text-gray-500 mb-1">Your Credits</p>
          <p className="text-5xl font-black gradient-text mb-2">{user.credits}</p>
          <p className="text-xs text-gray-400">
            {user.totalPurchased} total purchased
          </p>
        </div>

        {/* Buy More */}
        <Link
          href="/#pricing"
          className="block w-full text-center py-4 gradient-btn rounded-2xl font-bold text-lg"
        >
          🔥 Buy More Credits
        </Link>

        {/* Generate */}
        <Link
          href="/"
          className="block w-full text-center py-3 card rounded-2xl font-bold text-gray-700"
        >
          🎤 Create New Roast
        </Link>

        {/* Track History */}
        {user.generations.length > 0 && (
          <div className="card rounded-2xl p-5">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
              Your Roasts
            </h2>
            <div className="space-y-3">
              {user.generations.map((gen) => (
                <Link
                  key={gen.id}
                  href={`/track/${gen.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <span className="text-2xl">
                    {GENRE_EMOJIS[gen.genre] || "🎵"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">
                      {gen.name}&apos;s Roast
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(gen.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-gray-300">→</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Email */}
        <p className="text-center text-xs text-gray-400">
          Logged in as {user.email}
        </p>
      </div>
    </div>
  );
}

export default function MyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-warm">
          <div className="text-4xl fire-bounce">🔥</div>
        </div>
      }
    >
      <MyPageContent />
    </Suspense>
  );
}
