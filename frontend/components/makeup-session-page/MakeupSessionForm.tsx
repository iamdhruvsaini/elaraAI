"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Plus, X } from "lucide-react";
import type { StartMakeupRequest, OccasionType, MakeupScope } from "@/redux/services/makeup/types";
import { OCCASIONS, MAKEUP_SCOPES } from "@/redux/services/makeup/types";

interface MakeupSessionFormProps {
  formData: StartMakeupRequest;
  accessories: Record<string, string>;
  onFormChange: (field: keyof StartMakeupRequest, value: any) => void;
  onAccessoryAdd: (key: string, value: string) => void;
  onAccessoryRemove: (key: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const MakeupSessionForm: React.FC<MakeupSessionFormProps> = ({
  formData,
  accessories,
  onFormChange,
  onAccessoryAdd,
  onAccessoryRemove,
  onSubmit,
  isLoading,
}) => {
  const [newAccessoryKey, setNewAccessoryKey] = React.useState("");
  const [newAccessoryValue, setNewAccessoryValue] = React.useState("");

  const handleAddAccessory = () => {
    if (newAccessoryKey.trim() && newAccessoryValue.trim()) {
      onAccessoryAdd(newAccessoryKey.trim(), newAccessoryValue.trim());
      setNewAccessoryKey("");
      setNewAccessoryValue("");
    }
  };

  return (
    <div className="space-y-5">
      {/* Occasion & Scope Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <span>🎉</span>
            Occasion <span className="text-rose-500">*</span>
          </Label>
          <Select
            value={formData.occasion}
            onValueChange={(value) => onFormChange("occasion", value as OccasionType)}
          >
            <SelectTrigger className="w-full bg-white/80 backdrop-blur-sm border-slate-200 focus:border-pink-400 focus:ring-pink-400/20 rounded-xl h-12 overflow-hidden text-base md:text-sm">
              <SelectValue placeholder="Select occasion" className="truncate" />
            </SelectTrigger>
            <SelectContent className="bg-white/95 backdrop-blur-md rounded-xl border-slate-200 max-w-[200px]">
              {OCCASIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="hover:bg-pink-50 cursor-pointer rounded-lg"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <span>✨</span>
            Scope <span className="text-rose-500">*</span>
          </Label>
          <Select
            value={formData.scope}
            onValueChange={(value) => onFormChange("scope", value as MakeupScope)}
          >
            <SelectTrigger className="w-full bg-white/80 backdrop-blur-sm border-slate-200 focus:border-pink-400 focus:ring-pink-400/20 rounded-xl h-12 overflow-hidden text-base md:text-sm">
              <SelectValue placeholder="Select scope" className="truncate" />
            </SelectTrigger>
            <SelectContent className="bg-white/95 backdrop-blur-md rounded-xl border-slate-200 max-w-[200px]">
              {MAKEUP_SCOPES.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="hover:bg-pink-50 cursor-pointer rounded-lg"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Outfit Description */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <span>👗</span>
          Outfit Description <span className="text-rose-500">*</span>
        </Label>
        <Textarea
          value={formData.outfit_description}
          onChange={(e) => onFormChange("outfit_description", e.target.value)}
          placeholder="Describe your outfit... (e.g., Blue floral dress with silver accessories)"
          className="bg-white/80 backdrop-blur-sm border-slate-200 focus:border-pink-400 focus:ring-pink-400/20 rounded-xl min-h-[100px] resize-none"
          minLength={5}
        />
        <p className="text-xs text-slate-500">
          {formData.outfit_description.length}/5 characters minimum
        </p>
      </div>

      {/* Accessories Section */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <span>💎</span>
          Accessories (Optional)
        </Label>

        {/* Display Added Accessories */}
        {Object.keys(accessories).length > 0 && (
          <div className="space-y-2">
            {Object.entries(accessories).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50 p-3 rounded-xl border border-purple-100"
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800 capitalize">{key}</p>
                  <p className="text-xs text-slate-600">{value}</p>
                </div>
                <button
                  onClick={() => onAccessoryRemove(key)}
                  className="ml-2 p-1 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Accessory */}
        <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={newAccessoryKey}
              onChange={(e) => setNewAccessoryKey(e.target.value)}
              placeholder="Type (e.g., earrings)"
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-pink-400 focus:ring-pink-400/20 focus:outline-none"
            />
            <input
              type="text"
              value={newAccessoryValue}
              onChange={(e) => setNewAccessoryValue(e.target.value)}
              placeholder="Description (e.g., gold)"
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-pink-400 focus:ring-pink-400/20 focus:outline-none"
            />
          </div>
          <Button
            type="button"
            onClick={handleAddAccessory}
            disabled={!newAccessoryKey.trim() || !newAccessoryValue.trim()}
            variant="outline"
            className="w-full h-10 font-medium text-sm rounded-xl border-slate-200"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Accessory
          </Button>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        onClick={onSubmit}
        disabled={
          isLoading ||
          !formData.occasion ||
          !formData.scope ||
          formData.outfit_description.trim().length < 5
        }
        className="w-full h-14 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-base rounded-2xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Creating Session...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Generate Makeup Plan
          </span>
        )}
      </Button>
    </div>
  );
};

export default MakeupSessionForm;
