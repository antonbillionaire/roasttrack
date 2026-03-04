"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const GENRES = [
  { id: "hiphop", label: "Hip-Hop", emoji: "🎤" },
  { id: "pop", label: "Pop", emoji: "🎵" },
  { id: "reggaeton", label: "Reggaeton", emoji: "🔥" },
  { id: "country", label: "Country", emoji: "🤠" },
  { id: "rock", label: "Rock", emoji: "🎸" },
  { id: "edm", label: "EDM", emoji: "🎧" },
];

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [facts, setFacts] = useState(["", "", ""]);
  const [genre, setGenre] = useState("hiphop");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateFact = (index: number, value: string) => {
    const newFacts = [...facts];
    newFacts[index] = value;
    setFacts(newFacts);
  };

  const canSubmit = name.trim() && facts.filter((f) => f.trim()).length >= 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          facts: facts.filter((f) => f.trim()),
          genre,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate track");
      }

      const data = await res.json();
      router.push(`/track/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-10 animate-slide-up">
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-3">
          <span className="text-red-500">Roast</span>Track
        </h1>
        <p className="text-lg sm:text-xl text-zinc-400 max-w-md mx-auto">
          AI generates a personalized diss track about your friend. In seconds.
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-6 animate-slide-up"
        style={{ animationDelay: "0.1s" }}
      >
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            Who are we roasting?
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter their name..."
            maxLength={50}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
          />
        </div>

        {/* Facts */}
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            Drop some facts about them
          </label>
          <div className="space-y-3">
            {facts.map((fact, i) => (
              <input
                key={i}
                type="text"
                value={fact}
                onChange={(e) => updateFact(i, e.target.value)}
                placeholder={
                  i === 0
                    ? "e.g. afraid of spiders"
                    : i === 1
                    ? "e.g. wears the same hoodie every day"
                    : "e.g. thinks he's a DJ (optional)"
                }
                maxLength={100}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
              />
            ))}
          </div>
          <p className="text-xs text-zinc-600 mt-1">
            At least 1 fact required. More facts = better roast.
          </p>
        </div>

        {/* Genre */}
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">
            Pick a vibe
          </label>
          <div className="grid grid-cols-3 gap-2">
            {GENRES.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGenre(g.id)}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  genre === g.id
                    ? "bg-red-500/20 border-red-500 text-red-400 border"
                    : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                {g.emoji} {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="text-red-400 text-sm text-center bg-red-500/10 rounded-xl p-3">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit || loading}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
            canSubmit && !loading
              ? "bg-red-500 hover:bg-red-600 text-white animate-pulse-glow cursor-pointer"
              : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Generating your roast...
            </span>
          ) : (
            "🔥 Generate Diss Track"
          )}
        </button>
      </form>

      {/* Footer */}
      <p className="text-zinc-700 text-xs mt-12">
        For entertainment only. Don&apos;t blame us if friendships end.
      </p>
    </div>
  );
}
