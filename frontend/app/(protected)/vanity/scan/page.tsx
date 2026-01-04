"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  QrCode,
  Camera,
  Edit3,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useScanProductMutation } from "@/redux/services/vanityService";

interface RecentScan {
  id: string;
  name: string;
  brand: string;
  isSafe: boolean;
}

const recentScans: RecentScan[] = [
  { id: "1", name: "Fit Me Foundation", brand: "Maybelline", isSafe: true },
  { id: "2", name: "Ultra Moisturizer", brand: "XYZ Skincare", isSafe: false },
];

export default function ScanProductPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProduct] = useScanProductMutation();

  const handleScan = async (file: File) => {
    setIsScanning(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await scanProduct(formData).unwrap();

      // Store result for next page
      sessionStorage.setItem("scanResult", JSON.stringify(result));
      router.push("/vanity/scan/result");
    } catch (error) {
      console.error("Scan error:", error);
      toast.error("Failed to scan product. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleScan(file);
    }
  };

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute("capture", "environment");
      fileInputRef.current.click();
    }
  };

  const handlePhotoUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute("capture");
      fileInputRef.current.click();
    }
  };

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
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-foreground">
            🔬 Scan Any Product
          </h1>
          <p className="text-sm text-foreground-muted">
            Check ingredients for safety instantly
          </p>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Content */}
      <div className="px-6 py-4 space-y-4">
        {/* Scanning Overlay */}
        {isScanning && (
          <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center">
            <div className="relative">
              <div className="w-24 h-24 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl">🔬</span>
              </div>
            </div>
            <p className="text-white mt-6 font-medium text-lg">
              Analyzing Product...
            </p>
            <p className="text-white/60 text-sm mt-2">
              This may take a few seconds
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <Card
          className="p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={handleCameraCapture}
        >
          <div className="w-12 h-12 rounded-full bg-info/10 flex items-center justify-center">
            <QrCode size={24} className="text-info" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-foreground">Scan Barcode</h3>
            <p className="text-sm text-foreground-muted">
              Instant analysis from database
            </p>
          </div>
          <ChevronRight size={20} className="text-foreground-muted" />
        </Card>

        <Card
          className="p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={handlePhotoUpload}
        >
          <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
            <Camera size={24} className="text-secondary" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-foreground">Photo of Ingredients</h3>
            <p className="text-sm text-foreground-muted">
              Analyze label text automatically
            </p>
          </div>
          <ChevronRight size={20} className="text-foreground-muted" />
        </Card>

        <Link href="/vanity/add">
          <Card className="p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Edit3 size={24} className="text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground">Type Product Name</h3>
              <p className="text-sm text-foreground-muted">
                Search manually if scanning fails
              </p>
            </div>
            <ChevronRight size={20} className="text-foreground-muted" />
          </Card>
        </Link>

        {/* Recent Scans */}
        <div className="pt-4">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Recent Scans
          </h2>
          <div className="space-y-3">
            {recentScans.map((scan) => (
              <Card key={scan.id} className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl">💄</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{scan.name}</p>
                  <p className="text-sm text-foreground-muted">{scan.brand}</p>
                </div>
                {scan.isSafe ? (
                  <Badge variant="success" icon={<ShieldCheck size={12} />}>
                    SAFE
                  </Badge>
                ) : (
                  <Badge variant="warning" icon={<AlertTriangle size={12} />}>
                    ALERT
                  </Badge>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
