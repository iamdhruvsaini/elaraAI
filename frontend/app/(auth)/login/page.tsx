"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Mail, Phone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { LogoDark } from "@/components/common/Logo";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { loginUser, loginLoading } = useAuth();

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await loginUser({ email, password });
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (error: unknown) {
      const err = error as { data?: { detail?: string } };
      toast.error(err?.data?.detail || "Login failed. Please try again.");
    }
  };

  const handleGoogleLogin = () => {
    toast("Google login coming soon!", { icon: "🚧" });
  };

  const handlePhoneLogin = () => {
    toast("Phone login coming soon!", { icon: "🚧" });
  };

  return (
    <div className="min-h-dvh flex flex-col bg-background px-6 py-8 safe-top">
      {/* Language Selector */}
      <div className="flex justify-end mb-8">
        <button className="text-sm text-foreground-muted px-3 py-1 rounded-lg border border-border">
          EN / हिं
        </button>
      </div>

      {/* Logo */}
      <div className="flex justify-center mb-8">
        <LogoDark size="md" />
      </div>

      {/* Welcome Text */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Welcome Back! 💄
        </h1>
        <p className="text-foreground-muted text-sm">
          Sign in to continue your beauty journey
        </p>
      </div>

      {showEmailForm ? (
        /* Email Login Form */
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={20} />}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            variant="gradient"
            fullWidth
            loading={loginLoading}
          >
            Sign In
            <ArrowRight size={18} />
          </Button>

          <button
            type="button"
            onClick={() => setShowEmailForm(false)}
            className="w-full text-center text-sm text-foreground-muted hover:text-foreground"
          >
            Back to options
          </button>
        </form>
      ) : (
        /* Login Options */
        <div className="space-y-4">
          {/* Google Login */}
          <Button
            variant="outline"
            fullWidth
            onClick={handleGoogleLogin}
            className="h-14"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          {/* Email Login */}
          <Button
            variant="outline"
            fullWidth
            onClick={() => setShowEmailForm(true)}
            className="h-14"
          >
            <Mail size={20} />
            Continue with Email
          </Button>

          {/* Phone Login */}
          <Button
            variant="outline"
            fullWidth
            onClick={handlePhoneLogin}
            className="h-14"
          >
            <Phone size={20} />
            Continue with Phone
          </Button>

          {/* Separator */}
          <div className="flex items-center gap-4 py-4">
            <Separator className="flex-1" />
            <span className="text-xs text-foreground-muted">OR</span>
            <Separator className="flex-1" />
          </div>

          {/* Skip */}
          <Link
            href="/onboarding"
            className="block text-center text-sm text-primary hover:underline"
          >
            Skip for Now
          </Link>
        </div>
      )}

      {/* Sign Up Link */}
      <div className="mt-8 text-center">
        <p className="text-sm text-foreground-muted">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary font-medium hover:underline">
            Sign Up
          </Link>
        </p>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-8 text-center">
        <p className="text-xs text-foreground-muted">
          By continuing, you agree to our{" "}
          <a href="#" className="text-primary hover:underline">
            Terms
          </a>{" "}
          &{" "}
          <a href="#" className="text-primary hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
