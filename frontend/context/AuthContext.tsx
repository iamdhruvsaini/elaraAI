"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  useLoginUserMutation,
  useRegisterUserMutation,
  useLazyGetMeQuery,
} from "@/redux/services/authentication/authService";
import type {
  LoginUserRequest,
  RegisterUserRequest,
  RegisterUserResponse,
  LoginUserResponse,
  MeResponse,
} from "@/redux/services/authentication/types";
import { AuthContextType } from "@/lib/types/authContext-types";

/* =======================
   Helpers
======================= */

const isTokenValid = (token: string) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

/* =======================
   Context
======================= */

const AuthContext = createContext<AuthContextType | null>(null);

/* =======================
   Provider
======================= */

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<MeResponse | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const [
    registerUserMutation,
    { isLoading: registrationLoading, error: registrationError },
  ] = useRegisterUserMutation();

  const [loginUserMutation, { isLoading: loginLoading, error: loginError }] =
    useLoginUserMutation();

  const [getMe] = useLazyGetMeQuery();

  /* =======================
     Helpers
  ======================= */

  const saveTokens = (data: RegisterUserResponse | LoginUserResponse) => {
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
  };

  const clearAuth = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  /* =======================
     Register
  ======================= */

  const registerUser = async (
    user: Omit<RegisterUserRequest, "auth_provider">
  ) => {
    const response = await registerUserMutation({
      ...user,
      auth_provider: "email",
    }).unwrap();

    if (!response) return response;

    saveTokens(response);
    setIsAuthenticated(true);

    // background fetch
    getMe()
      .unwrap()
      .then((me) => setCurrentUser(me))
      .catch(() => clearAuth());

    return response;
  };

  /* =======================
     Login
  ======================= */

  const loginUser = async (user: LoginUserRequest) => {
    const response = await loginUserMutation(user).unwrap();
    if (!response) return response;

    saveTokens(response);
    setIsAuthenticated(true);

    // background fetch
    getMe()
      .unwrap()
      .then((me) => setCurrentUser(me))
      .catch(() => clearAuth());

    return response;
  };

  /* =======================
     Restore session (FAST)
  ======================= */

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    // 🚀 instant auth decision
    if (!token || !isTokenValid(token)) {
      setAuthChecked(true);
      return;
    }

    setIsAuthenticated(true);
    setAuthChecked(true);

    // 🧵 fetch user in background
    getMe()
      .unwrap()
      .then((me) => setCurrentUser(me))
      .catch(() => clearAuth());
  }, []);

  /* =======================
     Logout
  ======================= */

  const logout = () => {
    clearAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        authChecked,

        registerUser,
        registrationLoading,
        registrationError,

        loginUser,
        loginLoading,
        loginError,

        signInWithGoogle: async () => {},
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* =======================
   Hook
======================= */

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
