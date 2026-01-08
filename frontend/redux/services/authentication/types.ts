export interface RegisterUserRequest {
  email: string;
  password: string;
  full_name: string;
  auth_provider: "email" | "google" | "github";
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

export interface GoogleOAuthResponse {
  email: string;
  username: string;
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number;
}

export interface MeResponse {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

export interface CaptureUserImageResponse 
  {
  skin_tone: "string",
  undertone: "string",
  skin_type: "string",
  confidence: 1,
  raw_data: {}
}