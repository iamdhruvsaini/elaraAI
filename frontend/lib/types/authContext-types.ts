import { MeResponse, GoogleOAuthRequest } from "@/redux/services/authentication/types";

export type AuthContextType = {
  currentUser: MeResponse | null;
  isAuthenticated: boolean;
  authChecked: boolean;

  registerUser: (user: any) => Promise<any>;
  registrationLoading: boolean;
  registrationError: unknown;

  loginUser: (user: any) => Promise<any>;
  loginLoading: boolean;
  loginError: unknown;

  signInWithGoogle: (googleData: GoogleOAuthRequest) => Promise<any>;
  googleLoading: boolean;
  logout: () => void;
};
