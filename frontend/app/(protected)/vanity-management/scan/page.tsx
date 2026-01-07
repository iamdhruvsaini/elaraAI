"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Camera, Upload, Loader2, CheckCircle2, AlertTriangle, ScanBarcode } from "lucide-react";
import { useScanProductMutation } from "@/redux/services/vanity/vanityService";
import { showToast } from "@/components/toast/toast";

export default function ScanProductPage() {
  const router = useRouter();
  const [scanProduct, { isLoading }] = useScanProductMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [scanResult, setScanResult] = useState<any>(null);

  const handleImageSelect = (file: File) => {
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageSelect(file);
      // Auto-scan when image is selected
      handleScan(file);
    }
  };

  const handleScan = async (file: File = selectedImage!) => {
    if (!file) {
      showToast("Please select an image", "error");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("scan_type", "barcode");

    try {
      const result = await scanProduct(formData).unwrap();
      setScanResult(result);
      showToast("Scan completed successfully!", "success");
    } catch (error: any) {
      showToast(error?.data?.detail || "Failed to scan product", "error");
    }
  };

  const handleAddToVanity = () => {
    // Navigate to add page with scan data
    if (scanResult?.product_info) {
      router.push(`/vanity-management/add?scanned=true&data=${encodeURIComponent(JSON.stringify(scanResult.product_info))}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-pink-600 text-white">
        <div className="px-5 pt-4 pb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-white hover:bg-white/20 rounded-xl w-10 h-10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <ScanBarcode className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Scan Barcode</h1>
                <p className="text-purple-200 text-sm">Instant product lookup</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-5 space-y-4">
        {!scanResult ? (
          <>
            {/* Instructions */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Camera className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">How to scan</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Take a clear photo of the product barcode. Make sure it's well-lit and in focus.
                  </p>
                </div>
              </div>
            </div>

            {/* Camera/Upload Section */}
            {imagePreview ? (
              <div className="space-y-4">
                <div className="relative w-full rounded-2xl overflow-hidden bg-white shadow-lg border border-gray-100">
                  <img
                    src={imagePreview}
                    alt="Scan preview"
                    className="w-full h-auto max-h-80 object-contain"
                  />
                  {isLoading && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                      <div className="bg-white rounded-2xl p-6 text-center shadow-xl">
                        <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-3" />
                        <p className="font-bold text-gray-900">Scanning barcode...</p>
                        <p className="text-sm text-gray-500 mt-1">Please wait</p>
                      </div>
                    </div>
                  )}
                </div>

                {!isLoading && (
                  <Button
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview("");
                    }}
                    variant="outline"
                    className="w-full h-12 rounded-xl border-2 font-semibold"
                  >
                    Try Another Image
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Take Photo Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-10 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl shadow-lg shadow-purple-200 flex flex-col items-center gap-3 transition-all active:scale-[0.98]"
                >
                  <Camera className="w-14 h-14" />
                  <span className="text-lg font-bold">Take Photo</span>
                </button>

                {/* Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 rounded-2xl border-2 border-dashed border-gray-300 hover:border-purple-400 flex flex-col items-center gap-2 transition-all active:scale-[0.98] bg-white"
                >
                  <Upload className="w-8 h-8 text-gray-500" />
                  <span className="text-base font-semibold text-gray-700">Upload from Gallery</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            )}
          </>
        ) : (
          /* Scan Results */
          <div className="space-y-4">
            {/* Success Card */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-200">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-7 h-7 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-green-800 mb-1">Scan Complete!</h3>
                  {scanResult.product_info && (
                    <div className="mt-3">
                      <p className="font-bold text-gray-900 text-lg">{scanResult.product_info.brand}</p>
                      <p className="text-gray-700">{scanResult.product_info.product_name}</p>
                      {scanResult.product_info.category && (
                        <span className="inline-block mt-2 px-3 py-1 bg-white/80 rounded-full text-sm font-medium text-gray-700 capitalize">
                          {scanResult.product_info.category}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Safety Analysis */}
            {scanResult.safety_analysis && (
              <div className={`rounded-2xl p-5 border ${
                scanResult.safety_analysis.status === "safe" 
                  ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200" 
                  : scanResult.safety_analysis.status === "warning"
                  ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200"
                  : "bg-gradient-to-br from-red-50 to-rose-50 border-red-200"
              }`}>
                <h4 className="font-bold text-base mb-3 flex items-center gap-2">
                  {scanResult.safety_analysis.status === "safe" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className={`w-5 h-5 ${
                      scanResult.safety_analysis.status === "warning" ? "text-amber-600" : "text-red-600"
                    }`} />
                  )}
                  Safety Analysis
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed">{scanResult.safety_analysis.notes}</p>
                
                {scanResult.safety_analysis.allergens && scanResult.safety_analysis.allergens.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-current/10">
                    <p className="text-sm font-bold text-gray-900 mb-2">⚠️ Allergens Found:</p>
                    <ul className="text-sm space-y-1">
                      {scanResult.safety_analysis.allergens.map((allergen: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-2 text-gray-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          {allergen}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Ingredients */}
            {scanResult.ingredients && scanResult.ingredients.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h4 className="font-bold text-base mb-3">📋 Ingredients</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {scanResult.ingredients.join(", ")}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent space-y-3">
              <Button
                onClick={handleAddToVanity}
                className="w-full h-14 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-2xl shadow-xl shadow-pink-200 font-bold text-base transition-all active:scale-[0.98]"
              >
                Add to Vanity ✨
              </Button>
              <Button
                onClick={() => {
                  setScanResult(null);
                  setSelectedImage(null);
                  setImagePreview("");
                }}
                variant="outline"
                className="w-full h-12 rounded-xl border-2 font-semibold"
              >
                Scan Another Product
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
