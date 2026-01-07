"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronRight, Shield, ShieldAlert, ShieldCheck, Calendar, DollarSign } from "lucide-react";
import type { VanityProduct } from "@/redux/services/vanity/types";

interface ProductCardProps {
  product: VanityProduct;
  onEdit: (product: VanityProduct) => void;
  onDelete: (productId: number) => void;
}

const getCategoryEmoji = (category: string): string => {
  const emojiMap: Record<string, string> = {
    foundation: "💄",
    concealer: "🪄",
    powder: "🌸",
    blush: "🌺",
    bronzer: "☀️",
    highlighter: "💎",
    eyeshadow: "👁️",
    eyeliner: "✏️",
    mascara: "🦋",
    lipstick: "💋",
    lip_gloss: "✨",
    lip_liner: "🖍️",
    other: "🎨",
    // Legacy categories
    face: "💄",
    eyes: "👁️",
    lips: "💋",
    cheeks: "🌸",
  };
  return emojiMap[category?.toLowerCase()] || "✨";
};

const getCategoryGradient = (category: string): string => {
  const gradientMap: Record<string, string> = {
    foundation: "from-amber-100 to-orange-100",
    concealer: "from-yellow-100 to-amber-100",
    powder: "from-pink-100 to-rose-100",
    blush: "from-rose-100 to-pink-100",
    bronzer: "from-orange-100 to-amber-100",
    highlighter: "from-purple-100 to-pink-100",
    eyeshadow: "from-violet-100 to-purple-100",
    eyeliner: "from-gray-100 to-slate-100",
    mascara: "from-indigo-100 to-violet-100",
    lipstick: "from-red-100 to-rose-100",
    lip_gloss: "from-pink-100 to-fuchsia-100",
    lip_liner: "from-rose-100 to-red-100",
    other: "from-gray-100 to-slate-100",
    // Legacy
    face: "from-amber-100 to-orange-100",
    eyes: "from-violet-100 to-purple-100",
    lips: "from-red-100 to-rose-100",
    cheeks: "from-rose-100 to-pink-100",
  };
  return gradientMap[category?.toLowerCase()] || "from-gray-100 to-slate-100";
};

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onEdit,
  onDelete,
}) => {
  const getSafetyConfig = () => {
    if (product.is_safe_for_user === true) {
      return {
        icon: <ShieldCheck className="w-3.5 h-3.5" />,
        text: "Safe",
        className: "bg-green-50 text-green-700 border-green-200",
      };
    } else if (product.is_safe_for_user === false) {
      return {
        icon: <ShieldAlert className="w-3.5 h-3.5" />,
        text: "Alert",
        className: "bg-red-50 text-red-700 border-red-200",
      };
    }
    return {
      icon: <Shield className="w-3.5 h-3.5" />,
      text: "Unchecked",
      className: "bg-gray-50 text-gray-600 border-gray-200",
    };
  };

  const safetyConfig = getSafetyConfig();

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return null;
    }
  };

  const isExpiringSoon = () => {
    if (!product.expiry_date) return false;
    const expiry = new Date(product.expiry_date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = () => {
    if (!product.expiry_date) return false;
    return new Date(product.expiry_date) < new Date();
  };

  return (
    <div 
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-[0.99] overflow-hidden"
      onClick={() => onEdit(product)}
    >
      <div className="flex items-stretch">
        {/* Category Icon */}
        <div className={`w-20 flex-shrink-0 bg-gradient-to-br ${getCategoryGradient(product.category)} flex items-center justify-center`}>
          <span className="text-3xl">{getCategoryEmoji(product.category)}</span>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 min-w-0">
          {/* Top Row: Brand & Safety */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-pink-600 uppercase tracking-wide truncate">
                {product.brand || "Unknown Brand"}
              </p>
              <h3 className="font-bold text-gray-900 truncate text-base leading-tight">
                {product.product_name}
              </h3>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
          </div>

          {/* Shade */}
          {product.shade && (
            <p className="text-sm text-gray-500 truncate mb-2">
              {product.shade}
            </p>
          )}

          {/* Bottom Row: Meta & Actions */}
          <div className="flex items-center justify-between gap-2 mt-2">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Safety Badge */}
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold border ${safetyConfig.className}`}>
                {safetyConfig.icon}
                {safetyConfig.text}
              </span>

              {/* Expiry Warning */}
              {isExpired() && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                  <Calendar className="w-3 h-3" />
                  Expired
                </span>
              )}
              {isExpiringSoon() && !isExpired() && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                  <Calendar className="w-3 h-3" />
                  Expiring Soon
                </span>
              )}

              {/* Price */}
              {product.price && (
                <span className="inline-flex items-center gap-0.5 text-xs font-medium text-gray-500">
                  <DollarSign className="w-3 h-3" />
                  {product.price.toFixed(2)}
                </span>
              )}
            </div>

            {/* Delete Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(product.id);
              }}
              className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
