"use client";

import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface AllergiesFormProps {
  onSubmit: (allergies: string[], sensitivityLevel: string) => void;
  isLoading: boolean;
}

const commonAllergies = [
  "Parabens",
  "Sulfates",
  "Fragrance",
  "Formaldehyde",
  "Phthalates",
  "Mineral Oil",
  "Retinol",
  "Salicylic Acid",
  "Benzoyl Peroxide",
  "Alcohol",
  "Essential Oils",
  "Lanolin",
];

const SENSITIVITY_LEVELS = [
  { value: "normal", label: "Normal", color: "bg-green-500 hover:bg-green-600" },
  { value: "sensitive", label: "Sensitive", color: "bg-orange-500 hover:bg-orange-600" },
  { value: "highly_sensitive", label: "Highly Sensitive", color: "bg-red-500 hover:bg-red-600" },
];

const AllergiesForm: React.FC<AllergiesFormProps> = ({ onSubmit, isLoading }) => {
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [sensitivityLevel, setSensitivityLevel] = useState("normal");
  const [customAllergy, setCustomAllergy] = useState("");

  const toggleAllergy = (allergy: string) => {
    setSelectedAllergies((prev) =>
      prev.includes(allergy)
        ? prev.filter((a) => a !== allergy)
        : [...prev, allergy]
    );
  };

  const addCustomAllergy = () => {
    const trimmed = customAllergy.trim();
    if (trimmed && !selectedAllergies.includes(trimmed)) {
      setSelectedAllergies((prev) => [...prev, trimmed]);
      setCustomAllergy("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(selectedAllergies, sensitivityLevel);
  };

  return (
    <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6 max-w-md mx-auto pb-24">
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Select your sensitivity level and any ingredients you're allergic to
        </p>
      </div>

      {/* Sensitivity Level */}
      <div>
        <p className="text-xs font-medium text-gray-700 mb-3 px-1">
          Sensitivity Level
        </p>
        <div className="flex gap-2">
          {SENSITIVITY_LEVELS.map((level) => (
            <button
              key={level.value}
              type="button"
              onClick={() => setSensitivityLevel(level.value)}
              className={`flex-1 px-3 py-2.5 rounded-xl border-2 transition-all font-medium text-sm ${
                sensitivityLevel === level.value
                  ? `${level.color} text-white border-transparent shadow-md`
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Allergies */}
      {selectedAllergies.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-xs font-medium text-blue-900 mb-3">
            Selected ({selectedAllergies.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedAllergies.map((allergy) => (
              <Badge
                key={allergy}
                className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1.5"
              >
                {allergy}
                <button onClick={() => toggleAllergy(allergy)} type="button">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Common Allergies Grid */}
      <div>
        <p className="text-xs font-medium text-gray-700 mb-3 px-1">
          Common Allergens
        </p>
        <div className="grid grid-cols-2 gap-2">
          {commonAllergies.map((allergy) => (
            <button
              key={allergy}
              type="button"
              onClick={() => toggleAllergy(allergy)}
              className={`px-4 py-3 rounded-xl border-2 transition-all font-medium text-sm ${
                selectedAllergies.includes(allergy)
                  ? "border-blue-600 bg-blue-600 text-white shadow-md"
                  : "border-gray-200 bg-white text-gray-700 hover:border-blue-400"
              }`}
            >
              {allergy}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Allergy */}
      <div>
        <p className="text-xs font-medium text-gray-700 mb-3 px-1">
          Add Custom Allergy
        </p>
        <div className="flex gap-2">
          <Input
            value={customAllergy}
            onChange={(e) => setCustomAllergy(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomAllergy();
              }
            }}
            placeholder="Type ingredient name..."
            className="flex-1 h-12"
          />
          <Button
            type="button"
            onClick={addCustomAllergy}
            disabled={!customAllergy.trim()}
            className="h-12 w-12 bg-blue-600 hover:bg-blue-700 flex-shrink-0"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </form>
  );
};

export default AllergiesForm;
