"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Camera, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAddProductMutation } from "@/redux/services/vanityService";
import type { ProductCategory } from "@/lib/types/vanity.types";

const categories: { value: ProductCategory; label: string }[] = [
  { value: "foundation", label: "Foundation" },
  { value: "concealer", label: "Concealer" },
  { value: "powder", label: "Powder" },
  { value: "blush", label: "Blush" },
  { value: "bronzer", label: "Bronzer" },
  { value: "highlighter", label: "Highlighter" },
  { value: "eyeshadow", label: "Eyeshadow" },
  { value: "eyeliner", label: "Eyeliner" },
  { value: "mascara", label: "Mascara" },
  { value: "eyebrow", label: "Eyebrow" },
  { value: "lipstick", label: "Lipstick" },
  { value: "lip_gloss", label: "Lip Gloss" },
  { value: "lip_liner", label: "Lip Liner" },
  { value: "primer", label: "Primer" },
  { value: "setting_spray", label: "Setting Spray" },
  { value: "skincare", label: "Skincare" },
  { value: "other", label: "Other" },
];

const finishOptions = ["Matte", "Dewy", "Natural"];

export default function AddProductPage() {
  const router = useRouter();
  const [addProduct, { isLoading }] = useAddProductMutation();

  const [formData, setFormData] = useState({
    brand: "",
    product_name: "",
    category: "" as ProductCategory | "",
    shade: "",
    finish: "",
    purchase_date: "",
    notes: "",
  });

  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.product_name || !formData.category) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      await addProduct({
        brand: formData.brand,
        product_name: formData.product_name,
        category: formData.category as ProductCategory,
        shade: formData.shade || undefined,
        purchase_date: formData.purchase_date || undefined,
        notes: formData.notes || undefined,
        tags: formData.finish ? [formData.finish] : undefined,
      }).unwrap();

      toast.success("Product added to your vanity!");
      router.push("/vanity");
    } catch {
      toast.error("Failed to add product");
    }
  };

  return (
    <div className="min-h-dvh bg-background safe-top">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-input transition-colors"
        >
          <ArrowLeft size={24} className="text-foreground" />
        </button>
        <h1 className="text-xl font-semibold text-foreground">Add Product</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="px-6 py-6 pb-32 space-y-5">
        {/* Photo Upload */}
        <div>
          <Label>Product Photo (Optional)</Label>
          <div className="mt-2 border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center bg-input/30 cursor-pointer hover:bg-input/50 transition-colors">
            <Camera size={32} className="text-foreground-muted mb-2" />
            <p className="text-sm text-foreground-muted">Tap to add photo</p>
          </div>
        </div>

        {/* Category Dropdown */}
        <div>
          <Label>Product Category *</Label>
          <div className="relative mt-2">
            <button
              type="button"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="flex items-center justify-between w-full h-12 px-4 rounded-xl border border-border bg-input text-left"
            >
              <span
                className={
                  formData.category ? "text-foreground" : "text-foreground-muted"
                }
              >
                {formData.category
                  ? categories.find((c) => c.value === formData.category)?.label
                  : "Select category"}
              </span>
              <ChevronDown
                size={20}
                className={cn(
                  "text-foreground-muted transition-transform",
                  showCategoryDropdown && "rotate-180"
                )}
              />
            </button>

            {showCategoryDropdown && (
              <Card className="absolute z-10 top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto shadow-lg">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => {
                      handleChange("category", cat.value);
                      setShowCategoryDropdown(false);
                    }}
                    className={cn(
                      "w-full px-4 py-3 text-left hover:bg-input transition-colors",
                      formData.category === cat.value && "bg-primary/10 text-primary"
                    )}
                  >
                    {cat.label}
                  </button>
                ))}
              </Card>
            )}
          </div>
        </div>

        {/* Brand */}
        <div>
          <Label htmlFor="brand">Brand</Label>
          <Input
            id="brand"
            placeholder="e.g., MAC, Maybelline"
            value={formData.brand}
            onChange={(e) => handleChange("brand", e.target.value)}
            className="mt-2"
          />
        </div>

        {/* Product Name */}
        <div>
          <Label htmlFor="product_name">Product Name *</Label>
          <Input
            id="product_name"
            placeholder="e.g., Ruby Woo Lipstick"
            value={formData.product_name}
            onChange={(e) => handleChange("product_name", e.target.value)}
            className="mt-2"
          />
        </div>

        {/* Shade/Color */}
        <div>
          <Label htmlFor="shade">Shade / Color</Label>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary flex-shrink-0" />
            <Input
              id="shade"
              placeholder="e.g., Ruby Woo, #234"
              value={formData.shade}
              onChange={(e) => handleChange("shade", e.target.value)}
            />
          </div>
        </div>

        {/* Finish */}
        <div>
          <Label>Finish</Label>
          <div className="flex gap-2 mt-2">
            {finishOptions.map((finish) => (
              <button
                key={finish}
                type="button"
                onClick={() => handleChange("finish", finish)}
                className={cn(
                  "flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all",
                  formData.finish === finish
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-foreground hover:border-primary/50"
                )}
              >
                {finish}
              </button>
            ))}
          </div>
        </div>

        {/* Purchase Date */}
        <div>
          <Label htmlFor="purchase_date">Purchase Date</Label>
          <Input
            id="purchase_date"
            type="date"
            value={formData.purchase_date}
            onChange={(e) => handleChange("purchase_date", e.target.value)}
            className="mt-2"
          />
        </div>

        {/* Notes */}
        <div>
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            placeholder="Any additional notes..."
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            className="mt-2 w-full h-24 px-4 py-3 rounded-xl border border-border bg-input resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </form>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-6 safe-bottom">
        <div className="max-w-[430px] mx-auto space-y-3">
          <Button
            variant="gradient"
            fullWidth
            onClick={handleSubmit}
            loading={isLoading}
          >
            Add to Vanity
          </Button>
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full text-center text-sm text-foreground-muted hover:text-foreground py-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
