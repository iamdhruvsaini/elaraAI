"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  CheckCircle2,
  Lightbulb,
  RefreshCw,
  Star,
  Palette,
  Scissors,
  Gauge,
} from "lucide-react";
import type { HairSuggestionResponse } from "@/redux/services/makeup/types";

interface HairResultsProps {
  result: HairSuggestionResponse;
  onReset: () => void;
}

const HairResults: React.FC<HairResultsProps> = ({ result, onReset }) => {
  return (
    <div className="space-y-6 pb-8">
      {/* Recommended Style Hero Card */}
      <div className="bg-gradient-to-br from-pink-500 via-purple-500 to-violet-600 p-6 rounded-3xl shadow-xl shadow-purple-200 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

        <div className="relative">
          <div className="flex items-center gap-2 text-white/80 text-sm font-medium mb-2">
            <Sparkles className="w-4 h-4" />
            Recommended Style
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">
            {result.recommended_style}
          </h2>

          {/* Maintenance Level Badge */}
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
            <Gauge className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-semibold">
              {result.maintenance_level} Maintenance
            </span>
          </div>
        </div>
      </div>

      {/* Style Attributes */}
      {result.style_attributes && result.style_attributes.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl flex items-center justify-center">
              <Palette className="w-4 h-4 text-pink-600" />
            </div>
            <h3 className="font-bold text-slate-800">Style Attributes</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.style_attributes.map((attr, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-gradient-to-r from-pink-50 to-purple-50 text-slate-700 text-sm font-medium rounded-full border border-pink-100"
              >
                {attr}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Benefits */}
      {result.benefits && result.benefits.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl flex items-center justify-center">
              <Star className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="font-bold text-slate-800">Benefits</h3>
          </div>
          <div className="space-y-3">
            {result.benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-100"
              >
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-800 text-sm">
                    {benefit.benefit}
                  </span>
                </div>
                <p className="text-slate-600 text-sm pl-6">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Styling Tips */}
      {result.styling_tips && result.styling_tips.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-orange-200 rounded-xl flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="font-bold text-slate-800">Styling Tips</h3>
          </div>
          <div className="space-y-2">
            {result.styling_tips.map((tip, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-amber-50/50 rounded-xl"
              >
                <span className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center text-amber-700 text-xs font-bold shrink-0">
                  {index + 1}
                </span>
                <p className="text-slate-700 text-sm">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alternative Styles */}
      {result.alternatives && result.alternatives.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-100 to-purple-200 rounded-xl flex items-center justify-center">
              <Scissors className="w-4 h-4 text-violet-600" />
            </div>
            <h3 className="font-bold text-slate-800">Alternative Styles</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.alternatives.map((alt, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-gradient-to-r from-violet-50 to-purple-50 text-violet-700 text-sm font-medium rounded-xl border border-violet-100"
              >
                {alt}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Try Again Button */}
      <Button
        onClick={onReset}
        variant="outline"
        className="w-full h-12 font-medium text-slate-700 rounded-xl border-slate-200"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Try Another Style
      </Button>
    </div>
  );
};

export default HairResults;
