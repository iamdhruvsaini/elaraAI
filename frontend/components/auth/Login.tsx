"use client";

import { useAuth } from "@/context/AuthContext";
import React, { useState, FormEvent, useEffect } from "react";
import { showToast } from "../toast/toast";
import { useRouter } from "next/navigation";
import { Sparkles, Mail, Lock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useGoogleLogin } from "@react-oauth/google";
import GoogleAuthLoader, { LOADING_MESSAGES } from "./GoogleAuthLoader";
import GoogleIcon from "./GoogleIcon";

export default function Login() {
  const { loginUser, loginLoading, loginError, signInWithGoogle, googleLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleAuthenticating, setIsGoogleAuthenticating] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const router = useRouter();

  // Cycle through loading messages
  useEffect(() => {
    if (!isGoogleAuthenticating) {
      setLoadingMessageIndex(0);
      return;
    }
    
    const interval = setInterval(() => {
      setLoadingMessageIndex((prev) => 
        prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev
      );
    }, 1200);

    return () => clearInterval(interval);
  }, [isGoogleAuthenticating]);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsGoogleAuthenticating(true);
        setLoadingMessageIndex(1); // "Verifying your account..."
        
        // Fetch user info from Google using the access token
        const userInfoResponse = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          }
        );
        const userInfo = await userInfoResponse.json();
        
        setLoadingMessageIndex(2); // "Fetching your profile..."

        await signInWithGoogle({
          google_id: userInfo.sub,
          email: userInfo.email,
          full_name: userInfo.name,
        });

        setLoadingMessageIndex(3); // "Setting up your session..."
        router.replace("/home");
        showToast("Login Success", "success", "bottom-right");
      } catch (error) {
        showToast("Google Login Failed", "error", "bottom-right");
      } finally {
        setIsGoogleAuthenticating(false);
      }
    },
    onError: () => {
      setIsGoogleAuthenticating(false);
      showToast("Google Login Failed", "error", "bottom-right");
    },
  });

  const handleGoogleClick = () => {
    setIsGoogleAuthenticating(true);
    setLoadingMessageIndex(0); // "Connecting to Google..."
    googleLogin();
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const formData = { email, password };
    
    if (!email || !password) {
      showToast("Missing Fields", "error", "bottom-right");
      return;
    }

    try {
      await loginUser(formData);
      router.replace("/home");
      showToast("Login Success", "success", "bottom-right");
    } catch (error) {
      showToast("Login Failed", "error", "bottom-right");
    }
  }

  // Show full-screen loader during Google auth
  if (isGoogleAuthenticating || googleLoading) {
    return <GoogleAuthLoader messageIndex={loadingMessageIndex} />;
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center py-6">
      <div className="w-full max-w-[440px] mx-auto px-1">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-200">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome Back!</h1>
          <p className="text-slate-500 mt-1">Sign in to continue your beauty journey</p>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl shadow-purple-100/50">
          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleClick}
            className="w-full flex items-center gap-3 justify-center h-12 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-medium border border-slate-200 transition-colors"
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="px-4 text-sm text-slate-400">or continue with email</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 rounded-xl border border-slate-200 bg-white/80 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-pink-400 transition-all"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-11 pr-12 rounded-xl border border-slate-200 bg-white/80 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-pink-400 transition-all"
                  placeholder="Your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full h-12 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
            >
              {loginLoading ? "Signing in..." : "Sign In"}
            </button>

            {!!loginError && (
              <p className="text-sm text-red-500 text-center bg-red-50 p-3 rounded-xl">
                Login failed. Please check your credentials.
              </p>
            )}
          </form>

          {/* Footer */}
          <p className="text-center text-slate-500 mt-6">
            Don't have an account?{" "}
            <Link href="/signup" className="text-pink-600 font-semibold hover:text-pink-700">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}