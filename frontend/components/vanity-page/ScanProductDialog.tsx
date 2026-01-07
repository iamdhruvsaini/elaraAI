import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, Image as ImageIcon, FileText, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useScanProductMutation } from "@/redux/services/vanity/vanityService";
import { showToast } from "@/components/toast/toast";

interface ScanProductDialogProps {
  open: boolean;
  onClose: () => void;
  onScanComplete?: (data: any) => void;
}

export const ScanProductDialog: React.FC<ScanProductDialogProps> = ({
  open,
  onClose,
  onScanComplete,
}) => {
  const [scanProduct, { isLoading }] = useScanProductMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [scanType, setScanType] = useState<"barcode" | "ingredients" | "product" | null>(null);
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
    }
  };

  const handleScan = async (type: "barcode" | "ingredients" | "product") => {
    setScanType(type);
    fileInputRef.current?.click();
  };

  const handleScanSubmit = async () => {
    if (!selectedImage || !scanType) {
      showToast("Please select an image and scan type", "error");
      return;
    }

    const formData = new FormData();
    formData.append("image", selectedImage);
    formData.append("scan_type", scanType);

    try {
      const result = await scanProduct(formData).unwrap();
      setScanResult(result);
      
      if (onScanComplete) {
        onScanComplete(result);
      }
      
      showToast("Scan completed successfully!", "success");
    } catch (error: any) {
      showToast(error?.data?.detail || "Failed to scan product", "error");
    }
  };

  const handleClose = () => {
    setScanType(null);
    setSelectedImage(null);
    setImagePreview("");
    setScanResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <div className="space-y-4">
          {!selectedImage && !scanResult && (
            <>
              {/* Scan Options */}
              <Card
                className="p-4 cursor-pointer hover:border-pink-500 transition-colors"
                onClick={() => handleScan("barcode")}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Camera className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Scan Barcode</h3>
                    <p className="text-sm text-gray-600">Instant analysis from database</p>
                  </div>
                  <span className="text-gray-400">→</span>
                </div>
              </Card>

              <Card
                className="p-4 cursor-pointer hover:border-pink-500 transition-colors"
                onClick={() => handleScan("ingredients")}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Photo of Ingredients</h3>
                    <p className="text-sm text-gray-600">Analyze label text automatically</p>
                  </div>
                  <span className="text-gray-400">→</span>
                </div>
              </Card>

              <Card
                className="p-4 cursor-pointer hover:border-pink-500 transition-colors"
                onClick={() => handleScan("product")}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-pink-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Type Product Name</h3>
                    <p className="text-sm text-gray-600">Search manually if scanning fails</p>
                  </div>
                  <span className="text-gray-400">→</span>
                </div>
              </Card>
            </>
          )}

          {selectedImage && !scanResult && (
            <>
              {/* Image Preview */}
              <div className="space-y-4">
                <div className="w-full h-64 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={imagePreview}
                    alt="Scan preview"
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleScanSubmit}
                    disabled={isLoading}
                    className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      "Analyze Product"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview("");
                      setScanType(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </>
          )}

          {scanResult && (
            <>
              {/* Scan Results */}
              <div className="space-y-4">
                <Card className="p-4 bg-green-50 border-green-200">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-green-900">Scan Complete!</h3>
                      {scanResult.product_info && (
                        <div className="mt-2">
                          <p className="font-medium">{scanResult.product_info.brand}</p>
                          <p className="text-sm text-gray-700">{scanResult.product_info.product_name}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                {scanResult.safety_analysis && (
                  <Card className={`p-4 ${
                    scanResult.safety_analysis.status === "safe" 
                      ? "bg-green-50 border-green-200" 
                      : scanResult.safety_analysis.status === "warning"
                      ? "bg-yellow-50 border-yellow-200"
                      : "bg-red-50 border-red-200"
                  }`}>
                    <h4 className="font-semibold mb-2">Safety Analysis</h4>
                    <p className="text-sm">{scanResult.safety_analysis.notes}</p>
                    
                    {scanResult.safety_analysis.allergens && scanResult.safety_analysis.allergens.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">Allergens Found:</p>
                        <ul className="text-sm list-disc list-inside">
                          {scanResult.safety_analysis.allergens.map((allergen: string, idx: number) => (
                            <li key={idx}>{allergen}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                )}

                {scanResult.ingredients && scanResult.ingredients.length > 0 && (
                  <Card className="p-4">
                    <h4 className="font-semibold mb-2">Ingredients</h4>
                    <p className="text-sm text-gray-700">{scanResult.ingredients.join(", ")}</p>
                  </Card>
                )}

                <Button
                  onClick={handleClose}
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                >
                  Done
                </Button>
              </div>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
};
