"use client";

import React, { useEffect, useRef, useState } from "react";
import { Camera, RefreshCcw, Loader2, AlertCircle, Upload, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CameraCaptureProps {
  onCapture: (file: File, imageUrl: string) => void;
  onRetake: () => void;
  capturedImage: string | null;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  onRetake,
  capturedImage,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
      setStream(null);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    if (stream || capturedImage) return;

    setIsCameraLoading(true);
    setError(null);

    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((err) => {
            console.error("Error playing video:", err);
            setError("Unable to start video playback");
          });
        };
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      if (err.name === "NotAllowedError") {
        setError("Camera permission denied. Please allow camera access in your browser settings.");
      } else if (err.name === "NotFoundError") {
        setError("No camera found on this device.");
      } else if (err.name === "NotReadableError") {
        setError("Camera is being used by another application.");
      } else {
        setError("Unable to access camera. Please try again.");
      }
    } finally {
      setIsCameraLoading(false);
    }
  };

  useEffect(() => {
    if (!capturedImage) {
      startCamera();
    }

    // Cleanup function to stop camera when component unmounts or navigates away
    return () => {
      stopCamera();
    };
  }, [capturedImage]);

  // Additional cleanup on page visibility change (handles browser back/forward)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopCamera();
      }
    };

    const handleBeforeUnload = () => {
      stopCamera();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handleBeforeUnload);
      stopCamera();
    };
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) {
      setError("Video not ready. Please wait a moment and try again.");
      return;
    }

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], `face-capture-${Date.now()}.png`, { 
        type: "image/png" 
      });
      const imageUrl = URL.createObjectURL(blob);
      
      stopCamera();
      onCapture(file, imageUrl);
    }, "image/png", 0.95);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    const imageUrl = URL.createObjectURL(file);
    stopCamera();
    onCapture(file, imageUrl);
  };

  const handleRetake = () => {
    onRetake();
    setError(null);
  };

  const switchCamera = () => {
    stopCamera();
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    // Camera will restart automatically via useEffect when facingMode changes
    setTimeout(() => {
      if (!capturedImage) {
        startCamera();
      }
    }, 100);
  };

  return (
    <div className="px-4 py-6 space-y-5">
      {/* Instructions */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 mb-1">Tips for Best Results</p>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• Face the camera directly with good lighting</li>
              <li>• Remove glasses and pull back hair</li>
              <li>• Keep a neutral expression</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Camera/Image Preview */}
      <div className="relative w-full max-w-md mx-auto aspect-[3/4] bg-gray-900 rounded-2xl overflow-hidden shadow-xl">
        {!capturedImage ? (
          <>
            {isCameraLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                <Loader2 className="animate-spin w-10 h-10 text-white" />
              </div>
            )}
            {error ? (
              <div className="flex flex-col items-center justify-center h-full text-white px-6 text-center">
                <AlertCircle className="w-12 h-12 mb-3 text-red-400" />
                <p className="text-sm mb-4">{error}</p>
                <Button
                  onClick={() => {
                    setError(null);
                    startCamera();
                  }}
                  variant="outline"
                  className="bg-white text-gray-900 hover:bg-gray-100"
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            )}
          </>
        ) : (
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-cover"
          />
        )}

        {/* Camera Controls Overlay */}
        {!capturedImage && !error && (
          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 px-4">
            <button
              onClick={capturePhoto}
              disabled={!stream || isCameraLoading}
              className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="w-7 h-7 text-gray-800" />
            </button>
            <button
              onClick={switchCamera}
              disabled={isCameraLoading}
              className="w-12 h-12 bg-white/90 rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50"
            >
              <RefreshCcw className="w-5 h-5 text-gray-800" />
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      {capturedImage && (
        <div className="space-y-3 max-w-md mx-auto">
          <Button
            onClick={handleRetake}
            variant="outline"
            className="w-full h-12 text-base font-medium rounded-xl border-slate-200"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Retake Photo
          </Button>
        </div>
      )}

      {/* Upload Option */}
      {!capturedImage && !stream && (
        <div className="max-w-md mx-auto">
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="w-full h-12 text-base font-medium rounded-xl border-slate-200"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload from Gallery
          </Button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />

      <canvas ref={canvasRef} className="hidden" />

      {/* What We'll Analyze */}
      {!capturedImage && (
        <div className="max-w-md mx-auto">
          <p className="text-xs text-slate-500 text-center mb-3">What we'll analyze:</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Skin Tone", icon: "🎨" },
              { label: "Undertone", icon: "💫" },
              { label: "Skin Type", icon: "✨" },
              { label: "Face Shape", icon: "💎" },
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl p-3 text-center shadow-sm border border-slate-100">
                <span className="text-xl mb-1 block">{item.icon}</span>
                <span className="text-[10px] text-slate-600 font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraCapture;
