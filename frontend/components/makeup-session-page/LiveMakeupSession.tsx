"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import {
  X,
  Mic,
  Pause,
  Play,
  CheckCircle,
  Clock,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { RootState } from "@/redux/store";
import type { MakeupStep } from "@/redux/services/makeup/types";
import {
  completeStep,
  togglePause,
  setVoiceActive,
  updateElapsedTime,
} from "@/redux/services/makeup/makeupSlice";
import { useVoiceSynthesis } from "@/lib/hooks/useVoiceSynthesis";

interface LiveMakeupSessionProps {
  onComplete: () => void;
  onClose: () => void;
}

const LiveMakeupSession: React.FC<LiveMakeupSessionProps> = ({
  onComplete,
  onClose,
}) => {
  const dispatch = useDispatch();
  const router = useRouter();

  const {
    makeupPlan,
    currentStepIndex,
    completedSteps,
    isVoiceActive,
    isPaused,
    elapsedSeconds,
  } = useSelector((state: RootState) => state.makeupSession);

  const { speak, stop, pause: pauseVoice, resume: resumeVoice, isSpeaking, isSupported } = useVoiceSynthesis({
    rate: 0.85,
  });

  // Timer
  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        dispatch(updateElapsedTime(elapsedSeconds + 1));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPaused, elapsedSeconds, dispatch]);

  // Voice reading current step
  const currentStep = makeupPlan?.steps[currentStepIndex];

  const speakCurrentStep = useCallback(() => {
    if (currentStep && isVoiceActive && isSupported) {
      const text = `Step ${currentStep.step_number}: ${currentStep.category}. ${currentStep.instruction}`;
      speak(text);
    }
  }, [currentStep, isVoiceActive, isSupported, speak]);

  // Speak when step changes or voice is activated
  useEffect(() => {
    if (isVoiceActive && currentStep && !isPaused) {
      speakCurrentStep();
    }
  }, [currentStepIndex, isVoiceActive, isPaused]);

  const handleToggleVoice = () => {
    if (isVoiceActive) {
      stop();
      dispatch(setVoiceActive(false));
    } else {
      dispatch(setVoiceActive(true));
    }
  };

  const handleTogglePause = () => {
    if (isPaused) {
      resumeVoice();
    } else {
      pauseVoice();
    }
    dispatch(togglePause());
  };

  const handleCompleteStep = (stepNumber: number) => {
    dispatch(completeStep(stepNumber));
    stop();
  };

  const handleCompleteMakeup = () => {
    stop();
    onComplete();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!makeupPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">No makeup plan found. Please start a new session.</p>
      </div>
    );
  }

  const steps = makeupPlan.steps;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Shell */}
      <div className="w-full max-w-[440px] mx-auto min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-slate-100 p-4 flex items-center justify-between sticky top-0 z-20">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>

          <div className="flex flex-col items-center">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Live Session</span>
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full mt-1">
              <Mic className="w-3 h-3 text-pink-500" />
              <span className="text-xs font-semibold text-slate-700">
                {isVoiceActive ? "AI Coach Active" : "Voice Off"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-slate-200">
            <Clock className="w-4 h-4 text-pink-500" />
            <span className="text-sm font-bold text-slate-800">{formatTime(elapsedSeconds)}</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 pb-40 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Makeup Routine</h1>
            <p className="text-slate-500 text-sm">Step-by-step voice guidance</p>
          </div>

          {/* Steps Timeline */}
          <div className="space-y-4">
            {steps.map((step, index) => {
              const isCompleted = completedSteps.includes(step.step_number);
              const isCurrent = index === currentStepIndex;

              return (
                <div key={step.step_number} className="relative">
                  {/* Connecting line */}
                  {index < steps.length - 1 && (
                    <div
                      className={`absolute left-5 top-12 bottom-0 w-0.5 ${
                        isCompleted ? "bg-pink-300" : "bg-slate-200"
                      }`}
                    />
                  )}

                  <div className="flex gap-4">
                    {/* Step indicator */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 transition-all ${
                        isCompleted
                          ? "bg-pink-100 border-2 border-pink-400"
                          : isCurrent
                          ? "bg-pink-500 shadow-lg shadow-pink-200"
                          : "bg-white border-2 border-slate-200"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-pink-500" />
                      ) : (
                        <span
                          className={`text-sm font-bold ${
                            isCurrent ? "text-white" : "text-slate-500"
                          }`}
                        >
                          {step.step_number}
                        </span>
                      )}
                    </div>

                    {/* Step card */}
                    <div
                      className={`flex-1 rounded-2xl p-4 transition-all ${
                        isCurrent
                          ? "bg-white border-2 border-pink-200 shadow-lg"
                          : isCompleted
                          ? "bg-white/60"
                          : "bg-white border border-slate-100"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3
                            className={`font-bold ${
                              isCompleted ? "text-slate-400" : "text-slate-800"
                            }`}
                          >
                            {step.category}
                          </h3>
                          {isCurrent && (
                            <span className="text-xs font-bold text-pink-500 bg-pink-50 px-2 py-0.5 rounded-full">
                              CURRENT
                            </span>
                          )}
                        </div>
                      </div>

                      <p
                        className={`text-sm mb-3 ${
                          isCompleted ? "text-slate-400" : "text-slate-600"
                        }`}
                      >
                        {step.instruction}
                      </p>

                      {/* Voice indicator for current step */}
                      {isCurrent && isVoiceActive && (
                        <div className="flex items-center gap-2 bg-pink-50 px-3 py-2 rounded-xl mb-3">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div
                                key={i}
                                className={`w-1 bg-pink-400 rounded-full animate-pulse`}
                                style={{
                                  height: `${8 + Math.random() * 12}px`,
                                  animationDelay: `${i * 0.1}s`,
                                }}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-bold text-pink-600 ml-2">
                            VOICE GUIDE ACTIVE
                          </span>
                        </div>
                      )}



                      {/* Complete step button */}
                      {isCurrent && !isCompleted && (
                        <Button
                          onClick={() => handleCompleteStep(step.step_number)}
                          className="w-full mt-3 bg-pink-50 hover:bg-pink-100 text-pink-600 font-medium rounded-xl"
                          variant="ghost"
                        >
                          Mark as Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {/* Fixed Bottom Controls */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 p-4 pb-6 safe-area-inset-bottom z-50">
          <div className="max-w-[440px] mx-auto space-y-3">
            {/* Voice & Pause Controls */}
            <div className="flex gap-3">
              <button
                onClick={handleToggleVoice}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-all ${
                  isVoiceActive
                    ? "bg-pink-50 border-pink-200 text-pink-600"
                    : "bg-slate-50 border-slate-200 text-slate-600"
                }`}
              >
                {isVoiceActive ? (
                  <Volume2 className="w-5 h-5" />
                ) : (
                  <VolumeX className="w-5 h-5" />
                )}
                <span className="font-medium text-sm">
                  {isVoiceActive ? "Voice On" : "Voice Off"}
                </span>
              </button>

              <button
                onClick={handleTogglePause}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-600"
              >
                {isPaused ? (
                  <Play className="w-5 h-5" />
                ) : (
                  <Pause className="w-5 h-5" />
                )}
                <span className="font-medium text-sm">
                  {isPaused ? "Resume" : "Pause"}
                </span>
              </button>
            </div>

            {/* Complete Makeup Button */}
            <Button
              onClick={handleCompleteMakeup}
              className="w-full h-14 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-base rounded-2xl shadow-lg"
            >
              Complete Makeup ✨
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMakeupSession;
