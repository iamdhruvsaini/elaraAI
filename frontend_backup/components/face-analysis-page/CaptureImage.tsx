"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  RefreshCcw,
  Loader2,
} from "lucide-react";
import { useCaptureUserImageMutation } from "@/redux/services/authentication/authService";

const CaptureImage: React.FC = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const [captureUserImage, { isLoading: isUploading }] =
    useCaptureUserImageMutation();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  /* =======================
     Camera helpers
  ======================= */

  const stopCamera = () => {
    if (!stream) return;

    stream.getTracks().forEach((track) => {
      if (track.readyState === "live") track.stop();
    });

    setStream(null);

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startCamera = async () => {
    if (stream || capturedImage) return;

    setIsCameraLoading(true);
    setError(null);

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });

      setStream(newStream);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.muted = true;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
      }
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setError("Camera permission denied. Please allow access.");
      } else if (err.name === "NotFoundError") {
        setError("No camera found on this device.");
      } else {
        setError("Unable to access camera.");
      }
    } finally {
      setIsCameraLoading(false);
    }
  };

  /* =======================
     Effects
  ======================= */

  // Start camera when needed
  useEffect(() => {
    if (!capturedImage) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [facingMode, capturedImage]);

  // Cleanup object URLs + timeout
  useEffect(() => {
    return () => {
      if (capturedImage?.startsWith("blob:")) {
        URL.revokeObjectURL(capturedImage);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [capturedImage]);

  /* =======================
     Capture logic
  ======================= */

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) {
      setError("Video not ready. Try again.");
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

      const file = new File([blob], "capture.png", { type: "image/png" });
      setCapturedFile(file);
      setCapturedImage(URL.createObjectURL(blob));
      stopCamera();
    }, "image/png");
  };

  /* =======================
     File upload
  ======================= */

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    setCapturedFile(file);
    setCapturedImage(URL.createObjectURL(file));
    stopCamera();
  };

  const uploadCapturedImage = async () => {
    if (!capturedFile) {
      setUploadError("No image to upload.");
      return;
    }

    setUploadError(null);
    setUploadSuccess(false);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("image", capturedFile);

      const response = await captureUserImage(formData).unwrap();

      // ✅ REQUIRED LOG
      console.log("✅ Image upload successful:", response);

      setUploadSuccess(true);
      setUploadResult(response);

      timeoutRef.current = setTimeout(() => {
        setCapturedImage(null);
        setCapturedFile(null);
        setUploadSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error("❌ Upload failed:", err);
      setUploadError(err?.data?.message || "Upload failed.");
    }
  };

  /* =======================
     UI (UNCHANGED)
  ======================= */

  return (
    <div className="flex-1 flex flex-col bg-white relative">
      <header className="pt-4 pb-4 flex items-center justify-between sticky top-0 bg-white border-b">
        <button className="p-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-bold">Capture Your Face</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 mt-8 px-8 flex flex-col items-center justify-center">
        <div className="relative w-full max-w-md aspect-[4/5] bg-slate-200 rounded-3xl overflow-hidden">
          {!capturedImage ? (
            <>
              {isCameraLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="animate-spin" />
                </div>
              )}
              {error ? (
                <div className="flex items-center justify-center h-full text-red-600">
                  {error}
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
        </div>

        <div className="flex items-center justify-center gap-6 mt-6">
          {!capturedImage ? (
            <button onClick={capturePhoto} disabled={!stream}>
              <Camera />
            </button>
          ) : (
            <button
              onClick={() => {
                setCapturedImage(null);
                setCapturedFile(null);
              }}
            >
              Retake
            </button>
          )}

          <button
            onClick={() =>
              setFacingMode((p) => (p === "user" ? "environment" : "user"))
            }
          >
            <RefreshCcw />
          </button>
        </div>

        {capturedImage && (
          <button
            onClick={uploadCapturedImage}
            disabled={isUploading}
            className="mt-4 bg-primary text-white w-full px-4 py-2 rounded-md"
          >
            {isUploading ? "Uploading..." : "Continue"}
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />

        <canvas ref={canvasRef} className="hidden" />
      </main>
    </div>
  );
};

export default CaptureImage;
