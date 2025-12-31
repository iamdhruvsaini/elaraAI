"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DesktopNav } from "./DesktopNav";
import { DesktopActions } from "./DesktopActions";
import { MobileMenu } from "./MobileMenu";
import { Logo } from "../Logo";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b-2 border-border bg-background backdrop-blur">
        <div className="container mx-auto">
          <div className="flex h-14 md:h-16 items-center justify-between">
            <Logo />

            <DesktopNav />

            <DesktopActions
              isAuthenticated={isAuthenticated}
              onLogin={() => setIsAuthenticated(true)}
              onLogout={() => setIsAuthenticated(false)}
            />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>

          {mobileMenuOpen && (
            <MobileMenu
              isAuthenticated={isAuthenticated}
              closeMenu={() => setMobileMenuOpen(false)}
              onLogin={() => setIsAuthenticated(true)}
              onLogout={() => setIsAuthenticated(false)}
            />
          )}
        </div>
      </header>

      <div className="h-20 md:h-30 fixed top-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm" />
    </>
  );
}
