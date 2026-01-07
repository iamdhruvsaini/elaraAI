"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Package, ScanBarcode, Plus, Sparkles } from "lucide-react";

interface VanityHeaderProps {
  totalProducts: number;
  onScan: () => void;
  onAdd: () => void;
}

export const VanityHeader: React.FC<VanityHeaderProps> = ({
  totalProducts,
  onScan,
  onAdd,
}) => {
  return (
    <div className="bg-gradient-to-br from-pink-500 via-pink-600 to-purple-600 text-white">
      {/* Main Header Content */}
      <div className="px-5 pt-6 pb-8">
        {/* Title Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">My Vanity</h1>
              <p className="text-pink-200 text-sm font-medium">Beauty collection</p>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <Package className="w-7 h-7" />
              </div>
              <div>
                <p className="text-4xl font-bold">{totalProducts}</p>
                <p className="text-pink-200 text-sm">Total Products</p>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 bg-green-400/20 text-green-100 px-3 py-1.5 rounded-full text-xs font-semibold">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Synced
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={onScan}
            className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-0 h-14 rounded-2xl font-semibold text-base transition-all active:scale-95"
          >
            <ScanBarcode className="w-5 h-5 mr-2" />
            Scan
          </Button>
          <Button
            onClick={onAdd}
            className="bg-white text-pink-600 hover:bg-pink-50 h-14 rounded-2xl font-semibold text-base shadow-lg transition-all active:scale-95"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New
          </Button>
        </div>
      </div>
    </div>
  );
};
