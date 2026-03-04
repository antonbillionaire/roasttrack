"use client";

import { useState } from "react";

export default function RestoreCredits({ onRestored }: { onRestored?: (credits: number) => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to restore");
        return;
      }

      // Save token to localStorage
      localStorage.setItem("rt_token", data.token);
      setSuccess(true);
      onRestored?.(data.credits);

      // Reload after short delay so credits show up
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="card rounded-2xl p-5 text-center">
        <p className="text-green-600 font-bold">Credits restored!</p>
      </div>
    );
  }

  return (
    <div className="card rounded-2xl p-5">
      <p className="text-sm font-bold text-gray-700 mb-3">Already bought credits?</p>
      <form onSubmit={handleRestore} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all text-sm"
        />
        <button
          type="submit"
          disabled={!email.trim() || loading}
          className="px-5 py-3 gradient-btn rounded-xl font-bold text-sm whitespace-nowrap disabled:opacity-50 cursor-pointer"
        >
          {loading ? "..." : "Restore"}
        </button>
      </form>
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </div>
  );
}
