"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const GENRES = [
  { id: "hiphop", label: "Hip-Hop", emoji: "🎤", color: "from-purple-500/20 to-blue-500/20 border-purple-500/40" },
  { id: "pop", label: "Pop", emoji: "🎵", color: "from-pink-500/20 to-rose-500/20 border-pink-500/40" },
  { id: "reggaeton", label: "Reggaeton", emoji: "🌴", color: "from-yellow-500/20 to-orange-500/20 border-yellow-500/40" },
  { id: "country", label: "Country", emoji: "🤠", color: "from-amber-500/20 to-yellow-500/20 border-amber-500/40" },
  { id: "rock", label: "Rock", emoji: "🎸", color: "from-red-500/20 to-orange-500/20 border-red-500/40" },
  { id: "edm", label: "EDM", emoji: "🎧", color: "from-cyan-500/20 to-blue-500/20 border-cyan-500/40" },
];

const ROAST_LEVELS = [
  { id: "light", label: "Light", emoji: "😏", desc: "Friendly teasing", color: "from-green-500/20 to-emerald-500/20 border-green-500/40" },
  { id: "hard", label: "Hard", emoji: "😈", desc: "Savage burns", color: "from-orange-500/20 to-red-500/20 border-orange-500/40" },
  { id: "extreme", label: "Extreme", emoji: "💀", desc: "No mercy", color: "from-red-500/20 to-pink-500/20 border-red-500/40" },
];

const LANGUAGES = [
  { id: "en", label: "English", flag: "🇬🇧" },
  { id: "ru", label: "Русский", flag: "🇷🇺" },
  { id: "es", label: "Español", flag: "🇪🇸" },
];

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [facts, setFacts] = useState(["", "", ""]);
  const [genre, setGenre] = useState("hiphop");
  const [roastLevel, setRoastLevel] = useState("hard");
  const [language, setLanguage] = useState("en");
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
          roastLevel,
          language,
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-radial relative overflow-hidden">
      {/* Floating decorative emojis */}
      <div className="absolute top-20 left-10 text-4xl opacity-20 float-slow select-none pointer-events-none">🔥</div>
      <div className="absolute top-40 right-12 text-3xl opacity-15 float-medium select-none pointer-events-none">🎤</div>
      <div className="absolute bottom-32 left-16 text-3xl opacity-15 float-fast select-none pointer-events-none">🎵</div>
      <div className="absolute bottom-20 right-20 text-4xl opacity-20 float-slow select-none pointer-events-none" style={{ animationDelay: "1s" }}>💀</div>

      {/* Hero */}
      <div className="text-center mb-10 animate-slide-up">
        <div className="text-6xl mb-4 fire-bounce">🔥</div>
        <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-4">
          <span className="gradient-text">Roast</span>
          <span className="text-white">Track</span>
        </h1>
        <p className="text-lg sm:text-xl text-zinc-400 max-w-lg mx-auto leading-relaxed">
          AI writes a <span className="text-white font-semibold">personalized diss track</span> about your friend.
          <br />
          <span className="text-zinc-500">In seconds. No mercy.</span>
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 animate-slide-up"
        style={{ animationDelay: "0.15s" }}
      >
        {/* Name */}
        <div className="glass rounded-2xl p-5 glass-hover">
          <label className="block text-sm font-semibold text-zinc-300 mb-3">
            Who are we roasting? 🎯
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter their name..."
            maxLength={50}
            className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/30 transition-all"
          />
        </div>

        {/* Facts */}
        <div className="glass rounded-2xl p-5 glass-hover">
          <label className="block text-sm font-semibold text-zinc-300 mb-3">
            Drop some facts 💣
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
                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/30 transition-all"
              />
            ))}
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            At least 1 fact required. More facts = more savage 🔥
          </p>
        </div>

        {/* Roast Level */}
        <div className="glass rounded-2xl p-5 glass-hover">
          <label className="block text-sm font-semibold text-zinc-300 mb-3">
            Roast level 🌡️
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {ROAST_LEVELS.map((level) => (
              <button
                key={level.id}
                type="button"
                onClick={() => setRoastLevel(level.id)}
                className={`genre-pill px-3 py-3 rounded-xl text-center cursor-pointer ${
                  roastLevel === level.id
                    ? `bg-gradient-to-br ${level.color} border text-white active`
                    : "bg-white/5 border border-white/10 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <span className="text-xl">{level.emoji}</span>
                <div className="text-sm font-bold mt-1">{level.label}</div>
                <div className="text-[10px] text-zinc-500">{level.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Genre + Language row */}
        <div className="flex gap-4">
          {/* Genre */}
          <div className="glass rounded-2xl p-5 glass-hover flex-1">
            <label className="block text-sm font-semibold text-zinc-300 mb-3">
              Pick a vibe 🎶
            </label>
            <div className="grid grid-cols-3 gap-2">
              {GENRES.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGenre(g.id)}
                  className={`genre-pill px-2 py-2.5 rounded-xl text-xs font-semibold cursor-pointer ${
                    genre === g.id
                      ? `bg-gradient-to-br ${g.color} border text-white active`
                      : "bg-white/5 border border-white/10 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <span className="text-base">{g.emoji}</span>
                  <br />
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="glass rounded-2xl p-5 glass-hover">
          <label className="block text-sm font-semibold text-zinc-300 mb-3">
            Language 🌍
          </label>
          <div className="flex gap-2.5">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => setLanguage(lang.id)}
                className={`genre-pill flex-1 px-3 py-3 rounded-xl text-sm font-semibold cursor-pointer text-center ${
                  language === lang.id
                    ? "bg-gradient-to-br from-white/10 to-white/5 border border-white/30 text-white active"
                    : "bg-white/5 border border-white/10 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <br />
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="text-red-400 text-sm text-center glass rounded-xl p-3 border-red-500/20">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit || loading}
          className={`w-full py-4 rounded-2xl font-bold text-lg cursor-pointer ${
            canSubmit && !loading
              ? "gradient-btn text-white"
              : "bg-zinc-800/50 text-zinc-600 cursor-not-allowed"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <span className="flex items-end gap-1 h-6">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className="waveform-bar w-1 bg-white rounded-full"
                    style={{ height: "6px" }}
                  />
                ))}
              </span>
              Cooking your roast...
            </span>
          ) : (
            "🔥 Generate Diss Track"
          )}
        </button>
      </form>

      {/* Footer */}
      <p className="text-zinc-600 text-xs mt-12 animate-slide-up" style={{ animationDelay: "0.3s" }}>
        For entertainment only. Don&apos;t blame us if friendships end. 💀
      </p>
    </div>
  );
}
