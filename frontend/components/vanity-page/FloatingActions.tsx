"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ScanBarcode, X } from "lucide-react";

interface FloatingActionsProps {
  onScan: () => void;
  onAdd: () => void;
}

export const FloatingActions: React.FC<FloatingActionsProps> = ({
  onScan,
  onAdd,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-4 sm:bottom-8 sm:right-6 z-50">
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Action Buttons */}
      <div className={`relative z-50 flex flex-col items-end gap-3 transition-all duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        {/* Scan Button */}
        <div className="flex items-center gap-3">
          <span className="bg-white px-3 py-2 rounded-lg text-sm font-medium text-gray-700 shadow-lg">
            Scan Barcode
          </span>
          <Button
            onClick={() => {
              setIsOpen(false);
              onScan();
            }}
            className="w-12 h-12 rounded-full bg-white text-purple-600 hover:bg-purple-50 shadow-lg border border-gray-100 transition-all active:scale-95"
            size="icon"
          >
            <ScanBarcode className="w-5 h-5" />
          </Button>
        </div>

        {/* Add Button */}
        <div className="flex items-center gap-3">
          <span className="bg-white px-3 py-2 rounded-lg text-sm font-medium text-gray-700 shadow-lg">
            Add Manually
          </span>
          <Button
            onClick={() => {
              setIsOpen(false);
              onAdd();
            }}
            className="w-12 h-12 rounded-full bg-white text-pink-600 hover:bg-pink-50 shadow-lg border border-gray-100 transition-all active:scale-95"
            size="icon"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main FAB */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative z-50 w-14 h-14 rounded-full shadow-2xl transition-all duration-300 active:scale-95
          ${isOpen 
            ? "bg-gray-900 hover:bg-gray-800 rotate-45" 
            : "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
          }
        `}
        size="icon"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white -rotate-45" />
        ) : (
          <Plus className="w-6 h-6 text-white" />
        )}
      </Button>
    </div>
  );
};
