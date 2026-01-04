export interface RegisterUserRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  auth_provider: "email" | "google" | "phone";
}

export interface RegisterUserResponse {
  email: string;
  username: string;
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
}

export interface LoginUserRequest {
  email: string;
  password: string;
}

export interface LoginUserResponse {
  email: string;
  username: string;
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
}

export interface GoogleOAuthRequest {
  google_id: string;
  email: string;
  full_name: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface MeResponse {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  updated_at: string;
  profile?: UserProfile;
}

export interface UserProfile {
  id: string;
  user_id: string;
  skin_tone?: string;
  undertone?: string;
  skin_type?: string;
  skin_concerns?: string[];
  allergies?: string[];
  sensitivity_level?: "low" | "medium" | "high";
  face_image_url?: string;
  preferred_language?: string;
  enable_voice_guidance?: boolean;
  enable_notifications?: boolean;
  dark_mode?: boolean;
  total_sessions?: number;
  products_count?: number;
}

export interface AuthContextType {
  currentUser: MeResponse | null;
  isAuthenticated: boolean;
  authChecked: boolean;

  registerUser: (user: Omit<RegisterUserRequest, "auth_provider">) => Promise<RegisterUserResponse>;
  registrationLoading: boolean;
  registrationError: unknown;

  loginUser: (user: LoginUserRequest) => Promise<LoginUserResponse>;
  loginLoading: boolean;
  loginError: unknown;

  signInWithGoogle: (data: GoogleOAuthRequest) => Promise<void>;
  logout: () => void;
}
