import { LoginUserRequest, LoginUserResponse, MeResponse, RegisterUserRequest, RegisterUserResponse } from "@/redux/services/authentication/types";

export interface AuthContextType {
  currentUser: MeResponse | null;
  isAuthenticated: boolean;

  registerUser: (
    user: Omit<RegisterUserRequest, "auth_provider">
  ) => Promise<RegisterUserResponse>;
  registrationLoading: boolean;
  registrationError: unknown;

  loginUser: (user: LoginUserRequest) => Promise<LoginUserResponse>;
  loginLoading: boolean;
  loginError: unknown;

  signInWithGoogle: () => Promise<void>;
  logout: () => void;
};