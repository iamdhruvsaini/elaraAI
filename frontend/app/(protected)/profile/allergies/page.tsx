"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useUpdateAllergiesMutation } from "@/redux/services/profile/profileService";
import { Loader2, AlertCircle, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  "Coconut Oil",
  "Tea Tree Oil",
];

const AllergiesPage = () => {
  const router = useRouter();
  const [updateAllergies, { isLoading }] = useUpdateAllergiesMutation();

  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [customAllergy, setCustomAllergy] = useState("");
  const [sensitivityLevel, setSensitivityLevel] = useState<string>("moderate");

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

  const removeAllergy = (allergy: string) => {
    setSelectedAllergies((prev) => prev.filter((a) => a !== allergy));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await updateAllergies({ 
        allergies: selectedAllergies,
        sensitivity_level: sensitivityLevel 
      }).unwrap();
      console.log("✅ Allergies updated successfully:", response);

      // Navigate to dashboard/profile page
      router.push("/profile");
    } catch (error: any) {
      console.error("❌ Failed to update allergies:", error);
      alert(error?.data?.message || "Failed to update allergies. Please try again.");
    }
  };

  const handleSkip = () => {
    router.push("/profile");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-6 h-6 text-blue-600" />
              <CardTitle className="text-2xl font-bold">Ingredient Allergies</CardTitle>
            </div>
            <CardDescription className="text-base">
              Help us recommend safe products by selecting any ingredients you're allergic to
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Selected Allergies Display */}
              {selectedAllergies.length > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Label className="text-sm font-medium text-blue-900 mb-2 block">
                    Selected Allergies ({selectedAllergies.length})
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedAllergies.map((allergy) => (
                      <Badge
                        key={allergy}
                        variant="secondary"
                        className="px-3 py-1.5 bg-blue-100 text-blue-800 hover:bg-blue-200 flex items-center gap-1"
                      >
                        {allergy}
                        <button
                          type="button"
                          onClick={() => removeAllergy(allergy)}
                          className="ml-1 hover:text-blue-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Common Allergies */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Common Allergens</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {commonAllergies.map((allergy) => (
                    <button
                      key={allergy}
                      type="button"
                      onClick={() => toggleAllergy(allergy)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all font-medium text-sm ${
                        selectedAllergies.includes(allergy)
                          ? "border-blue-600 bg-blue-600 text-white shadow-md"
                          : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50"
                      }`}
                    >
                      {allergy}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sensitivity Level Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Sensitivity Level</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "mild", label: "Mild", description: "Minor reactions" },
                    { value: "moderate", label: "Moderate", description: "Noticeable reactions" },
                    { value: "severe", label: "Severe", description: "Serious reactions" },
                  ].map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setSensitivityLevel(level.value)}
                      className={`px-4 py-3 rounded-lg border-2 transition-all ${
                        sensitivityLevel === level.value
                          ? "border-blue-600 bg-blue-600 text-white shadow-md"
                          : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50"
                      }`}
                    >
                      <div className="font-medium text-sm">{level.label}</div>
                      <div className={`text-xs mt-1 ${
                        sensitivityLevel === level.value ? "text-blue-100" : "text-gray-500"
                      }`}>
                        {level.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Allergy Input */}
              <div className="space-y-3">
                <Label htmlFor="custom_allergy" className="text-sm font-medium">
                  Add Custom Allergy
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="custom_allergy"
                    value={customAllergy}
                    onChange={(e) => setCustomAllergy(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomAllergy();
                      }
                    }}
                    placeholder="Enter ingredient name..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={addCustomAllergy}
                    disabled={!customAllergy.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  onClick={handleSkip}
                  variant="outline"
                  className="flex-1 py-3 text-base"
                >
                  Skip for Now
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-semibold"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5 mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Continue to Profile"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Progress Indicator */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
          <div className="w-3 h-3 rounded-full bg-blue-600"></div>
          <div className="w-3 h-3 rounded-full bg-gray-300"></div>
        </div>
        <p className="text-center text-sm text-gray-600 mt-2">Step 2 of 3</p>
      </div>
    </div>
  );
};

export default AllergiesPage;
