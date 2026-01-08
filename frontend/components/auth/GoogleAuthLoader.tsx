"use client";

import { Sparkles } from "lucide-react";

const LOADING_MESSAGES = [
  "Connecting to Google...",
  "Verifying your account...",
  "Fetching your profile...",
  "Setting up your session...",
  "Almost there...",
];

interface GoogleAuthLoaderProps {
  messageIndex: number;
}

export default function GoogleAuthLoader({ messageIndex }: GoogleAuthLoaderProps) {
  const message = LOADING_MESSAGES[messageIndex] || LOADING_MESSAGES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-white">
      <div className="flex flex-col items-center gap-6 p-8">
        {/* Animated Logo */}
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-200 animate-pulse">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          {/* Rotating ring */}
          <div className="absolute -inset-2 rounded-3xl border-4 border-transparent border-t-pink-500 border-r-purple-500 animate-spin" />
        </div>

        {/* Loading text */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold text-slate-800">
            {message}
          </h2>
          <p className="text-slate-500 text-sm">
            Please wait while we authenticate you
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex gap-2">
          {LOADING_MESSAGES.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                idx <= messageIndex
                  ? "bg-gradient-to-r from-pink-500 to-purple-600 scale-110"
                  : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        {/* Subtle shimmer bar */}
        <div className="w-48 h-1 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}

export { LOADING_MESSAGES };
