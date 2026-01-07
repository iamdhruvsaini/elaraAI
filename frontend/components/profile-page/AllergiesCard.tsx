"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Edit, Loader2, Save, X, Plus } from "lucide-react";
import { useUpdateAllergiesMutation } from "@/redux/services/profile/profileService";

// Common allergens list
const COMMON_ALLERGENS = [
  "fragrance",
  "parabens",
  "sulfates",
  "gluten",
  "nuts",
  "latex",
  "nickel",
  "formaldehyde",
  "lanolin",
  "alcohol",
  "silicone",
  "talc",
  "mineral oil",
  "retinol",
  "salicylic acid",
  "benzoyl peroxide",
];

const SENSITIVITY_LEVELS = ["normal", "sensitive", "highly_sensitive"];

interface AllergiesCardProps {
  allergies: string[];
  sensitivityLevel: string;
  onUpdate?: () => void;
}

export const AllergiesCard = ({
  allergies: initialAllergies,
  sensitivityLevel: initialSensitivity,
  onUpdate,
}: AllergiesCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(initialAllergies);
  const [sensitivityLevel, setSensitivityLevel] = useState(initialSensitivity || "normal");
  const [customAllergen, setCustomAllergen] = useState("");

  const [updateAllergies, { isLoading: isUpdating }] = useUpdateAllergiesMutation();

  const handleToggleAllergen = (allergen: string) => {
    setSelectedAllergies((prev) =>
      prev.includes(allergen)
        ? prev.filter((a) => a !== allergen)
        : [...prev, allergen]
    );
  };

  const handleAddCustom = () => {
    if (customAllergen.trim() && !selectedAllergies.includes(customAllergen.toLowerCase())) {
      setSelectedAllergies((prev) => [...prev, customAllergen.toLowerCase().trim()]);
      setCustomAllergen("");
    }
  };

  const handleRemoveAllergen = (allergen: string) => {
    setSelectedAllergies((prev) => prev.filter((a) => a !== allergen));
  };

  const handleCancel = () => {
    setSelectedAllergies(initialAllergies);
    setSensitivityLevel(initialSensitivity || "normal");
    setCustomAllergen("");
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      await updateAllergies({
        allergies: selectedAllergies,
        sensitivity_level: sensitivityLevel,
      }).unwrap();
      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      console.error("Failed to update allergies:", error);
    }
  };

  // View Mode
  if (!isEditing) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-red-100 to-orange-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-red-500" />
            </div>
            <h3 className="font-semibold text-slate-800">Allergies</h3>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
        </div>

        {/* Sensitivity Level */}
        <div className="mb-4">
          <p className="text-xs text-slate-500 mb-1.5">Sensitivity Level</p>
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize ${
              initialSensitivity === "highly_sensitive"
                ? "bg-red-100 text-red-700"
                : initialSensitivity === "sensitive"
                ? "bg-orange-100 text-orange-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {initialSensitivity?.replace("_", " ") || "Normal"}
          </span>
        </div>

        {/* Allergies List */}
        <div>
          <p className="text-xs text-slate-500 mb-2">Known Allergies</p>
          {initialAllergies && initialAllergies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {initialAllergies.map((allergy) => (
                <span
                  key={allergy}
                  className="px-3 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full capitalize"
                >
                  {allergy}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No allergies listed</p>
          )}
        </div>
      </div>
    );
  }

  // Edit Mode
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-lg ring-2 ring-purple-400">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
            <AlertCircle className="w-4 h-4 text-purple-600" />
          </div>
          <h3 className="font-semibold text-slate-800">Edit Allergies</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            className="w-8 h-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={handleSave}
            disabled={isUpdating}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg"
          >
            {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Sensitivity Level Selection */}
      <div className="mb-5">
        <p className="text-xs font-medium text-slate-500 mb-2">Sensitivity Level</p>
        <div className="flex gap-2">
          {SENSITIVITY_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setSensitivityLevel(level)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                sensitivityLevel === level
                  ? level === "highly_sensitive"
                    ? "bg-red-500 text-white"
                    : level === "sensitive"
                    ? "bg-orange-500 text-white"
                    : "bg-green-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {level.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Allergies */}
      <div className="mb-5">
        <p className="text-xs font-medium text-slate-500 mb-2">Selected Allergies</p>
        {selectedAllergies.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedAllergies.map((allergy) => (
              <button
                key={allergy}
                onClick={() => handleRemoveAllergen(allergy)}
                className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full capitalize hover:bg-red-200 transition-colors"
              >
                {allergy}
                <X className="w-3 h-3" />
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Tap allergens below to add</p>
        )}
      </div>

      {/* Common Allergens */}
      <div className="mb-5">
        <p className="text-xs font-medium text-slate-500 mb-2">Common Allergens</p>
        <div className="flex flex-wrap gap-1.5">
          {COMMON_ALLERGENS.map((allergen) => (
            <button
              key={allergen}
              type="button"
              onClick={() => handleToggleAllergen(allergen)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                selectedAllergies.includes(allergen)
                  ? "bg-purple-500 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-purple-50"
              }`}
            >
              {allergen}
            </button>
          ))}
        </div>
      </div>

      {/* Add Custom Allergen */}
      <div>
        <p className="text-xs font-medium text-slate-500 mb-2">Add Custom</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={customAllergen}
            onChange={(e) => setCustomAllergen(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddCustom()}
            placeholder="Enter allergen..."
            className="flex-1 h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-pink-400"
          />
          <button
            type="button"
            onClick={handleAddCustom}
            disabled={!customAllergen.trim()}
            className="w-10 h-10 flex items-center justify-center bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
