"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { VanityProduct } from "@/redux/services/vanity/types";

interface ProductsListProps {
  products: VanityProduct[];
  isLoading: boolean;
  onEdit: (product: VanityProduct) => void;
  onDelete: (productId: number) => void;
}

export const ProductsList: React.FC<ProductsListProps> = ({
  products,
  isLoading,
  onEdit,
  onDelete,
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500 mb-4" />
        <p className="text-gray-500 font-medium">Loading your vanity...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
