export interface RegisterUserRequest {
  email: string;
  phone: string;
  password: string;
  full_name: string;
  auth_provider: "email" | "google" | "github";
}

export interface RegisterUserResponse {
  id: string;
  email: string;
  full_name: string;
  access_token: string;
}

