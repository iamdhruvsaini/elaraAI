"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  VanityHeader,
  CategoryFilter,
  ProductsList,
  EmptyState,
  FloatingActions,
} from "@/components/vanity-page";
import type { CategoryType } from "@/components/vanity-page";
import {
  useGetAllProductsQuery,
  useDeleteProductMutation,
} from "@/redux/services/vanity/vanityService";
import { showToast } from "@/components/toast/toast";
import type { VanityProduct } from "@/redux/services/vanity/types";

export default function VanityManagementPage() {
  const router = useRouter();
  const { data: productsData, isLoading } = useGetAllProductsQuery();
  const [deleteProduct] = useDeleteProductMutation();
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>("all");

  const products = productsData?.products || [];

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((product) => {
      const cat = product.category || "other";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Filter products by category
  const filteredProducts = useMemo(() => {
    if (selectedCategory === "all") return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  const handleEdit = (product: VanityProduct) => {
    router.push(`/vanity-management/edit/${product.id}`);
  };

  const handleDelete = async (productId: number) => {
    if (!confirm("Delete this product from your vanity?")) {
      return;
    }

    try {
      await deleteProduct(productId).unwrap();
      showToast("Product deleted!", "success");
    } catch (error: any) {
      showToast(error?.data?.detail || "Failed to delete product", "error");
    }
  };

  const handleAddProduct = () => {
    router.push("/vanity-management/add");
  };

  const handleScanProduct = () => {
    router.push("/vanity-management/scan");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-pink-500 mb-4" />
        <p className="text-gray-600 font-medium">Loading your vanity...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <VanityHeader
        totalProducts={products.length}
        onScan={handleScanProduct}
        onAdd={handleAddProduct}
      />

      {/* Main Content */}
      <div className="px-4">
        {products.length === 0 ? (
          /* Empty State */
          <EmptyState onScan={handleScanProduct} onAdd={handleAddProduct} />
        ) : (
          <>
            {/* Category Filter */}
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              categoryCounts={categoryCounts}
            />

            {/* Products List or Category Empty State */}
            {filteredProducts.length === 0 ? (
              <EmptyState
                onScan={handleScanProduct}
                onAdd={handleAddProduct}
                categoryName={selectedCategory}
              />
            ) : (
              <div className="mt-2">
                {/* Results Count */}
                <p className="text-sm text-gray-500 mb-3 font-medium">
                  {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}
                  {selectedCategory !== "all" && ` in ${selectedCategory.replace("_", " ")}`}
                </p>

                {/* Products */}
                <ProductsList
                  products={filteredProducts}
                  isLoading={false}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
