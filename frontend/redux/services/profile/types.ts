// Profile Setup Types
export interface ProfileSetupRequest {
  skin_tone?: string;
  undertone?: string;
  skin_type?: string;
  date_of_birth?: string;
  gender?: string;
  preferred_style?: string;
}

export interface ProfileSetupResponse {
  id: string;
  user_id: string;
  skin_tone?: string;
  undertone?: string;
  skin_type?: string;
  date_of_birth?: string;
  gender?: string;
  preferred_style?: string;
  created_at: string;
  updated_at: string;
}

// Face Analysis Types
export interface AnalyzeFaceRequest {
  image: File | Blob;
}

export interface AnalyzeFaceResponse {
  skin_tone: string;
  undertone: string;
  skin_type: string;
  confidence: number;
  raw_data: any;
}

// Allergies Types
export interface UpdateAllergiesRequest {
  allergies: string[];
  sensitivity_level: string;
}

export interface UpdateAllergiesResponse {
  id: string;
  user_id: string;
  allergies: string[];
  sensitivity_level: string;
  updated_at: string;
}

// Dashboard Types
export interface DashboardResponse {
  user: {
    id: number;
    email: string;
    full_name: string;
    age: string | null;
    location: string | null;
    auth_provider: string;
    is_active: boolean;
    is_verified: boolean;
    is_premium: boolean;
    created_at: string;
    last_login: string;
    profile: {
      id: number;
      user_id: number;
      skin_tone?: string;
      undertone?: string;
      skin_type?: string;
      skin_concerns: Array<{
        type: string;
        severity: string;
        confidence: number;
        detected_automatically: boolean;
      }>;
      concern_details: Record<string, any>;
      allergies: string[];
      sensitivity_level: string;
      face_image_url: string | null;
      preferred_language: string;
      enable_voice_guidance: boolean;
      enable_notifications: boolean;
      dark_mode: boolean;
      total_sessions: number;
      products_count: number;
      created_at: string;
      updated_at: string;
    };
  };
  stats: {
    total_sessions: number;
    products_in_vanity: number;
    upcoming_events: number;
    total_looks_saved: number;
    favorite_products: number;
  };
  upcoming_events: any[];
  recent_sessions: Array<{
    id: number;
    occasion: string;
    date: string;
    status: string;
  }>;
  quick_tips: string[];
}

// Profile Update Types
export interface UpdateProfileRequest {
  full_name?: string;
  date_of_birth?: string;
  gender?: string;
  preferred_style?: string;
  allergies?: string[];
}

export interface UpdateProfileResponse {
  id: string;
  user_id: string;
  full_name: string;
  skin_tone?: string;
  undertone?: string;
  skin_type?: string;
  date_of_birth?: string;
  gender?: string;
  preferred_style?: string;
  allergies: string[];
  updated_at: string;
}

// Get Profile Types
export interface GetProfileResponse {
  id: string;
  user_id: string;
  skin_tone?: string;
  undertone?: string;
  skin_type?: string;
  date_of_birth?: string;
  gender?: string;
  preferred_style?: string;
  allergies: string[];
  created_at: string;
  updated_at: string;
}
