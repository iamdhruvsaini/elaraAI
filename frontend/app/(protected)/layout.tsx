"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, authChecked } = useAuth();

  useEffect(() => {
    if (authChecked && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authChecked, isAuthenticated, router]);

  if (!authChecked) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  // ⛔ block unauthenticated
  if (!isAuthenticated) return null;

  return <>{children}</>;
}
