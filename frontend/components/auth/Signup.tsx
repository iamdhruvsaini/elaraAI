"use client";

import React, { useState, FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { showToast } from "../toast/toast";
import { useRouter } from "next/navigation";


export default function Signup() {
  const { registerUser, registrationLoading, registrationError } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // frontend-only validation
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    try {
      const data=await registerUser({
        full_name: fullName,
        email,
        password
      });
      router.replace("/");
      showToast("Registration successful!", "success","bottom-right");
    } catch (err: any) {
      setError("Registration failed");
      showToast("Registration failed", "error", "bottom-right");
    }
  }

  return (
    <div className="flex items-start justify-center py-8 text-foreground">
      <div className="w-full max-w-md">
        <div className="bg-white text-card-foreground rounded-lg py-6 px-4 shadow-md border border-border">
          <div className="text-center">
            <h1 className="text-xl font-semibold">Let's Get to Know You</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create an account to get started
            </p>
          </div>

          <div className="mt-4 space-y-3">
            <button
              type="button"
              className="w-full flex items-center gap-3 justify-center rounded-md py-3 px-4 bg-primary text-white border border-border btn-focus-custom"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 48 48"
                fill="none"
                aria-hidden
              >
                <path
                  d="M44.5 20H24v8.5h11.7C34.2 32 30 35 24 35c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.6 0 6.9 1.4 9.3 3.8l6.3-6.3C36.7 3.7 30.7 1.5 24 1.5 11.1 1.5 1.5 11.1 1.5 24S11.1 46.5 24 46.5 46.5 36.9 46.5 24c0-1.6-.2-3.1-.5-4.5z"
                  fill="#fff"
                />
              </svg>
              <span className="font-medium">Continue with Google</span>
            </button>

            <div className="my-2 flex items-center">
              <div className="flex-1 h-px bg-border" />
              <span className="px-3 text-sm text-muted-foreground">OR</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block">
                <span className="text-sm">Full Name</span>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 block w-full text-black rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-foreground"
                  placeholder="Full name"
                  autoComplete="name"
                />
              </label>

              <label className="block">
                <span className="text-sm">Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full text-black rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-foreground"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </label>

              <label className="block">
                <span className="text-sm">Password</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full text-black rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-foreground"
                  placeholder="Create a password"
                  autoComplete="new-password"
                />
              </label>

              <label className="block">
                <span className="text-sm">Confirm Password</span>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="mt-1 block w-full text-black rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-foreground"
                  placeholder="Confirm password"
                  autoComplete="new-password"
                />
              </label>
              

              <button
                type="submit"
                disabled={registrationLoading}
                className="w-full rounded-md bg-primary text-white py-2 mt-1 btn-focus-custom"
              >
                {registrationLoading
                  ? "Creating account..."
                  : "Create account"}
              </button>
              {error && (
                <p className="text-sm text-red-600 mt-2 text-center">{error}</p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
