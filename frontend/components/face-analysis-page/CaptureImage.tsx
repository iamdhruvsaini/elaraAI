"use client";

import React, { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAnalyzeFaceMutation, useUpdateAllergiesMutation } from "@/redux/services/profile/profileService";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import CameraCapture from "./CameraCapture";
import ResultsDisplay from "./ResultsDisplay";
import AllergiesForm from "./AllergiesForm";

type FlowStep = "capture" | "results" | "allergies";

const CaptureImage: React.FC = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<FlowStep>("capture");

  // Image states
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);

  // Analysis states
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [analyzeFace, { isLoading: isAnalyzing }] = useAnalyzeFaceMutation();
  const [updateAllergies, { isLoading: isUpdatingAllergies }] = useUpdateAllergiesMutation();

  const handleCapture = (file: File, imageUrl: string) => {
    setCapturedFile(file);
    setCapturedImage(imageUrl);
  };

  const handleRetake = () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
    setCapturedImage(null);
    setCapturedFile(null);
    setAnalysisResult(null);
    setAnalysisError(null);
    setCurrentStep("capture");
  };

  const handleAnalyze = async () => {
    if (!capturedFile) {
      setAnalysisError("No image to analyze.");
      return;
    }

    setAnalysisError(null);

    try {
      const formData = new FormData();
      formData.append("image", capturedFile);

      const response = await analyzeFace(formData).unwrap();
      console.log("✅ Face analysis successful:", response);

      setAnalysisResult(response);
      setCurrentStep("results");
    } catch (err: any) {
      console.error("❌ Analysis failed:", err);
      setAnalysisError(err?.data?.message || "Analysis failed. Please try again.");
    }
  };

  const handleAddAllergies = () => {
    setCurrentStep("allergies");
  };

  const handleSkipAllergies = () => {
    router.push("/profile");
  };

  const handleSubmitAllergies = async (allergies: string[], sensitivityLevel: string = "normal") => {
    try {
      await updateAllergies({ allergies, sensitivity_level: sensitivityLevel }).unwrap();
      console.log("✅ Allergies updated successfully");
      router.push("/profile");
    } catch (error: any) {
      console.error("❌ Failed to update allergies:", error);
      setAnalysisError(error?.data?.message || "Failed to update allergies");
    }
  };

  const handleBack = () => {
    // Clean up image URLs to prevent memory leaks
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
      setCapturedImage(null);
    }
    
    if (currentStep === "capture") {
      router.back();
    } else if (currentStep === "results") {
      setCurrentStep("capture");
    } else if (currentStep === "allergies") {
      setCurrentStep("results");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="font-semibold text-base text-gray-900">
          {currentStep === "capture" && "Capture Your Face"}
          {currentStep === "results" && "Analysis Results"}
          {currentStep === "allergies" && "Add Allergies"}
        </h1>
        <div className="w-9" />
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* STEP 1: CAPTURE */}
        {currentStep === "capture" && (
          <>
            <CameraCapture
              onCapture={handleCapture}
              onRetake={handleRetake}
              capturedImage={capturedImage}
            />

            {analysisError && (
              <div className="max-w-md mx-auto px-4 pb-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{analysisError}</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* STEP 2: RESULTS */}
        {currentStep === "results" && analysisResult && capturedImage && (
          <ResultsDisplay
            analysisResult={analysisResult}
            capturedImage={capturedImage}
          />
        )}

        {/* STEP 3: ALLERGIES */}
        {currentStep === "allergies" && (
          <>
            <AllergiesForm
              onSubmit={handleSubmitAllergies}
              isLoading={isUpdatingAllergies}
            />

            {analysisError && (
              <div className="max-w-md mx-auto px-4 pb-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{analysisError}</p>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Fixed Bottom Actions */}
      {currentStep === "capture" && capturedImage && (
        <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-base rounded-xl shadow-lg"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="animate-spin w-5 h-5 mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                Continue
                <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
              </>
            )}
          </Button>
        </div>
      )}

      {currentStep === "results" && (
        <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg space-y-2">
          <Button
            onClick={handleAddAllergies}
            className="w-full h-14 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-base rounded-xl shadow-lg"
          >
            Add Allergies
            <ArrowLeft className="w-5 h-5 ml-2 rotate-180" />
          </Button>
          <Button
            onClick={handleSkipAllergies}
            variant="outline"
            className="w-full h-12 text-sm font-medium"
          >
            Skip for Now
          </Button>
        </div>
      )}

      {currentStep === "allergies" && (
        <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg space-y-2">
          <Button
            onClick={() => {
              const form = document.querySelector('form');
              if (form) form.requestSubmit();
            }}
            disabled={isUpdatingAllergies}
            className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-base rounded-xl shadow-lg"
          >
            {isUpdatingAllergies ? (
              <>
                <Loader2 className="animate-spin w-5 h-5 mr-2" />
                Saving...
              </>
            ) : (
              "Save & Continue to Profile"
            )}
          </Button>
          <Button
            onClick={handleSkipAllergies}
            variant="outline"
            className="w-full h-12 text-sm font-medium"
          >
            Skip for Now
          </Button>
        </div>
      )}
    </div>
  );
};

export default CaptureImage;
