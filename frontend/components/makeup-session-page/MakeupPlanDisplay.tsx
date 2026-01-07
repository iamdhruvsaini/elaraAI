"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Volume2,
} from "lucide-react";
import type { MakeupPlanResponse, MakeupStep } from "@/redux/services/makeup/types";

interface MakeupPlanDisplayProps {
  plan: MakeupPlanResponse;
  onStartSession: () => void;
  onSaveForLater?: () => void;
  isLoading?: boolean;
}

// Accessory suggestion component
const AccessorySuggestion: React.FC<{ style: string }> = ({ style }) => {
  const accessories = [
    { name: "Gold Hoop Earrings", icon: "○" },
    { name: "Delicate Chain", icon: "∞" },
  ];

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-pink-500" />
        AI Accessory Suggestion
      </h3>
      <p className="text-slate-600 text-sm mb-4">
        Based on your {style} look, we recommend gold accents to highlight your features.
      </p>
      <div className="flex gap-3">
        {accessories.map((acc, idx) => (
          <div
            key={idx}
            className="flex-1 bg-slate-50 rounded-xl p-4 flex flex-col items-center gap-2"
          >
            <div className="w-12 h-12 border border-slate-200 rounded-full flex items-center justify-center text-slate-400">
              <span className="text-xl">{acc.icon}</span>
            </div>
            <span className="text-xs font-medium text-slate-700 text-center">{acc.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Collapsible step component
const StepItem: React.FC<{
  step: MakeupStep;
  isExpanded: boolean;
  onToggle: () => void;
}> = ({ step, isExpanded, onToggle }) => {
  return (
    <div className="relative">
      {/* Timeline connector */}
      <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-slate-200 z-0" />

      <div className="flex gap-3">
        {/* Step number */}
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-20 relative ${
            step.step_number === 1
              ? "bg-pink-500 text-white shadow-md"
              : "bg-white border-2 border-slate-200 text-slate-500"
          }`}
        >
          <span className="text-sm font-bold">{step.step_number}</span>
        </div>

        {/* Step content */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <button
            onClick={onToggle}
            className="w-full p-4 flex items-center justify-between text-left"
          >
            <div>
              <h4 className="font-bold text-slate-800">{step.category}</h4>
              <p className="text-xs text-slate-500">{step.duration_minutes} min</p>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {isExpanded && (
            <div className="px-4 pb-4 space-y-3">
              <p className="text-sm text-slate-600">{step.instruction}</p>

              {step.products && step.products.length > 0 && (
                <div className="flex gap-2">
                  {step.products.slice(0, 3).map((product, idx) => (
                    <div
                      key={idx}
                      className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center"
                      title={product}
                    >
                      <span className="text-xs">💄</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MakeupPlanDisplay: React.FC<MakeupPlanDisplayProps> = ({
  plan,
  onStartSession,
  onSaveForLater,
  isLoading = false,
}) => {
  const [expandedSteps, setExpandedSteps] = useState<number[]>([1]);

  const toggleStep = (stepNumber: number) => {
    setExpandedSteps((prev) =>
      prev.includes(stepNumber)
        ? prev.filter((s) => s !== stepNumber)
        : [...prev, stepNumber]
    );
  };

  const getIntensityPercent = (intensity: string) => {
    switch (intensity.toLowerCase()) {
      case "light":
        return 33;
      case "medium":
        return 66;
      case "bold":
      case "heavy":
        return 100;
      default:
        return 50;
    }
  };

  const getKeyFocusIcon = (focus: string) => {
    const lower = focus.toLowerCase();
    if (lower.includes("eye")) return <Eye className="w-4 h-4" />;
    if (lower.includes("glow") || lower.includes("natural")) return <Sparkles className="w-4 h-4" />;
    return <span className="text-sm">✨</span>;
  };

  // Extract products needed from all steps
  const productsNeeded = plan.steps
    .flatMap((step) => step.products || [])
    .filter((p, i, arr) => arr.indexOf(p) === i)
    .slice(0, 4);

  return (
    <div className="space-y-5 pb-32">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-slate-900">Your Custom Plan 💄</h1>
        <p className="text-slate-500 text-sm">Personalized just for you</p>
      </div>

      {/* Intensity Card */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-700">Intensity</span>
          <span className="text-sm font-bold text-pink-500 capitalize">{plan.intensity}</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-400 to-pink-500 rounded-full transition-all duration-500"
            style={{ width: `${getIntensityPercent(plan.intensity)}%` }}
          />
        </div>
      </div>

      {/* Key Focus Areas */}
      {plan.key_focus && plan.key_focus.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-3">Key Focus Areas</h3>
          <div className="flex flex-wrap gap-2">
            {plan.key_focus.map((focus, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm"
              >
                {getKeyFocusIcon(focus)}
                <span className="text-sm font-medium text-slate-700">{focus}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Accessory Suggestion */}
      <AccessorySuggestion style={plan.style} />

      {/* Steps Timeline */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-4">Steps Timeline</h3>
        <div className="space-y-4">
          {plan.steps.map((step) => (
            <StepItem
              key={step.step_number}
              step={step}
              isExpanded={expandedSteps.includes(step.step_number)}
              onToggle={() => toggleStep(step.step_number)}
            />
          ))}
        </div>
      </div>

      {/* Products Needed */}
      {productsNeeded.length > 0 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800">Products Needed</h3>
            <span className="text-xs font-medium text-pink-500">{productsNeeded.length} items</span>
          </div>
          <div className="space-y-2">
            {productsNeeded.map((product, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-2 h-2 bg-pink-500 rounded-full" />
                <span className="text-sm text-slate-700">{product}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-100 p-4 pb-6 z-50">
        <div className="max-w-[440px] mx-auto space-y-3">
          <Button
            onClick={onStartSession}
            disabled={isLoading}
            className="w-full h-14 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-base rounded-2xl shadow-lg"
          >
            <Volume2 className="w-5 h-5 mr-2" />
            Start Voice-Guided Session
          </Button>

          <p className="text-center text-xs text-slate-400">
            {plan.steps.length} steps • ~{plan.steps.reduce((acc, s) => acc + (s.duration_minutes || 2), 0)} minutes
          </p>
        </div>
      </div>
    </div>
  );
};

export default MakeupPlanDisplay;
