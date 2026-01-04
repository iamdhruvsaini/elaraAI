"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  ShieldCheck,
  AlertTriangle,
  Heart,
  Trash2,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useGetProductsQuery, useDeleteProductMutation } from "@/redux/services/vanityService";
import type { ProductCategory, VanityProduct } from "@/lib/types/vanity.types";
import toast from "react-hot-toast";

const categories: { id: ProductCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "foundation", label: "Face" },
  { id: "eyeshadow", label: "Eyes" },
  { id: "lipstick", label: "Lips" },
  { id: "blush", label: "Cheeks" },
];

const categoryGroups: Record<string, ProductCategory[]> = {
  FACE: ["foundation", "concealer", "powder", "primer", "bronzer", "highlighter"],
  EYES: ["eyeshadow", "eyeliner", "mascara", "eyebrow"],
  LIPS: ["lipstick", "lip_gloss", "lip_liner"],
  CHEEKS: ["blush"],
};

function getCategoryGroup(category: ProductCategory): string {
  for (const [group, cats] of Object.entries(categoryGroups)) {
    if (cats.includes(category)) return group;
  }
  return "OTHER";
}

function ProductCard({
  product,
  onDelete,
}: {
  product: VanityProduct;
  onDelete: (id: string) => void;
}) {
  return (
    <Card className="flex gap-4 p-4">
      {/* Product Image */}
      <div className="w-20 h-20 rounded-xl bg-primary/10 flex-shrink-0 overflow-hidden">
        {product.product_image_url ? (
          <img
            src={product.product_image_url}
            alt={product.product_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl">
            💄
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-foreground-muted">{product.brand}</p>
        <h3 className="font-medium text-foreground truncate">
          {product.product_name}
        </h3>

        {product.shade && (
          <div className="flex items-center gap-2 mt-1">
            <div
              className="w-4 h-4 rounded-full border border-border"
              style={{ backgroundColor: product.shade }}
            />
            <span className="text-xs text-foreground-muted">{product.shade}</span>
          </div>
        )}

        <div className="flex items-center gap-2 mt-2">
          {product.is_safe_for_user ? (
            <Badge variant="success" icon={<ShieldCheck size={12} />}>
              Safety Checked
            </Badge>
          ) : (
            <Badge variant="warning" icon={<AlertTriangle size={12} />}>
              Check Safety
            </Badge>
          )}
        </div>

        {product.purchase_date && (
          <p className="text-xs text-foreground-muted mt-1">
            Added {new Date(product.purchase_date).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <button className="p-2 rounded-lg hover:bg-input transition-colors">
          <Heart
            size={18}
            className={cn(
              product.is_favorite ? "fill-primary text-primary" : "text-foreground-muted"
            )}
          />
        </button>
        <button
          onClick={() => onDelete(product.id)}
          className="p-2 rounded-lg hover:bg-danger/10 transition-colors text-foreground-muted hover:text-danger"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </Card>
  );
}

export default function VanityPage() {
  const [activeCategory, setActiveCategory] = useState<ProductCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: productsData, isLoading } = useGetProductsQuery({
    category: activeCategory === "all" ? undefined : activeCategory,
  });

  const [deleteProduct] = useDeleteProductMutation();

  const products = productsData?.products || [];
  const filteredProducts = products.filter((p) =>
    p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group products by category
  const groupedProducts = filteredProducts.reduce((acc, product) => {
    const group = getCategoryGroup(product.category);
    if (!acc[group]) acc[group] = [];
    acc[group].push(product);
    return acc;
  }, {} as Record<string, VanityProduct[]>);

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id).unwrap();
      toast.success("Product removed");
    } catch {
      toast.error("Failed to remove product");
    }
  };

  return (
    <div className="min-h-dvh bg-background safe-top">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-foreground">
            💄 {products.length} Products
          </h1>
          <Link href="/vanity/add">
            <Button size="sm" variant="gradient">
              <Plus size={16} />
              Add New
            </Button>
          </Link>
        </div>

        {/* Search */}
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<Search size={18} />}
        />

        {/* Category Filters */}
        <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-hide -mx-6 px-6">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                activeCategory === cat.id
                  ? "bg-primary text-white"
                  : "bg-input text-foreground hover:bg-input/80"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4 pb-32 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛍️</div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No products yet
            </h3>
            <p className="text-foreground-muted text-sm mb-6">
              Start building your vanity collection
            </p>
            <Link href="/vanity/scan">
              <Button variant="gradient">Scan Product</Button>
            </Link>
          </div>
        ) : (
          Object.entries(groupedProducts).map(([group, groupProducts]) => (
            <div key={group}>
              <h2 className="text-sm font-semibold text-foreground-muted mb-3">
                {group} ({groupProducts.length})
              </h2>
              <div className="space-y-3">
                {groupProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button */}
      <Link
        href="/vanity/scan"
        className="fixed bottom-24 right-6 z-20"
      >
        <Button variant="gradient" size="lg" className="shadow-lg shadow-primary/30">
          <Plus size={20} />
          Add More Products
        </Button>
      </Link>
    </div>
  );
}
