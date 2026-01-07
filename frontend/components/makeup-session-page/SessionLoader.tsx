"use client";

import React, { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

interface SessionLoaderProps {
  stage: "starting" | "styling" | "generating";
}

const LOADING_MESSAGES = {
  starting: [
    "Setting up your session...",
    "Analyzing your preferences...",
    "Preparing your beauty canvas...",
    "Getting everything ready...",
  ],
  styling: [
    "Understanding your style...",
    "Matching with your outfit...",
    "Finding perfect accessories...",
    "Creating style harmony...",
  ],
  generating: [
    "AI is crafting your plan...",
    "Selecting best products...",
    "Optimizing step order...",
    "Finalizing your look...",
    "Almost there...",
  ],
};

const SessionLoader: React.FC<SessionLoaderProps> = ({ stage }) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = LOADING_MESSAGES[stage];

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [messages.length]);

  useEffect(() => {
    setMessageIndex(0);
  }, [stage]);

  const getStageProgress = () => {
    switch (stage) {
      case "starting":
        return 33;
      case "styling":
        return 66;
      case "generating":
        return 90;
      default:
        return 0;
    }
  };

  const getStageTitle = () => {
    switch (stage) {
      case "starting":
        return "Creating Session";
      case "styling":
        return "Analyzing Style";
      case "generating":
        return "Generating Plan";
      default:
        return "Loading";
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
      <div className="w-full max-w-[360px] mx-auto px-6">
        {/* Animated Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-300 animate-pulse">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            {/* Orbiting dots */}
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: "3s" }}>
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-pink-400 rounded-full" />
            </div>
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: "4s", animationDirection: "reverse" }}>
              <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-2 h-2 bg-purple-400 rounded-full" />
            </div>
          </div>
        </div>

        {/* Stage Title */}
        <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">
          {getStageTitle()}
        </h2>

        {/* Changing Message */}
        <p className="text-center text-slate-500 mb-8 min-h-[24px] transition-opacity duration-300">
          {messages[messageIndex]}
        </p>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${getStageProgress()}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Step {stage === "starting" ? 1 : stage === "styling" ? 2 : 3} of 3</span>
            <span>{getStageProgress()}%</span>
          </div>
        </div>

        {/* Stage Indicators */}
        <div className="flex justify-center gap-4 mt-8">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            stage === "starting" ? "bg-pink-100 text-pink-600" : "bg-slate-100 text-slate-400"
          }`}>
            <span className={`w-2 h-2 rounded-full ${stage === "starting" ? "bg-pink-500 animate-pulse" : "bg-slate-300"}`} />
            Session
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            stage === "styling" ? "bg-purple-100 text-purple-600" : "bg-slate-100 text-slate-400"
          }`}>
            <span className={`w-2 h-2 rounded-full ${stage === "styling" ? "bg-purple-500 animate-pulse" : "bg-slate-300"}`} />
            Style
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            stage === "generating" ? "bg-violet-100 text-violet-600" : "bg-slate-100 text-slate-400"
          }`}>
            <span className={`w-2 h-2 rounded-full ${stage === "generating" ? "bg-violet-500 animate-pulse" : "bg-slate-300"}`} />
            Plan
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionLoader;
