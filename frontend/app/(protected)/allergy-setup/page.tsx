"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Search,
  Plus,
  X,
  Info,
  Beaker,
  Sparkles,
  Droplets,
  Hand,
  Watch,
  Dog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useUpdateAllergiesMutation } from "@/redux/services/profileService";

const commonAllergens = [
  { id: "parabens", name: "Parabens", icon: Beaker },
  { id: "fragrance", name: "Fragrance", icon: Sparkles },
  { id: "sulfates", name: "Sulfates", icon: Droplets },
  { id: "latex", name: "Latex", icon: Hand },
  { id: "nickel", name: "Nickel", icon: Watch },
  { id: "lanolin", name: "Lanolin", icon: Dog },
];

export default function AllergySetupPage() {
  const router = useRouter();
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [customAllergen, setCustomAllergen] = useState("");
  const [updateAllergies, { isLoading }] = useUpdateAllergiesMutation();

  const toggleAllergen = (id: string) => {
    setSelectedAllergens((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const addCustomAllergen = () => {
    if (!customAllergen.trim()) return;
    const normalized = customAllergen.trim().toLowerCase();
    if (!selectedAllergens.includes(normalized)) {
      setSelectedAllergens((prev) => [...prev, normalized]);
    }
    setCustomAllergen("");
  };

  const removeAllergen = (id: string) => {
    setSelectedAllergens((prev) => prev.filter((a) => a !== id));
  };

  const handleSave = async () => {
    try {
      await updateAllergies({
        allergies: selectedAllergens,
        sensitivity_level: selectedAllergens.length > 3 ? "high" : selectedAllergens.length > 0 ? "medium" : "low",
      }).unwrap();
      toast.success("Allergy profile saved!");
      router.push("/face-analysis");
    } catch {
      toast.error("Failed to save allergies");
    }
  };

  const handleSkip = () => {
    router.push("/face-analysis");
  };

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 safe-top">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-input transition-colors"
        >
          <ArrowLeft size={24} className="text-foreground" />
        </button>
        <h1 className="text-xl font-semibold text-foreground">Profile Setup</h1>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-32 overflow-y-auto">
        {/* Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            🛡️ Protect Your Skin
          </h2>
          <p className="text-foreground-muted text-sm">
            Help us keep you safe by selecting ingredients you need to avoid
          </p>
        </div>

        {/* Common Allergens Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {commonAllergens.map((allergen) => {
            const isSelected = selectedAllergens.includes(allergen.id);
            const Icon = allergen.icon;
            return (
              <button
                key={allergen.id}
                onClick={() => toggleAllergen(allergen.id)}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    isSelected ? "bg-primary/10" : "bg-input"
                  )}
                >
                  <Icon
                    size={20}
                    className={isSelected ? "text-primary" : "text-foreground-muted"}
                  />
                </div>
                <span
                  className={cn(
                    "font-medium text-sm",
                    isSelected ? "text-primary" : "text-foreground"
                  )}
                >
                  {allergen.name}
                </span>
                {isSelected && (
                  <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Custom Allergen Search */}
        <div className="mb-6">
          <p className="text-sm font-medium text-foreground mb-2">
            Add custom ingredients to avoid
          </p>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search ingredients..."
                value={customAllergen}
                onChange={(e) => setCustomAllergen(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomAllergen()}
                icon={<Search size={18} />}
              />
            </div>
            <Button
              variant="default"
              size="icon"
              onClick={addCustomAllergen}
              disabled={!customAllergen.trim()}
            >
              <Plus size={20} />
            </Button>
          </div>
        </div>

        {/* Selected Allergens Chips */}
        {selectedAllergens.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-medium text-foreground mb-2">
              Your allergen list
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedAllergens.map((allergen) => {
                const isCommon = commonAllergens.find((a) => a.id === allergen);
                return (
                  <Badge
                    key={allergen}
                    variant="default"
                    className="pr-1.5 capitalize"
                  >
                    {isCommon ? isCommon.name : allergen}
                    <button
                      onClick={() => removeAllergen(allergen)}
                      className="ml-1.5 p-0.5 rounded-full hover:bg-primary/20"
                    >
                      <X size={14} />
                    </button>
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Info Banner */}
        <div className="bg-info/10 rounded-xl p-4 flex gap-3">
          <Info size={20} className="text-info flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">
            We&apos;ll flag products containing these ingredients when you scan or
            search, helping you make safer choices for your skin.
          </p>
        </div>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-6 safe-bottom">
        <div className="max-w-[430px] mx-auto flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 text-center text-sm font-medium text-foreground-muted hover:text-foreground py-3 px-4 rounded-xl border-2 border-border hover:border-primary/50 transition-all"
          >
            Skip for Now
          </button>
          <Button
            variant="gradient"
            className="flex-1"
            onClick={handleSave}
            loading={isLoading}
          >
            Save & Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
