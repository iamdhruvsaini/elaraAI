"use client";

import React from "react";
import { CheckCircle, Sparkles } from "lucide-react";

interface AnalysisResult {
  skin_tone: string;
  undertone: string;
  skin_type: string;
  confidence: number;
  raw_data?: any;
}

interface ResultsDisplayProps {
  analysisResult: AnalysisResult;
  capturedImage: string;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  analysisResult,
  capturedImage,
}) => {
  return (
    <div className="px-4 py-6 space-y-6 max-w-md mx-auto">
      {/* Success Message */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Analysis Complete!
        </h2>
        <p className="text-sm text-gray-600">
          We've analyzed your skin tone and type
        </p>
      </div>

      {/* Results Card */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        {/* Image Preview */}
        {capturedImage && (
          <div className="relative w-full h-48">
            <img
              src={capturedImage}
              alt="Your face"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        )}

        {/* Results Grid */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-purple-50 p-4 rounded-xl">
              <p className="text-xs text-purple-600 font-medium mb-1">Skin Tone</p>
              <p className="text-lg font-bold text-gray-900 capitalize">
                {analysisResult.skin_tone}
              </p>
            </div>
            <div className="bg-pink-50 p-4 rounded-xl">
              <p className="text-xs text-pink-600 font-medium mb-1">Undertone</p>
              <p className="text-lg font-bold text-gray-900 capitalize">
                {analysisResult.undertone}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl">
              <p className="text-xs text-blue-600 font-medium mb-1">Skin Type</p>
              <p className="text-lg font-bold text-gray-900 capitalize">
                {analysisResult.skin_type}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-xl">
              <p className="text-xs text-green-600 font-medium mb-1">Confidence</p>
              <p className="text-lg font-bold text-gray-900">
                {(analysisResult.confidence * 100).toFixed(0)}%
              </p>
            </div>
          </div>

          {/* Info Note */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl">
            <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              This analysis helps us recommend the perfect makeup products and shades for your unique skin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsDisplay;
