"use client";

import { useState } from "react";
import { DesktopNav } from "./DesktopNav";
import { DesktopActions } from "./DesktopActions";
import { MobileMenu } from "./MobileMenu";
import { Logo } from "../Logo";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function Header() {
  const { isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <header className="sticky bg-white top-0 z-40 w-full backdrop-blur">
      <div className="container mx-auto">
        <div className="flex h-14 md:h-16 items-center justify-between">
          <Logo />

          <DesktopNav />

          <DesktopActions
            isAuthenticated={isAuthenticated}
            onLogin={() => router.push("/login")}
            onLogout={() => logout()}
          />

          <MobileMenu
            isAuthenticated={isAuthenticated}
            open={mobileMenuOpen}
            onOpenChange={setMobileMenuOpen}
            onLogin={() => router.push("/login")}
            onLogout={() => logout()}
          />
        </div>
      </div>
    </header>
  );
}
