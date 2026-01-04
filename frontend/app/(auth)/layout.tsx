"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { authChecked, isAuthenticated } = useAuth();

  useEffect(() => {
    // Redirect authenticated users away from auth pages
    if (authChecked && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [authChecked, isAuthenticated, router]);

  // Show loading while checking auth
  if (!authChecked) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-foreground-muted">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render auth pages if user is authenticated
  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
