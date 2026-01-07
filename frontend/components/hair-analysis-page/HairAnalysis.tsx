"use client";

import React, { useState } from "react";
import { ArrowLeft, Scissors } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useGetHairSuggestionMutation } from "@/redux/services/makeup/makeupService";
import type {
  HairSuggestionRequest,
  HairSuggestionResponse,
} from "@/redux/services/makeup/types";
import HairForm from "./HairForm";
import HairResults from "./HairResults";

type FlowStep = "form" | "results";

const initialFormData: HairSuggestionRequest = {
  outfit_description: "",
  outfit_style: "",
  occasion: "",
  face_shape: "oval",
  hair_texture: "medium",
  hair_length: "medium",
};

const HairAnalysis: React.FC = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<FlowStep>("form");
  const [formData, setFormData] = useState<HairSuggestionRequest>(initialFormData);
  const [result, setResult] = useState<HairSuggestionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [getHairSuggestion, { isLoading }] = useGetHairSuggestionMutation();

  const handleFormChange = (
    field: keyof HairSuggestionRequest,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    setError(null);

    // Validate required fields with minimum length
    if (!formData.occasion || formData.occasion.length < 3) {
      setError("Please select an occasion");
      return;
    }
    if (!formData.outfit_style || formData.outfit_style.length < 3) {
      setError("Please select an outfit style");
      return;
    }
    if (!formData.outfit_description || formData.outfit_description.trim().length < 5) {
      setError("Please provide an outfit description (at least 5 characters)");
      return;
    }

    try {
      const response = await getHairSuggestion(formData).unwrap();
      console.log("✅ Hair suggestion received:", response);
      setResult(response);
      setCurrentStep("results");
    } catch (err: any) {
      console.error("❌ Hair suggestion failed:", err);
      
      // Better error message handling
      let errorMessage = "Failed to get hair suggestions. Please try again.";
      
      if (err?.data?.detail) {
        if (Array.isArray(err.data.detail)) {
          // Handle validation errors array from FastAPI
          errorMessage = err.data.detail
            .map((e: any) => e.msg || JSON.stringify(e))
            .join(", ");
        } else if (typeof err.data.detail === "string") {
          errorMessage = err.data.detail;
        }
      } else if (err?.data?.message) {
        errorMessage = err.data.message;
      }
      
      setError(errorMessage);
    }
  };

  const handleReset = () => {
    setResult(null);
    setFormData(initialFormData);
    setCurrentStep("form");
    setError(null);
  };

  const handleBack = () => {
    if (currentStep === "results") {
      setCurrentStep("form");
    } else {
      router.back();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Mobile Shell */}
      <div className="w-full max-w-[440px] mx-auto min-h-screen flex flex-col px-4">
        {/* Header */}
        <header className="pt-4 pb-6 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mb-4 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Back
          </Button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
              <Scissors className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Hair Analysis
              </h1>
              <p className="text-slate-500 text-sm">
                {currentStep === "form"
                  ? "Tell us about your style"
                  : "Your personalized recommendations"}
              </p>
            </div>
          </div>
        </header>

        {/* Progress Indicator */}
        <div className="flex gap-2 mb-6">
          <div
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              currentStep === "form"
                ? "bg-gradient-to-r from-pink-500 to-purple-500"
                : "bg-slate-200"
            }`}
          />
          <div
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              currentStep === "results"
                ? "bg-gradient-to-r from-purple-500 to-violet-500"
                : "bg-slate-200"
            }`}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 pb-8">
          {currentStep === "form" && (
            <HairForm
              formData={formData}
              onFormChange={handleFormChange}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          )}

          {currentStep === "results" && result && (
            <HairResults result={result} onReset={handleReset} />
          )}
        </main>
      </div>
    </div>
  );
};

export default HairAnalysis;
