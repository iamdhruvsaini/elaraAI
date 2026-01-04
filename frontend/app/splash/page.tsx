"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/common/Logo";
import { SparkleGroup } from "@/components/common/Sparkle";
import { useAuth } from "@/context/AuthContext";

export default function SplashScreen() {
  const router = useRouter();
  const { authChecked, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!authChecked) return;

    const timer = setTimeout(() => {
      if (isAuthenticated) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [authChecked, isAuthenticated, router]);

  return (
    <div className="relative flex h-dvh w-full flex-col items-center justify-center bg-[linear-gradient(45deg,#ee2b8c_0%,#ffab91_60%,#ffd54f_100%)] text-white p-6 overflow-hidden">
      {/* Decorative background blurs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-white/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[80px]" />
      </div>

      {/* Central Content */}
      <div className="relative flex flex-col items-center z-10">
        {/* Logo with Sparkles */}
        <div className="relative mb-8">
          <Logo size="xl" />
          <SparkleGroup />
        </div>

        {/* Tagline */}
        <p className="font-display text-white/90 text-sm font-light tracking-[0.25em] uppercase mt-3">
          Your Personal Makeup Artist
        </p>
      </div>

      {/* Loading Indicator */}
      <div className="absolute bottom-12 w-full flex justify-center">
        <div className="w-12 h-1 bg-white/30 rounded-full overflow-hidden">
          <div className="h-full bg-white/80 w-1/2 animate-shimmer rounded-full" />
        </div>
      </div>
    </div>
  );
}
