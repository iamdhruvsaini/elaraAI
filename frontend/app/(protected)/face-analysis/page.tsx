"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Zap,
  ZapOff,
  Camera,
  SwitchCamera,
  Upload,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAnalyzeFaceMutation } from "@/redux/services/profileService";

type CameraFacing = "user" | "environment";

export default function FaceAnalysisPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState<CameraFacing>("user");
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [analyzeFace] = useAnalyzeFaceMutation();

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 720 },
          height: { ideal: 1280 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (error) {
      console.error("Camera error:", error);
      toast.error("Could not access camera. Please check permissions.");
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const flipCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Mirror if front camera
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(imageData);
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImage(event.target?.result as string);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  const retake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const analyzePhoto = async () => {
    if (!capturedImage) return;

    setIsAnalyzing(true);

    try {
      // Convert base64 to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append("image", blob, "face.jpg");

      const result = await analyzeFace(formData).unwrap();
      console.log("Analysis result:", result);
      
      // Store result in sessionStorage for results page
      sessionStorage.setItem("analysisResult", JSON.stringify(result));
      sessionStorage.setItem("capturedImage", capturedImage);

      router.push("/face-analysis/results");
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Analysis failed. Please try again.");
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background-dark flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 safe-top">
        <button
          onClick={() => router.push("/dashboard")}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={24} className="text-white" />
        </button>
        <h1 className="text-lg font-semibold text-white">
          Capture Your Beautiful Face
        </h1>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative mx-4 rounded-3xl overflow-hidden bg-black">
        {capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-cover"
          />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={cn(
                "w-full h-full object-cover",
                facingMode === "user" && "scale-x-[-1]"
              )}
            />
            {/* Face Guide Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[70%] aspect-[3/4] border-2 border-dashed border-white/50 rounded-[50%]" />
            </div>
          </>
        )}

        {/* Analyzing Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl">✨</span>
              </div>
            </div>
            <p className="text-white mt-4 font-medium">Analyzing Your Skin...</p>
            <p className="text-white/60 text-sm mt-1">This will only take a moment</p>
          </div>
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Tips Accordion */}
      <div className="mx-4 mt-4">
        <button
          onClick={() => setShowTips(!showTips)}
          className="flex items-center justify-between w-full py-3 px-4 bg-surface-dark rounded-xl text-white"
        >
          <span className="text-sm font-medium">Tips for the Best Results</span>
          {showTips ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
        {showTips && (
          <div className="px-4 py-3 bg-surface-dark/50 rounded-b-xl mt-px">
            <ul className="text-sm text-white/80 space-y-1.5">
              <li>• Face natural light for best results</li>
              <li>• Remove glasses and heavy makeup</li>
              <li>• Keep a neutral expression</li>
              <li>• Tie hair back to show your face</li>
            </ul>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="px-6 py-6 safe-bottom">
        {capturedImage ? (
          <div className="flex gap-4">
            <Button variant="outline" fullWidth onClick={retake}>
              Retake
            </Button>
            <Button
              variant="gradient"
              fullWidth
              onClick={analyzePhoto}
              loading={isAnalyzing}
            >
              Continue
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center gap-8 mb-4">
              {/* Flash Toggle */}
              <button
                onClick={() => setFlashEnabled(!flashEnabled)}
                className="w-12 h-12 rounded-full bg-surface-dark flex items-center justify-center"
              >
                {flashEnabled ? (
                  <Zap size={24} className="text-yellow-400" />
                ) : (
                  <ZapOff size={24} className="text-white/60" />
                )}
              </button>

              {/* Capture Button */}
              <button
                onClick={capturePhoto}
                disabled={!isStreaming}
                className="w-20 h-20 rounded-full bg-gradient-to-r from-primary to-[#ff6b9d] flex items-center justify-center shadow-lg shadow-primary/30 disabled:opacity-50"
              >
                <Camera size={32} className="text-white" />
              </button>

              {/* Flip Camera */}
              <button
                onClick={flipCamera}
                className="w-12 h-12 rounded-full bg-surface-dark flex items-center justify-center"
              >
                <SwitchCamera size={24} className="text-white" />
              </button>
            </div>

            {/* Upload Option */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 text-white/80 hover:text-white py-2 w-full"
            >
              <Upload size={18} />
              <span className="text-sm">Upload Existing Photo</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
