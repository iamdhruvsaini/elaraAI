"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Scan, Palette, CheckCircle2, Mic } from "lucide-react";

interface AnalysisLoaderProps {
  isAnalyzing: boolean;
}

const ANALYSIS_STEPS = [
  {
    id: 1,
    title: "Scanning Face",
    description: "Detecting facial features and contours",
    icon: Scan,
  },
  {
    id: 2,
    title: "Analyzing Skin",
    description: "Evaluating skin tone and undertone",
    icon: Palette,
  },
  {
    id: 3,
    title: "Processing Results",
    description: "Generating personalized insights",
    icon: Sparkles,
  },
];

const LOADING_MESSAGES = [
  "Mapping your unique features...",
  "Analyzing your skin tone...",
  "Detecting undertones...",
  "Identifying skin type...",
  "Creating your beauty profile...",
  "Almost there...",
];

const AnalysisLoader: React.FC<AnalysisLoaderProps> = ({ isAnalyzing }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isAnalyzing) return;

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95;
        return prev + Math.random() * 3;
      });
    }, 200);

    // Step progression
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= ANALYSIS_STEPS.length - 1) return prev;
        return prev + 1;
      });
    }, 2000);

    // Message rotation
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
      clearInterval(messageInterval);
    };
  }, [isAnalyzing]);

  if (!isAnalyzing) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
      <div className="w-full max-w-[360px] mx-auto px-6">
        {/* Main Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-300 animate-pulse">
              <Scan className="w-12 h-12 text-white" />
            </div>
            {/* Animated ring */}
            <div className="absolute inset-0 w-24 h-24 rounded-3xl border-4 border-pink-300 animate-ping opacity-20" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">
          Analyzing Your Face
        </h2>
        <p className="text-center text-slate-500 mb-8 min-h-6 transition-opacity duration-300">
          {LOADING_MESSAGES[messageIndex]}
        </p>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps Timeline */}
        <div className="space-y-4">
          {ANALYSIS_STEPS.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const StepIcon = step.icon;

            return (
              <div
                key={step.id}
                className={`flex items-start gap-4 transition-all duration-300 ${
                  isCurrent ? "opacity-100" : isCompleted ? "opacity-60" : "opacity-40"
                }`}
              >
                {/* Step indicator */}
                <div className="relative flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? "bg-emerald-500"
                        : isCurrent
                        ? "bg-gradient-to-br from-pink-500 to-purple-600 animate-pulse"
                        : "bg-slate-200"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : (
                      <StepIcon className={`w-5 h-5 ${isCurrent ? "text-white" : "text-slate-400"}`} />
                    )}
                  </div>
                  {/* Connector line */}
                  {index < ANALYSIS_STEPS.length - 1 && (
                    <div
                      className={`w-0.5 h-8 mt-1 transition-colors duration-300 ${
                        isCompleted ? "bg-emerald-300" : "bg-slate-200"
                      }`}
                    />
                  )}
                </div>

                {/* Step content */}
                <div className="flex-1 pt-1">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`font-semibold ${
                        isCurrent ? "text-slate-800" : "text-slate-600"
                      }`}
                    >
                      {step.title}
                    </h3>
                    {isCurrent && (
                      <span className="px-2 py-0.5 bg-pink-100 text-pink-600 text-xs font-medium rounded-full">
                        In Progress
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* AI Coach Badge */}
        <div className="mt-8 flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full">
            <Mic className="w-4 h-4 text-pink-500" />
            <span className="text-sm font-medium text-slate-600">AI Analysis Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisLoader;
