// Hair Suggestion Request Types
export interface HairSuggestionRequest {
  outfit_description: string;
  outfit_style: string;
  occasion: string;
  face_shape: "round" | "oval" | "square" | "heart" | "oblong" | "diamond";
  hair_texture: "fine" | "medium" | "thick" | "coarse";
  hair_length: "short" | "medium" | "long" | "very_long";
}

// Hair Suggestion Response Types
export interface HairBenefit {
  benefit: string;
  description: string;
}

export interface HairSuggestionResponse {
  id: number;
  recommended_style: string;
  style_attributes: string[];
  benefits: HairBenefit[];
  alternatives: string[];
  styling_tips: string[];
  maintenance_level: string;
}

// Form Option Types
export interface SelectOption {
  value: string;
  label: string;
}

export const FACE_SHAPES: SelectOption[] = [
  { value: "round", label: "Round" },
  { value: "oval", label: "Oval" },
  { value: "square", label: "Square" },
  { value: "heart", label: "Heart" },
  { value: "oblong", label: "Oblong" },
  { value: "diamond", label: "Diamond" },
];

export const HAIR_TEXTURES: SelectOption[] = [
  { value: "fine", label: "Fine" },
  { value: "medium", label: "Medium" },
  { value: "thick", label: "Thick" },
  { value: "coarse", label: "Coarse" },
];

export const HAIR_LENGTHS: SelectOption[] = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "long", label: "Long" },
  { value: "very_long", label: "Very Long" },
];

export const OCCASIONS: SelectOption[] = [
  { value: "casual", label: "Casual" },
  { value: "formal", label: "Formal" },
  { value: "wedding", label: "Wedding" },
  { value: "party", label: "Party" },
  { value: "office", label: "Office" },
  { value: "date_night", label: "Date Night" },
  { value: "festival", label: "Festival" },
  { value: "sports", label: "Sports" },
];

export const OUTFIT_STYLES: SelectOption[] = [
  { value: "traditional", label: "Traditional" },
  { value: "western", label: "Western" },
  { value: "fusion", label: "Fusion" },
  { value: "bohemian", label: "Bohemian" },
  { value: "minimalist", label: "Minimalist" },
  { value: "glamorous", label: "Glamorous" },
  { value: "sporty", label: "Sporty" },
  { value: "vintage", label: "Vintage" },
];
