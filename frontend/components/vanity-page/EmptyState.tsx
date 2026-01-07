"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ScanBarcode, Plus, Sparkles } from "lucide-react";

interface EmptyStateProps {
  onScan: () => void;
  onAdd: () => void;
  categoryName?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onScan,
  onAdd,
  categoryName,
}) => {
  if (categoryName) {
    // Empty state for filtered category
    return (
      <div className="text-center py-12 px-6">
        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-sm">
          <span className="text-4xl">📦</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          No {categoryName} products
        </h3>
        <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
          You haven't added any {categoryName.toLowerCase()} products to your vanity yet
        </p>
      </div>
    );
  }

  // Main empty state
  return (
    <div className="text-center py-16 px-6">
      {/* Illustration */}
      <div className="relative w-32 h-32 mx-auto mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-200 to-purple-200 rounded-[2rem] rotate-6"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-pink-100 to-purple-100 rounded-[2rem] -rotate-3"></div>
        <div className="relative w-full h-full bg-white rounded-[2rem] flex items-center justify-center shadow-lg">
          <Sparkles className="w-14 h-14 text-pink-500" />
        </div>
      </div>

      {/* Text */}
      <h2 className="text-2xl font-bold text-gray-900 mb-3">
        Start Your Vanity
      </h2>
      <p className="text-gray-500 mb-8 max-w-xs mx-auto leading-relaxed">
        Add your beauty products to track ingredients, expiry dates, and build your perfect collection
      </p>

      {/* Actions */}
      <div className="flex flex-col gap-3 max-w-xs mx-auto">
        <Button
          onClick={onScan}
          className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white h-14 rounded-2xl font-semibold text-base shadow-lg shadow-pink-200 transition-all active:scale-95"
        >
          <ScanBarcode className="w-5 h-5 mr-2" />
          Scan Product Barcode
        </Button>
      </div>

      {/* Tip */}
      <div className="mt-10 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl p-4 max-w-sm mx-auto">
        <p className="text-sm text-gray-600">
          <span className="font-semibold">💡 Tip:</span> Scanning a barcode automatically fetches product details and ingredients!
        </p>
      </div>
    </div>
  );
};
