"use client";

import { Palette, Droplets, Sparkles } from "lucide-react";

interface SkinAnalysisCardProps {
  skinTone?: string;
  undertone?: string;
  skinType?: string;
}

export const SkinAnalysisCard = ({
  skinTone,
  undertone,
  skinType,
}: SkinAnalysisCardProps) => {
  const hasData = skinTone || undertone || skinType;
  
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center">
          <Palette className="w-4 h-4 text-orange-600" />
        </div>
        <h3 className="font-semibold text-slate-800">Skin Analysis</h3>
      </div>

      {hasData ? (
        <div className="grid grid-cols-3 gap-3">
          {skinTone && (
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-3 text-center">
              <Droplets className="w-5 h-5 text-pink-500 mx-auto mb-1" />
              <p className="text-xs text-slate-500 mb-0.5">Tone</p>
              <p className="text-sm font-semibold text-slate-700 capitalize">{skinTone}</p>
            </div>
          )}
          {undertone && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 text-center">
              <Sparkles className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <p className="text-xs text-slate-500 mb-0.5">Undertone</p>
              <p className="text-sm font-semibold text-slate-700 capitalize">{undertone}</p>
            </div>
          )}
          {skinType && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-3 text-center">
              <Palette className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
              <p className="text-xs text-slate-500 mb-0.5">Type</p>
              <p className="text-sm font-semibold text-slate-700 capitalize">{skinType}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-50 rounded-xl p-4 text-center">
          <p className="text-sm text-slate-500">No skin analysis data yet</p>
          <p className="text-xs text-slate-400 mt-1">Complete a face analysis to see results</p>
        </div>
      )}
    </div>
  );
};
