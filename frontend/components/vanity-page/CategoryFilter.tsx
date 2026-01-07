"use client";

import React from "react";

export type CategoryType = "all" | "foundation" | "concealer" | "powder" | "blush" | "bronzer" | "highlighter" | "eyeshadow" | "eyeliner" | "mascara" | "lipstick" | "lip_gloss" | "lip_liner" | "other";

interface CategoryFilterProps {
  selectedCategory: CategoryType;
  onCategoryChange: (category: CategoryType) => void;
  categoryCounts: Record<string, number>;
}

const categories: { value: CategoryType; label: string; emoji: string }[] = [
  { value: "all", label: "All", emoji: "✨" },
  { value: "foundation", label: "Foundation", emoji: "💄" },
  { value: "concealer", label: "Concealer", emoji: "🪄" },
  { value: "powder", label: "Powder", emoji: "🌸" },
  { value: "blush", label: "Blush", emoji: "🌺" },
  { value: "bronzer", label: "Bronzer", emoji: "☀️" },
  { value: "highlighter", label: "Highlighter", emoji: "💎" },
  { value: "eyeshadow", label: "Eyeshadow", emoji: "👁️" },
  { value: "eyeliner", label: "Eyeliner", emoji: "✏️" },
  { value: "mascara", label: "Mascara", emoji: "🦋" },
  { value: "lipstick", label: "Lipstick", emoji: "💋" },
  { value: "lip_gloss", label: "Lip Gloss", emoji: "✨" },
  { value: "lip_liner", label: "Lip Liner", emoji: "🖍️" },
  { value: "other", label: "Other", emoji: "🎨" },
];

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onCategoryChange,
  categoryCounts,
}) => {
  const getCount = (category: CategoryType) => {
    if (category === "all") {
      return Object.values(categoryCounts).reduce((a, b) => a + b, 0);
    }
    return categoryCounts[category] || 0;
  };

  // Only show categories that have products (except 'all')
  const visibleCategories = categories.filter(cat => 
    cat.value === "all" || getCount(cat.value) > 0
  );

  return (
    <div className="sticky top-0 z-10 bg-gray-50 pt-4 pb-3">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide px-1 -mx-1">
        {visibleCategories.map((category) => {
          const count = getCount(category.value);
          const isSelected = selectedCategory === category.value;

          return (
            <button
              key={category.value}
              onClick={() => onCategoryChange(category.value)}
              className={`
                flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-full 
                text-sm font-semibold transition-all active:scale-95
                ${isSelected 
                  ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md shadow-pink-200" 
                  : "bg-white text-gray-700 border border-gray-200 hover:border-pink-300 hover:bg-pink-50"
                }
              `}
            >
              <span className="text-base">{category.emoji}</span>
              <span>{category.label}</span>
              {count > 0 && (
                <span className={`
                  ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold
                  ${isSelected ? "bg-white/25" : "bg-gray-100 text-gray-600"}
                `}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
