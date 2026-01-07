"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import type { HairSuggestionRequest, SelectOption } from "@/redux/services/makeup/types";
import {
  FACE_SHAPES,
  HAIR_TEXTURES,
  HAIR_LENGTHS,
  OCCASIONS,
  OUTFIT_STYLES,
} from "@/redux/services/makeup/types";

interface HairFormProps {
  formData: HairSuggestionRequest;
  onFormChange: (field: keyof HairSuggestionRequest, value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const HairForm: React.FC<HairFormProps> = ({
  formData,
  onFormChange,
  onSubmit,
  isLoading,
}) => {
  const renderSelect = (
    label: string,
    field: keyof HairSuggestionRequest,
    options: SelectOption[],
    placeholder: string,
    icon: string,
    required: boolean = false
  ) => (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        <span>{icon}</span>
        {label}
        {required && <span className="text-rose-500">*</span>}
      </Label>
      <Select
        value={formData[field]}
        onValueChange={(value) => onFormChange(field, value)}
      >
        <SelectTrigger className="w-full bg-white/80 backdrop-blur-sm border-slate-200 focus:border-pink-400 focus:ring-pink-400/20 rounded-xl h-12">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-white/95 backdrop-blur-md rounded-xl border-slate-200">
          {options.map((option) => (
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
  );

  return (
    <div className="space-y-5">
      {/* Occasion & Style Row */}
      <div className="grid grid-cols-2 gap-3">
        {renderSelect("Occasion", "occasion", OCCASIONS, "Select occasion", "🎉", true)}
        {renderSelect("Outfit Style", "outfit_style", OUTFIT_STYLES, "Select style", "👗", true)}
      </div>

      {/* Face Shape */}
      {renderSelect("Face Shape", "face_shape", FACE_SHAPES, "Select face shape", "💎")}

      {/* Hair Properties Row */}
      <div className="grid grid-cols-2 gap-3">
        {renderSelect("Hair Texture", "hair_texture", HAIR_TEXTURES, "Select texture", "✨")}
        {renderSelect("Hair Length", "hair_length", HAIR_LENGTHS, "Select length", "📏")}
      </div>

      {/* Outfit Description */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <span>📝</span>
          Outfit Description <span className="text-rose-500">*</span>
        </Label>
        <Textarea
          value={formData.outfit_description}
          onChange={(e) => onFormChange("outfit_description", e.target.value)}
          placeholder="Describe your outfit... (e.g., Red silk saree with golden border)"
          className="bg-white/80 backdrop-blur-sm border-slate-200 focus:border-pink-400 focus:ring-pink-400/20 rounded-xl min-h-[100px] resize-none"
          minLength={5}
        />
        <p className="text-xs text-slate-500">
          {formData.outfit_description.length}/5 characters minimum
        </p>
      </div>

      {/* Submit Button */}
      <Button
        onClick={onSubmit}
        disabled={
          isLoading ||
          !formData.occasion ||
          !formData.outfit_style ||
          !formData.face_shape ||
          formData.outfit_description.trim().length < 5
        }
        className="w-full h-14 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-base rounded-2xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Analyzing...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Get Hair Suggestions
          </span>
        )}
      </Button>
    </div>
  );
};

export default HairForm;
