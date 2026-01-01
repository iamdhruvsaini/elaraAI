"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
} from "react";
import { useRegisterUserMutation } from "@/redux/services/authentication/authService";
import type { RegisterUserRequest } from "@/redux/services/authentication/types";

/* =======================
   Context Types
======================= */

type AuthContextType = {
  currentUser: any;
  loading: boolean;
  registerUser: (
    user: Omit<RegisterUserRequest, "auth_provider">
  ) => Promise<any>;
  registrationLoading: boolean;
  registrationError: unknown;
  loginUser: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => void;
};

/* =======================
   Create Context
======================= */

const AuthContext = createContext<AuthContextType | null>(null);

/* =======================
   Provider
======================= */

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [
    registerUserMutation,
    { isLoading: registrationLoading, error: registrationError },
  ] = useRegisterUserMutation();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  /* =======================
     Register User
  ======================= */

  const registerUser = async (
    user: Omit<RegisterUserRequest, "auth_provider">
  ) => {
    const payload: RegisterUserRequest = {
      ...user,
      auth_provider: "email",
    };
  
    return await registerUserMutation(payload).unwrap();
  };

  /* =======================
     Login User (placeholder)
  ======================= */

  const loginUser = async () => {
    // implement later
  };

  /* =======================
     Google Sign-in (placeholder)
  ======================= */

  const signInWithGoogle = async () => {
    // implement later
  };

  /* =======================
     Logout
  ======================= */

  const logout = () => {
    localStorage.removeItem("token");
    setCurrentUser(null);
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    registerUser,
    registrationLoading,
    registrationError,
    loginUser,
    signInWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/* =======================
 consume context
======================= */

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
