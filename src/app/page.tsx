"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const GENRES = [
  { id: "hiphop", label: "Hip-Hop", emoji: "🎤", bg: "bg-purple-100 border-purple-300 text-purple-700" },
  { id: "pop", label: "Pop", emoji: "🎵", bg: "bg-pink-100 border-pink-300 text-pink-700" },
  { id: "reggaeton", label: "Reggaeton", emoji: "🌴", bg: "bg-orange-100 border-orange-300 text-orange-700" },
  { id: "country", label: "Country", emoji: "🤠", bg: "bg-amber-100 border-amber-300 text-amber-700" },
  { id: "rock", label: "Rock", emoji: "🎸", bg: "bg-red-100 border-red-300 text-red-700" },
  { id: "edm", label: "EDM", emoji: "🎧", bg: "bg-cyan-100 border-cyan-300 text-cyan-700" },
];

const ROAST_LEVELS = [
  { id: "funny", label: "Funny", emoji: "😂", desc: "Pure comedy", bg: "bg-green-100 border-green-300 text-green-700" },
  { id: "hard", label: "Hard", emoji: "😈", desc: "Spicy burns", bg: "bg-orange-100 border-orange-300 text-orange-700" },
  { id: "extreme", label: "Extreme", emoji: "💀", desc: "No mercy", bg: "bg-red-100 border-red-300 text-red-700" },
];

const LANGUAGES = [
  { id: "en", label: "English", flag: "🇬🇧" },
  { id: "ru", label: "Русский", flag: "🇷🇺" },
  { id: "es", label: "Español", flag: "🇪🇸" },
];

const PACKS = [
  { id: "1", credits: 1, price: "$2.50", perTrack: "$2.50", label: "Try it" },
  { id: "3", credits: 3, price: "$5.99", perTrack: "$2.00", label: "Popular" },
  { id: "5", credits: 5, price: "$8.99", perTrack: "$1.80", label: "Save 28%" },
  { id: "10", credits: 10, price: "$14.99", perTrack: "$1.50", label: "Best Value", highlight: true },
];

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [facts, setFacts] = useState(["", "", ""]);
  const [genre, setGenre] = useState("hiphop");
  const [roastLevel, setRoastLevel] = useState("funny");
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [credits, setCredits] = useState<number | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [buyingPack, setBuyingPack] = useState<string | null>(null);

  // Load saved token
  useEffect(() => {
    const saved = localStorage.getItem("rt_token");
    if (saved) {
      setAccessToken(saved);
      fetch(`/api/me?token=${saved}`)
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data) setCredits(data.credits);
          else localStorage.removeItem("rt_token");
        })
        .catch(() => {});
    }
  }, []);

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
          accessToken,
        }),
      });

      if (res.status === 402) {
        setError("No credits! Buy a pack below to generate tracks.");
        setLoading(false);
        document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate track");
      }

      const data = await res.json();
      if (credits !== null) setCredits(credits - 1);
      router.push(`/track/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  const handleBuyPack = async (packId: string) => {
    setBuyingPack(packId);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packType: packId }),
      });

      if (!res.ok) throw new Error("Failed to create checkout");

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Payment failed to start. Please try again.");
    } finally {
      setBuyingPack(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12 bg-warm relative overflow-hidden">
      {/* Floating decorative emojis */}
      <div className="absolute top-20 left-10 text-4xl opacity-30 float-slow select-none pointer-events-none">🔥</div>
      <div className="absolute top-40 right-12 text-3xl opacity-20 float-medium select-none pointer-events-none">🎤</div>
      <div className="absolute bottom-32 left-16 text-3xl opacity-20 float-fast select-none pointer-events-none">🎵</div>
      <div className="absolute bottom-20 right-20 text-4xl opacity-30 float-slow select-none pointer-events-none" style={{ animationDelay: "1s" }}>💀</div>

      {/* Credits badge (if logged in) */}
      {credits !== null && (
        <div className="fixed top-4 right-4 z-50 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-gray-200">
          <span className="text-sm font-bold gradient-text">{credits}</span>
          <span className="text-xs text-gray-500 ml-1">credits</span>
        </div>
      )}

      {/* Hero */}
      <div className="text-center mb-10 animate-slide-up">
        <div className="text-6xl mb-4 fire-bounce">🔥</div>
        <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-4">
          <span className="gradient-text">Roast</span>
          <span>Track</span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-500 max-w-lg mx-auto leading-relaxed">
          AI writes a <span className="text-gray-800 font-semibold">personalized diss track</span> about your friend.
          <br />
          <span className="text-gray-400">In seconds. Pure comedy.</span>
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 animate-slide-up"
        style={{ animationDelay: "0.15s" }}
      >
        {/* Name */}
        <div className="card rounded-2xl p-5">
          <label className="block text-sm font-bold text-gray-700 mb-3">
            Who are we roasting? 🎯
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter their name..."
            maxLength={50}
            className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
          />
        </div>

        {/* Facts */}
        <div className="card rounded-2xl p-5">
          <label className="block text-sm font-bold text-gray-700 mb-3">
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
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all"
              />
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            At least 1 fact required. More facts = funnier roast 🔥
          </p>
        </div>

        {/* Roast Level */}
        <div className="card rounded-2xl p-5">
          <label className="block text-sm font-bold text-gray-700 mb-3">
            Roast level 🌡️
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {ROAST_LEVELS.map((level) => (
              <button
                key={level.id}
                type="button"
                onClick={() => setRoastLevel(level.id)}
                className={`genre-pill px-3 py-3 rounded-xl text-center cursor-pointer border-2 ${
                  roastLevel === level.id
                    ? `${level.bg} active font-bold`
                    : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                }`}
              >
                <span className="text-xl">{level.emoji}</span>
                <div className="text-sm font-bold mt-1">{level.label}</div>
                <div className="text-[10px] opacity-70">{level.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Genre */}
        <div className="card rounded-2xl p-5">
          <label className="block text-sm font-bold text-gray-700 mb-3">
            Pick a vibe 🎶
          </label>
          <div className="grid grid-cols-3 gap-2">
            {GENRES.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGenre(g.id)}
                className={`genre-pill px-2 py-2.5 rounded-xl text-xs font-bold cursor-pointer border-2 ${
                  genre === g.id
                    ? `${g.bg} active`
                    : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                }`}
              >
                <span className="text-base">{g.emoji}</span>
                <br />
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div className="card rounded-2xl p-5">
          <label className="block text-sm font-bold text-gray-700 mb-3">
            Language 🌍
          </label>
          <div className="flex gap-2.5">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => setLanguage(lang.id)}
                className={`genre-pill flex-1 px-3 py-3 rounded-xl text-sm font-bold cursor-pointer border-2 text-center ${
                  language === lang.id
                    ? "bg-blue-100 border-blue-300 text-blue-700 active"
                    : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
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
          <div className="text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded-xl p-3">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit || loading}
          className={`w-full py-4 rounded-2xl font-bold text-lg cursor-pointer ${
            canSubmit && !loading
              ? "gradient-btn animate-pulse-glow"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
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
          ) : credits !== null && credits > 0 ? (
            `🔥 Generate Diss Track (${credits} left)`
          ) : (
            "🔥 Generate Free Preview"
          )}
        </button>
      </form>

      {/* Pricing Section */}
      <div id="pricing" className="w-full max-w-md mt-16 animate-slide-up" style={{ animationDelay: "0.25s" }}>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black mb-2">Get More Roasts</h2>
          <p className="text-gray-500">
            Buy credits to generate full tracks with download & sharing
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {PACKS.map((pack) => (
            <button
              key={pack.id}
              onClick={() => handleBuyPack(pack.id)}
              disabled={buyingPack !== null}
              className={`relative card rounded-2xl p-5 text-center cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
                pack.highlight
                  ? "ring-2 ring-pink-400 shadow-lg"
                  : ""
              }`}
            >
              {pack.highlight && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full">
                  BEST VALUE
                </span>
              )}
              <div className="text-3xl font-black gradient-text mb-1">
                {pack.credits}
              </div>
              <div className="text-xs text-gray-500 mb-3">
                {pack.credits === 1 ? "track" : "tracks"}
              </div>
              <div className="text-xl font-black mb-1">{pack.price}</div>
              <div className="text-[10px] text-gray-400">
                {pack.perTrack}/track
              </div>
              {buyingPack === pack.id && (
                <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-500">Loading...</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {error && (
          <div className="text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded-xl p-3 mt-4">
            {error}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-4">
          Secure payment via Polar. No subscription — buy once, use anytime.
        </p>
      </div>

      {/* Footer */}
      <p className="text-gray-400 text-xs mt-12 animate-slide-up" style={{ animationDelay: "0.3s" }}>
        For entertainment only. Don&apos;t blame us if friendships end. 💀
      </p>
    </div>
  );
}
