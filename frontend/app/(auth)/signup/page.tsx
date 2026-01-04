"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, User, Mail, ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: "Weak", color: "bg-danger" };
  if (score <= 3) return { score, label: "Fair", color: "bg-warning" };
  if (score <= 4) return { score, label: "Good", color: "bg-info" };
  return { score, label: "Strong", color: "bg-success" };
}

const passwordRequirements = [
  { label: "At least 8 characters", check: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", check: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", check: (p: string) => /[a-z]/.test(p) },
  { label: "One number", check: (p: string) => /[0-9]/.test(p) },
];

export default function SignupPage() {
  const router = useRouter();
  const { registerUser, registrationLoading } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showRequirements, setShowRequirements] = useState(false);

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      await registerUser({ full_name: fullName, email, password });
      toast.success("Account created successfully!");
      router.push("/onboarding");
    } catch (error: unknown) {
      const err = error as { data?: { detail?: string } };
      toast.error(err?.data?.detail || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-background px-6 py-8 safe-top">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-input transition-colors"
        >
          <ArrowLeft size={24} className="text-foreground" />
        </button>
        <h1 className="text-xl font-semibold text-foreground">Sign Up</h1>
      </div>

      {/* Welcome Text */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Let&apos;s Get to Know You! ✨
        </h2>
        <p className="text-foreground-muted text-sm">
          Create an account to get personalized recommendations
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5 flex-1">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            icon={<User size={20} />}
          />
        </div>

        {/* Email */}
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

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setShowRequirements(true)}
          />

          {/* Password Strength Indicator */}
          {password && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-input rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      passwordStrength.color
                    )}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
                <span
                  className={cn(
                    "text-xs font-medium",
                    passwordStrength.score <= 2 && "text-danger",
                    passwordStrength.score === 3 && "text-warning",
                    passwordStrength.score === 4 && "text-info",
                    passwordStrength.score === 5 && "text-success"
                  )}
                >
                  {passwordStrength.label}
                </span>
              </div>
            </div>
          )}

          {/* Password Requirements */}
          {showRequirements && (
            <div className="space-y-1.5 pt-2">
              {passwordRequirements.map((req, index) => {
                const passed = req.check(password);
                return (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-2 text-xs transition-colors",
                      passed ? "text-success" : "text-foreground-muted"
                    )}
                  >
                    {passed ? (
                      <Check size={14} />
                    ) : (
                      <X size={14} className="opacity-50" />
                    )}
                    {req.label}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="gradient"
          fullWidth
          loading={registrationLoading}
          className="mt-8"
        >
          Create Account
          <ArrowRight size={18} />
        </Button>
      </form>

      {/* Login Link */}
      <div className="mt-8 text-center">
        <p className="text-sm text-foreground-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
