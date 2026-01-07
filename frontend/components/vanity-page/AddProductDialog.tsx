import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useAddProductMutation } from "@/redux/services/vanity/vanityService";
import { showToast } from "@/components/toast/toast";

interface AddProductDialogProps {
  open: boolean;
  onClose: () => void;
}

export const AddProductDialog: React.FC<AddProductDialogProps> = ({ open, onClose }) => {
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
      handleClose();
    } catch (error: any) {
      console.error("Add product error:", error);
      showToast(error?.data?.detail || "Failed to add product", "error");
    }
  };

  const handleClose = () => {
    setFormData({
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
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Product</DialogTitle>
          <DialogDescription>Add a new product to your vanity</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Product Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
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

          {/* Brand */}
          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Input
              id="brand"
              placeholder="e.g. Fenty Beauty"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            />
          </div>

          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="product_name">
              Product Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="product_name"
              placeholder="e.g. Pro Filt'r Foundation"
              value={formData.product_name}
              onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
            />
          </div>

          {/* Shade/Color */}
          <div className="space-y-2">
            <Label htmlFor="shade">Shade / Color</Label>
            <Input
              id="shade"
              placeholder="e.g. 150 Light Neutral"
              value={formData.shade}
              onChange={(e) => setFormData({ ...formData, shade: e.target.value })}
            />
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              placeholder="e.g. 39.99"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            />
          </div>

          {/* Ingredients */}
          <div className="space-y-2">
            <Label htmlFor="ingredients">Ingredients</Label>
            <Textarea
              id="ingredients"
              placeholder="Separate with commas (e.g. Water, Glycerin, Titanium Dioxide)"
              value={formData.ingredients}
              onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
              rows={2}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="e.g. vegan, cruelty-free, organic"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />
          </div>

          {/* Purchase Date */}
          <div className="space-y-2">
            <Label htmlFor="purchase_date">Purchase Date</Label>
            <Input
              id="purchase_date"
              type="date"
              value={formData.purchase_date}
              onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
            />
          </div>

          {/* Expiry Date */}
          <div className="space-y-2">
            <Label htmlFor="expiry_date">Expiry Date</Label>
            <Input
              id="expiry_date"
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any personal notes about this product..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col gap-2 pt-4">
            <Button
              type="submit"
              className="w-full bg-pink-600 hover:bg-pink-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add to Vanity"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="w-full"
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
