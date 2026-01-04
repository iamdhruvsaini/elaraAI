export type SessionStatus = "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "PAUSED";
export type SessionOccasion = "DAILY" | "OFFICE" | "PARTY" | "WEDDING" | "FESTIVE" | "DATE_NIGHT" | "PHOTOSHOOT";
export type SessionScope = "FULL_FACE" | "EYES_ONLY" | "LIPS_ONLY" | "TOUCH_UP" | "NO_MAKEUP_LOOK";

export interface MakeupSession {
  id: string;
  user_id: string;
  status: SessionStatus;
  occasion: SessionOccasion;
  scope: SessionScope;
  outfit_description?: string;
  outfit_colors?: string[];
  outfit_style?: string;
  accessories?: Record<string, unknown>;
  makeup_plan?: MakeupPlan;
  current_step: number;
  total_steps: number;
  steps_completed: number[];
  final_image_url?: string;
  feedback?: string;
  rating?: number;
  duration_minutes?: number;
  ai_suggestions?: string[];
  user_modifications?: string[];
  created_at: string;
  updated_at: string;
}

export interface MakeupPlan {
  occasion: SessionOccasion;
  scope: SessionScope;
  steps: MakeupStep[];
  recommendations: string[];
  tips: string[];
}

export interface MakeupStep {
  step_number: number;
  category: string;
  product_type: string;
  instructions: string;
  tips?: string[];
  duration_minutes?: number;
}

export interface StartSessionRequest {
  occasion: SessionOccasion;
  scope: SessionScope;
  outfit_description?: string;
}

export interface StyleSessionRequest {
  description: string;
  accessories?: {
    ear?: { item: string; material: string; color: string };
    neck?: { item: string; material: string; color: string };
    nose?: { item: string; material: string; color: string };
    hand?: { item: string; material: string; color: string };
    hair?: { item: string; material: string; color: string };
  };
}

export interface StyleSessionResponse {
  id: string;
  outfit_description: string;
  outfit_type: string;
  outfit_colors: string[];
  accessories: Record<string, unknown>;
  confidence: number;
}

export interface HairSuggestionResponse {
  recommended_styles: string[];
  confidence: number;
}

export interface AccessoryRecommendationResponse {
  suggestions: Array<{
    category: string;
    item: string;
    reason: string;
  }>;
  confidence: number;
}

export interface ProductMatchResponse {
  category: string;
  needed: boolean;
  has_product: boolean;
  product_id?: string;
  product_name?: string;
  is_safe: boolean;
  safety_warnings?: string[];
}

export interface AccessoryOptionsResponse {
  parts: string[];
  materials: string[];
  colors: string[];
  allow_custom_color: boolean;
}
