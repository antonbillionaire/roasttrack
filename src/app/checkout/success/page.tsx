"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const checkoutId = searchParams.get("checkout_id");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    if (!checkoutId) {
      setStatus("error");
      return;
    }

    let attempts = 0;
    const maxAttempts = 10;

    const tryActivate = async () => {
      try {
        const res = await fetch(`/api/activate?checkout_id=${checkoutId}`);
        const data = await res.json();

        if (res.ok && data.token) {
          // Save token to localStorage so homepage picks it up
          localStorage.setItem("rt_token", data.token);
          setCredits(data.credits);
          setStatus("success");
          return;
        }

        if (data.retry && attempts < maxAttempts) {
          // Webhook hasn't processed yet, retry in 2s
          attempts++;
          setTimeout(tryActivate, 2000);
          return;
        }

        // Fallback: still show success (webhook might be slow)
        setStatus("success");
      } catch {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(tryActivate, 2000);
        } else {
          setStatus("success"); // Show success anyway, credits will appear later
        }
      }
    };

    // Start trying after 1.5s (give webhook time to process)
    setTimeout(tryActivate, 1500);
  }, [checkoutId]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-warm">
        <div className="text-6xl mb-6 fire-bounce">🔥</div>
        <h1 className="text-2xl font-black mb-2">Processing payment...</h1>
        <p className="text-gray-500">Hang tight, unlocking your credits</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-warm">
        <div className="text-6xl mb-6">😵</div>
        <h1 className="text-2xl font-black mb-2">Something went wrong</h1>
        <p className="text-gray-500 mb-6">Payment may still be processing. Check your email.</p>
        <Link href="/" className="gradient-btn px-8 py-3 rounded-xl font-bold">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-warm">
      <div className="text-6xl mb-6">🎉</div>
      <h1 className="text-3xl font-black mb-2">Payment Successful!</h1>
      {credits !== null ? (
        <p className="text-gray-500 mb-2">
          You now have <span className="font-black gradient-text">{credits}</span> {credits === 1 ? "credit" : "credits"}!
        </p>
      ) : (
        <p className="text-gray-500 mb-2">Your credits have been added to your account.</p>
      )}
      <Link
        href="/"
        className="gradient-btn px-8 py-4 rounded-2xl font-bold text-lg mt-6"
      >
        🔥 Start Roasting
      </Link>
    </div>
  );
}

export default function CheckoutSuccess() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-warm">
          <div className="text-6xl mb-6 fire-bounce">🔥</div>
          <h1 className="text-2xl font-black mb-2">Loading...</h1>
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
