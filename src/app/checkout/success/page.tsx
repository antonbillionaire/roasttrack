"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const checkoutId = searchParams.get("checkout_id");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!checkoutId) {
      setStatus("error");
      return;
    }

    const timer = setTimeout(() => setStatus("success"), 2000);
    return () => clearTimeout(timer);
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
      <p className="text-gray-500 mb-2">Your credits have been added to your account.</p>
      <p className="text-gray-400 text-sm mb-8">
        Check your email for your personal access link.
      </p>
      <Link
        href="/"
        className="gradient-btn px-8 py-4 rounded-2xl font-bold text-lg"
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
