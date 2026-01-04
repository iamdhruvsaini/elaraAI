"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AnalysisResult {
  skin_tone: string;
  undertone: string;
  skin_type: string;
  confidence: number;
  raw_data?: {
    concerns?: Array<{
      name: string;
      severity: string;
      location?: string;
    }>;
  };
}

const skinToneColors: Record<string, string> = {
  fair: "#f5e6d3",
  light: "#f0d5b8",
  medium: "#e0a989",
  olive: "#c4a574",
  tan: "#b08968",
  deep: "#8b6f47",
  dark: "#5c4033",
};

const undertoneColors: Record<string, string> = {
  warm: "#f2d49b",
  cool: "#e8d5e8",
  neutral: "#ddd5c8",
};

export default function AnalysisResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);

  useEffect(() => {
    const storedResult = sessionStorage.getItem("analysisResult");
    const storedImage = sessionStorage.getItem("capturedImage");

    if (storedResult) {
      setResult(JSON.parse(storedResult));
    }
    if (storedImage) {
      setCapturedImage(storedImage);
    }
  }, []);

  const handleContinue = () => {
    router.push("/dashboard");
  };

  const handleRetake = () => {
    sessionStorage.removeItem("analysisResult");
    sessionStorage.removeItem("capturedImage");
    router.push("/face-analysis");
  };

  if (!result) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-foreground-muted">No analysis results found</p>
          <Button className="mt-4" onClick={() => router.push("/face-analysis")}>
            Start Analysis
          </Button>
        </div>
      </div>
    );
  }

  const concerns = result.raw_data?.concerns || [
    { name: "Mild Acne", severity: "low", location: "T-zone" },
    { name: "Dark Circles", severity: "medium", location: "Under eyes" },
    { name: "Dryness", severity: "low", location: "Cheeks" },
  ];

  return (
    <div className="min-h-dvh bg-background safe-top">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-input transition-colors"
        >
          <ArrowLeft size={24} className="text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">
          ✨ Analysis Complete!
        </h1>
      </div>

      {/* Content */}
      <div className="px-6 pb-32 space-y-6">
        {/* Before/After Slider */}
        {capturedImage && (
          <div className="relative rounded-2xl overflow-hidden h-64 bg-black">
            <img
              src={capturedImage}
              alt="Your photo"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Slider overlay effect */}
            <div
              className="absolute inset-y-0 right-0 bg-gradient-to-r from-transparent via-primary/20 to-primary/40"
              style={{ left: `${sliderPosition}%` }}
            />
            {/* Slider control */}
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={(e) => setSliderPosition(Number(e.target.value))}
              className="absolute bottom-4 left-4 right-4 z-10"
            />
          </div>
        )}

        {/* Skin Profile */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Your Skin Profile
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <p className="text-xs text-foreground-muted mb-1">Skin Tone</p>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full border border-border"
                  style={{
                    backgroundColor:
                      skinToneColors[result.skin_tone.toLowerCase()] || "#e0a989",
                  }}
                />
                <span className="font-semibold text-foreground uppercase">
                  {result.skin_tone}
                </span>
              </div>
            </Card>

            <Card className="p-4">
              <p className="text-xs text-foreground-muted mb-1">Undertone</p>
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full border border-border"
                  style={{
                    backgroundColor:
                      undertoneColors[result.undertone.toLowerCase()] || "#f2d49b",
                  }}
                />
                <span className="font-semibold text-foreground uppercase">
                  {result.undertone}
                </span>
              </div>
            </Card>

            <Card className="p-4 col-span-2">
              <p className="text-xs text-foreground-muted mb-1">Skin Type</p>
              <span className="font-semibold text-foreground uppercase">
                {result.skin_type}
              </span>
            </Card>
          </div>
        </div>

        {/* Concerns Detected */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Concerns Detected
          </h2>
          <div className="space-y-3">
            {concerns.map((concern, index) => (
              <Card key={index} className="p-4 flex items-center gap-4">
                <div
                  className={cn(
                    "w-3 h-3 rounded-full",
                    concern.severity === "low" && "bg-success",
                    concern.severity === "medium" && "bg-warning",
                    concern.severity === "high" && "bg-danger"
                  )}
                />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{concern.name}</p>
                  <p className="text-xs text-foreground-muted">
                    {concern.location} • {concern.severity} severity
                  </p>
                </div>
                <button className="text-primary text-sm flex items-center">
                  View Details
                  <ChevronRight size={16} />
                </button>
              </Card>
            ))}
          </div>
        </div>

        {/* Confidence */}
        <Card className="p-4 bg-success/10 border-success/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
              <span className="text-lg">✓</span>
            </div>
            <div>
              <p className="font-medium text-foreground">Analysis Confidence</p>
              <p className="text-sm text-foreground-muted">
                {Math.round(result.confidence * 100)}% accuracy
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Footer Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-6 safe-bottom">
        <div className="max-w-[430px] mx-auto flex gap-4">
          <Button variant="outline" fullWidth onClick={handleRetake}>
            Retake
          </Button>
          <Button variant="gradient" fullWidth onClick={handleContinue}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
