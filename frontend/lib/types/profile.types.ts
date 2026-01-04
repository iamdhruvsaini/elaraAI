export interface AnalyzeFaceResponse {
  skin_tone: string;
  undertone: string;
  skin_type: string;
  confidence: number;
  raw_data: Record<string, unknown>;
}

export interface UpdateAllergiesRequest {
  allergies: string[];
  sensitivity_level: "low" | "medium" | "high";
}

export interface ProfileSetupRequest {
  full_name: string;
  age?: number;
  location?: string;
}

export interface ProfileUpdateRequest {
  full_name?: string;
  age?: number;
  location?: string;
  skin_tone?: string;
  undertone?: string;
  skin_type?: string;
  allergies?: string[];
  sensitivity_level?: "low" | "medium" | "high";
  preferred_language?: string;
  enable_voice_guidance?: boolean;
  enable_notifications?: boolean;
  dark_mode?: boolean;
}

export interface DashboardResponse {
  user: {
    id: string;
    full_name: string;
    email: string;
  };
  stats: {
    total_products: number;
    upcoming_events: number;
    completed_sessions: number;
  };
  upcoming_events: UpcomingEvent[];
  recent_sessions: RecentSession[];
  quick_tips: string[];
}

export interface UpcomingEvent {
  id: string;
  event_name: string;
  event_date: string;
  event_time: string;
  occasion: string;
  has_makeup_session: boolean;
}

export interface RecentSession {
  id: string;
  occasion: string;
  created_at: string;
  status: string;
  image_url?: string;
}
