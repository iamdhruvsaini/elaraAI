"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import {
  useStartMakeupSessionMutation,
  useCreateStyleSessionMutation,
  useGenerateMakeupPlanMutation,
} from "@/redux/services/makeup/makeupService";
import {
  setCurrentSession,
  setStyleSession,
  setMakeupPlan,
  startLiveSession,
  resetSession,
} from "@/redux/services/makeup/makeupSlice";
import type { RootState } from "@/redux/store";
import type { StartMakeupRequest } from "@/redux/services/makeup/types";
import MakeupSessionForm from "./MakeupSessionForm";
import MakeupPlanDisplay from "./MakeupPlanDisplay";
import LiveMakeupSession from "./LiveMakeupSession";
import SessionLoader from "./SessionLoader";

type FlowStep = "form" | "plan" | "live";
type LoadingStage = "starting" | "styling" | "generating" | null;

const initialFormData: StartMakeupRequest = {
  occasion: "daily",
  scope: "full_face",
  outfit_description: "",
  scheduled_event_id: undefined,
};

const MakeupSession: React.FC = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  
  // Get cached data from Redux
  const makeupPlan = useSelector((state: RootState) => state.makeupSession.makeupPlan);
  const sessionData = useSelector((state: RootState) => state.makeupSession.currentSession);
  
  const [currentStep, setCurrentStep] = useState<FlowStep>("form");
  const [formData, setFormData] = useState<StartMakeupRequest>(initialFormData);
  const [accessories, setAccessories] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>(null);

  // Reset session on mount to start fresh
  useEffect(() => {
    dispatch(resetSession());
  }, [dispatch]);

  const [startSession, { isLoading: isStartingSession }] = useStartMakeupSessionMutation();
  const [createStyle, { isLoading: isCreatingStyle }] = useCreateStyleSessionMutation();
  const [generatePlan, { isLoading: isGeneratingPlan }] = useGenerateMakeupPlanMutation();

  const handleFormChange = (field: keyof StartMakeupRequest, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAccessoryAdd = (key: string, value: string) => {
    setAccessories((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleAccessoryRemove = (key: string) => {
    setAccessories((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const handleSubmit = async () => {
    setError(null);

    // Validate required fields
    if (!formData.occasion || formData.occasion.length < 3) {
      setError("Please select an occasion");
      return;
    }
    if (!formData.scope || formData.scope.length < 3) {
      setError("Please select a scope");
      return;
    }
    if (!formData.outfit_description || formData.outfit_description.trim().length < 5) {
      setError("Please provide an outfit description (at least 5 characters)");
      return;
    }

    try {
      // Step 1: Start makeup session
      setLoadingStage("starting");
      console.log("🎨 Starting makeup session...");
      const sessionResponse = await startSession(formData).unwrap();
      console.log("✅ Session created:", sessionResponse);
      dispatch(setCurrentSession(sessionResponse));

      // Step 2: Create style session with outfit description and accessories
      setLoadingStage("styling");
      console.log("👗 Creating style session...");
      const styleResponse = await createStyle({
        description: formData.outfit_description,
        accessories: accessories,
      }).unwrap();
      console.log("✅ Style session created:", styleResponse);
      dispatch(setStyleSession(styleResponse));

      // Step 3: Generate makeup plan
      setLoadingStage("generating");
      console.log("💄 Generating makeup plan...");
      const planResponse = await generatePlan(sessionResponse.id).unwrap();
      console.log("✅ Makeup plan generated:");
      dispatch(setMakeupPlan(planResponse));

      // Move to plan display
      setLoadingStage(null);
      setCurrentStep("plan");
    } catch (err: any) {
      setLoadingStage(null);
      console.error("❌ Makeup session flow failed:", err);

      let errorMessage = "Failed to create makeup session. Please try again.";

      if (err?.data?.detail) {
        if (Array.isArray(err.data.detail)) {
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

  const handleStartLiveSession = () => {
    // Start the live makeup session with voice guidance
    if (makeupPlan) {
      dispatch(startLiveSession());
      setCurrentStep("live");
    }
  };

  const handleLiveSessionComplete = () => {
    // Handle completion of the live session
    router.push("/");
  };

  const handleLiveSessionClose = () => {
    // Return to the plan view
    setCurrentStep("plan");
  };

  const handleBack = () => {
    if (currentStep === "live") {
      setCurrentStep("plan");
    } else if (currentStep === "plan") {
      setCurrentStep("form");
    } else {
      router.back();
    }
  };

  const isLoading = isStartingSession || isCreatingStyle || isGeneratingPlan;

  // Show loader when any stage is active
  if (loadingStage) {
    return <SessionLoader stage={loadingStage} />;
  }

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
            disabled={isLoading}
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Back
          </Button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Makeup Session
              </h1>
              <p className="text-slate-500 text-sm">
                {currentStep === "form"
                  ? "Let's create your look"
                  : currentStep === "plan"
                  ? "Your personalized plan"
                  : "Applying your look"}
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
              currentStep === "plan"
                ? "bg-gradient-to-r from-purple-500 to-violet-500"
                : "bg-slate-200"
            }`}
          />
          <div
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              currentStep === "live"
                ? "bg-gradient-to-r from-violet-500 to-pink-500"
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
            <MakeupSessionForm
              formData={formData}
              accessories={accessories}
              onFormChange={handleFormChange}
              onAccessoryAdd={handleAccessoryAdd}
              onAccessoryRemove={handleAccessoryRemove}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          )}

          {currentStep === "plan" && makeupPlan && (
            <MakeupPlanDisplay
              plan={makeupPlan}
              onStartSession={handleStartLiveSession}
            />
          )}

          {currentStep === "live" && makeupPlan && (
            <LiveMakeupSession
              onComplete={handleLiveSessionComplete}
              onClose={handleLiveSessionClose}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default MakeupSession;
