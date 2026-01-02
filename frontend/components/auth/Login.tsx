"use client";

import { useAuth } from "@/context/AuthContext";
import React, { useState, FormEvent } from "react";
import { showToast } from "../toast/toast";
import { useRouter } from "next/navigation";



function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 48 48" fill="none" aria-hidden>
      <path d="M44.5 20H24v8.5h11.7C34.2 32 30 35 24 35c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.6 0 6.9 1.4 9.3 3.8l6.3-6.3C36.7 3.7 30.7 1.5 24 1.5 11.1 1.5 1.5 11.1 1.5 24S11.1 46.5 24 46.5 46.5 36.9 46.5 24c0-1.6-.2-3.1-.5-4.5z" fill="#fff" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 6.5v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 6.5l-9 7-9-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M22 16.92V20a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07A19.5 19.5 0 0 1 3.07 7.81 19.86 19.86 0 0 1 0 0.82 2 2 0 0 1 2 0h3.09a2 2 0 0 1 2 1.72c.12 1.02.44 2 .95 2.89a2 2 0 0 1-.45 2.02L6 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function Login() {
  const { loginUser,loginLoading,loginError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router=useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const formData={
      email,
      password
    }
    if(!email || !password){
      showToast("Missing Fields","error","bottom-right");
      return;
    }

    try{
      await loginUser(formData);
      router.replace("/");
      showToast("Login Success","success","bottom-right");

    }catch (error) {
      showToast("Login Failed","error","bottom-right");
    }
   
  }

  return (
    <div className="min-h-screen flex items-start justify-center py-8 md:px-4 text-foreground">
      <div className="w-full max-w-md">
        <div className="bg-white text-card-foreground rounded-lg p-6 shadow-md border border-border">
          <h1 className="text-2xl font-semibold text-center">Welcome Back!</h1>
          <p className="text-sm text-muted-foreground text-center mt-2 mb-4">Sign in to continue</p>

          <div className="space-y-3">
            <button
              type="button"
              className="w-full flex items-center gap-3 justify-center rounded-md py-3 px-4 bg-primary text-white border border-border btn-focus-custom"
            >
              <GoogleIcon /> <span className="font-medium">Continue with Google</span>
            </button>

          </div>

          <div className="my-4 flex items-center">
            <div className="flex-1 h-px bg-border" />
            <span className="px-3 text-sm text-muted-foreground">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block">
              <span className="text-sm">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-foreground"
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
                className="mt-1 block w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-foreground"
                placeholder="Your password"
                autoComplete="current-password"
              />
            </label>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full rounded-md bg-primary text-primary-foreground py-2 mt-1 btn-focus-custom"
            >
              {loginLoading ? "Signing in..." : "Sign in"}
            </button>

            {!!loginError && (
              <p className="text-sm text-red-600 mt-2">
                Login failed. Please check your credentials and try again.
              </p>
            )}
          </form>

        </div>
      </div>
    </div>
  );
}