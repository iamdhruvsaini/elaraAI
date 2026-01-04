"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { BottomNav } from "@/components/common/BottomNav";

// Pages where bottom navigation should be hidden (onboarding/setup flows)
const HIDE_NAV_ROUTES = ["/face-analysis", "/allergy-setup"];

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { authChecked, isAuthenticated } = useAuth();

  // Check if current route should hide bottom navigation
  const shouldHideNav = HIDE_NAV_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  useEffect(() => {
    if (authChecked && !isAuthenticated) {
      router.replace("/login");
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

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={shouldHideNav ? "min-h-dvh" : "min-h-dvh pb-20"}>
      {children}
      {!shouldHideNav && <BottomNav />}
    </div>
  );
}
