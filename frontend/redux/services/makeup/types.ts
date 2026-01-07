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

// Makeup Session Types
export type OccasionType = "daily" | "party" | "wedding" | "office" | "date_night" | "formal" | "casual";
export type MakeupScope = "full_face" | "eyes_only" | "lips_only" | "base_only";
export type SessionStatus = "in_progress" | "completed" | "abandoned";

// Start Makeup Session Request
export interface StartMakeupRequest {
  occasion: OccasionType;
  scope: MakeupScope;
  outfit_description: string;
  scheduled_event_id?: number;
}

// Start Makeup Session Response
export interface MakeupSessionResponse {
  id: number;
  user_id: number;
  occasion: OccasionType;
  scope: MakeupScope;
  status: SessionStatus;
  outfit_description: string;
  outfit_colors: string[];
  accessories_data: Record<string, any>;
  makeup_plan: Record<string, any>;
  products_used: any[];
  products_needed: any[];
  current_step: number;
  total_steps: number;
  steps_completed: any[];
  final_image_url: string;
  user_rating: number;
  started_at: string;
  completed_at: string;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
}

// Style Session Request
export interface StyleSessionRequest {
  description: string;
  accessories: Record<string, any>;
}

// Style Session Response
export interface StyleSessionResponse {
  id: number;
  outfit_description: string;
  outfit_type: string;
  outfit_colors: string[];
  accessories: Record<string, any>;
  confidence: number;
  created_at: string;
  message: string;
}

// Makeup Plan Step
export interface MakeupStep {
  step_number: number;
  category: string;
  instruction: string;
  products: string[];
  tips: string[];
  duration_minutes: number;
}

// Generate Makeup Plan Response
export interface MakeupPlanResponse {
  occasion: string;
  scope: string;
  style: string;
  reasoning: string;
  intensity: string;
  steps: MakeupStep[];
  key_focus: string[];
  estimated_duration: number;
  difficulty: string;
}

// Makeup scope options
export const MAKEUP_SCOPES: SelectOption[] = [
  { value: "full_face", label: "Full Face" },
  { value: "eyes_only", label: "Eyes Only" },
  { value: "lips_only", label: "Lips Only" },
  { value: "base_only", label: "Base Only" },
];
