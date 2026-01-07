"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { useAddProductMutation } from "@/redux/services/vanity/vanityService";
import { showToast } from "@/components/toast/toast";

export default function AddProductPage() {
  const router = useRouter();
  const [addProduct, { isLoading }] = useAddProductMutation();
  
  const [formData, setFormData] = useState({
    category: "",
    brand: "",
    product_name: "",
    shade: "",
    price: "",
    ingredients: "",
    purchase_date: "",
    expiry_date: "",
    notes: "",
    tags: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.product_name) {
      showToast("Please enter product name", "error");
      return;
    }

    // Build JSON payload matching backend schema
    const payload: any = {
      product_name: formData.product_name,
    };

    if (formData.brand) payload.brand = formData.brand;
    if (formData.category) payload.category = formData.category;
    if (formData.shade) payload.shade = formData.shade;
    if (formData.price) payload.price = parseFloat(formData.price);
    
    if (formData.ingredients) {
      const ingredientsArray = formData.ingredients.split(",").map(i => i.trim()).filter(Boolean);
      if (ingredientsArray.length > 0) payload.ingredients = ingredientsArray;
    }
    
    if (formData.purchase_date) payload.purchase_date = formData.purchase_date;
    if (formData.expiry_date) payload.expiry_date = formData.expiry_date;
    if (formData.notes) payload.notes = formData.notes;
    
    if (formData.tags) {
      const tagsArray = formData.tags.split(",").map(t => t.trim()).filter(Boolean);
      if (tagsArray.length > 0) payload.tags = tagsArray;
    }

    try {
      await addProduct(payload).unwrap();
      showToast("Product added successfully!", "success");
      router.push("/vanity-management");
    } catch (error: any) {
      console.error("Add product error:", error);
      showToast(error?.data?.detail || "Failed to add product", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-br from-pink-500 via-pink-600 to-purple-600 text-white">
        <div className="px-5 pt-4 pb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-white hover:bg-white/20 rounded-xl w-10 h-10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Add Product</h1>
                <p className="text-pink-200 text-sm">Add to your vanity</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-4 py-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <Label htmlFor="category" className="text-sm font-semibold text-gray-700 mb-2 block">
              Product Category
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger className="h-12 text-base rounded-xl border-gray-200">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="foundation">💄 Foundation</SelectItem>
                <SelectItem value="concealer">✨ Concealer</SelectItem>
                <SelectItem value="powder">🌸 Powder</SelectItem>
                <SelectItem value="blush">🌺 Blush</SelectItem>
                <SelectItem value="bronzer">☀️ Bronzer</SelectItem>
                <SelectItem value="highlighter">✨ Highlighter</SelectItem>
                <SelectItem value="eyeshadow">👁️ Eyeshadow</SelectItem>
                <SelectItem value="eyeliner">✏️ Eyeliner</SelectItem>
                <SelectItem value="mascara">👁️ Mascara</SelectItem>
                <SelectItem value="lipstick">💋 Lipstick</SelectItem>
                <SelectItem value="lip_gloss">💋 Lip Gloss</SelectItem>
                <SelectItem value="lip_liner">💋 Lip Liner</SelectItem>
                <SelectItem value="other">🎨 Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Brand & Product Name */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
            <div>
              <Label htmlFor="brand" className="text-sm font-semibold text-gray-700 mb-2 block">
                Brand
              </Label>
              <Input
                id="brand"
                placeholder="e.g. Fenty Beauty"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="h-12 text-base rounded-xl border-gray-200"
              />
            </div>

            <div>
              <Label htmlFor="product_name" className="text-sm font-semibold text-gray-700 mb-2 block">
                Product Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="product_name"
                placeholder="e.g. Pro Filt'r Foundation"
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                className="h-12 text-base rounded-xl border-gray-200"
              />
            </div>
          </div>

          {/* Shade & Price */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="shade" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Shade / Color
                </Label>
                <Input
                  id="shade"
                  placeholder="e.g. Light Neutral"
                  value={formData.shade}
                  onChange={(e) => setFormData({ ...formData, shade: e.target.value })}
                  className="h-12 text-base rounded-xl border-gray-200"
                />
              </div>

              <div>
                <Label htmlFor="price" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Price
                </Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="39.99"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="h-12 text-base rounded-xl border-gray-200"
                />
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <Label htmlFor="ingredients" className="text-sm font-semibold text-gray-700 mb-2 block">
              Ingredients
            </Label>
            <Textarea
              id="ingredients"
              placeholder="Water, Glycerin, Titanium Dioxide..."
              value={formData.ingredients}
              onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
              rows={3}
              className="text-base rounded-xl resize-none border-gray-200"
            />
            <p className="text-xs text-gray-400 mt-1.5">Separate with commas for safety check</p>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <Label htmlFor="tags" className="text-sm font-semibold text-gray-700 mb-2 block">
              Tags
            </Label>
            <Input
              id="tags"
              placeholder="vegan, cruelty-free, organic"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="h-12 text-base rounded-xl border-gray-200"
            />
          </div>

          {/* Dates */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="purchase_date" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Purchase Date
                </Label>
                <Input
                  id="purchase_date"
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  className="h-12 text-base rounded-xl border-gray-200"
                />
              </div>

              <div>
                <Label htmlFor="expiry_date" className="text-sm font-semibold text-gray-700 mb-2 block">
                  Expiry Date
                </Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  className="h-12 text-base rounded-xl border-gray-200"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <Label htmlFor="notes" className="text-sm font-semibold text-gray-700 mb-2 block">
              Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any personal notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="text-base rounded-xl resize-none border-gray-200"
            />
          </div>

          {/* Submit Button */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent">
            <Button
              type="submit"
              className="w-full h-14 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white text-base font-bold rounded-2xl shadow-xl shadow-pink-200 transition-all active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add to Vanity ✨"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
