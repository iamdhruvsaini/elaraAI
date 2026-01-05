"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <Card className="shadow-xl border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <CardTitle className="text-lg">Allergies & Sensitivities</CardTitle>
            </div>
            <Button
              onClick={() => setIsEditing(true)}
              variant="ghost"
              size="sm"
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sensitivity Level */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Sensitivity Level</p>
            <Badge
              variant="outline"
              className={`capitalize ${
                initialSensitivity === "highly_sensitive"
                  ? "border-red-500 text-red-600"
                  : initialSensitivity === "sensitive"
                  ? "border-orange-500 text-orange-600"
                  : "border-green-500 text-green-600"
              }`}
            >
              {initialSensitivity?.replace("_", " ") || "Normal"}
            </Badge>
          </div>

          {/* Allergies List */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Known Allergies</p>
            {initialAllergies && initialAllergies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {initialAllergies.map((allergy) => (
                  <Badge
                    key={allergy}
                    variant="secondary"
                    className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 capitalize"
                  >
                    {allergy}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No allergies listed</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Edit Mode
  return (
    <Card className="shadow-xl border-0 ring-2 ring-purple-500">
      <CardHeader className="bg-purple-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-lg">Edit Allergies</CardTitle>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleCancel}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isUpdating}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 flex items-center gap-1"
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Sensitivity Level Selection */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Sensitivity Level</p>
          <div className="flex flex-wrap gap-2">
            {SENSITIVITY_LEVELS.map((level) => (
              <Button
                key={level}
                type="button"
                variant={sensitivityLevel === level ? "default" : "outline"}
                size="sm"
                onClick={() => setSensitivityLevel(level)}
                className={`capitalize ${
                  sensitivityLevel === level
                    ? level === "highly_sensitive"
                      ? "bg-red-500 hover:bg-red-600"
                      : level === "sensitive"
                      ? "bg-orange-500 hover:bg-orange-600"
                      : "bg-green-500 hover:bg-green-600"
                    : ""
                }`}
              >
                {level.replace("_", " ")}
              </Button>
            ))}
          </div>
        </div>

        {/* Selected Allergies */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Selected Allergies</p>
          {selectedAllergies.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedAllergies.map((allergy) => (
                <Badge
                  key={allergy}
                  variant="secondary"
                  className="px-3 py-1.5 bg-red-100 text-red-700 border border-red-300 capitalize cursor-pointer hover:bg-red-200 flex items-center gap-1"
                  onClick={() => handleRemoveAllergen(allergy)}
                >
                  {allergy}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-4">No allergies selected</p>
          )}
        </div>

        {/* Common Allergens */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Common Allergens</p>
          <div className="flex flex-wrap gap-2">
            {COMMON_ALLERGENS.map((allergen) => (
              <Button
                key={allergen}
                type="button"
                variant={selectedAllergies.includes(allergen) ? "default" : "outline"}
                size="sm"
                onClick={() => handleToggleAllergen(allergen)}
                className={`capitalize text-xs ${
                  selectedAllergies.includes(allergen)
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "hover:bg-purple-50"
                }`}
              >
                {allergen}
              </Button>
            ))}
          </div>
        </div>

        {/* Add Custom Allergen */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Add Custom Allergen</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={customAllergen}
              onChange={(e) => setCustomAllergen(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddCustom()}
              placeholder="Enter allergen name..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
            <Button
              type="button"
              onClick={handleAddCustom}
              disabled={!customAllergen.trim()}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
