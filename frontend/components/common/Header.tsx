"use client";

import React, { useState } from "react";
import {
  Menu,
  X,
  Home,
  Compass,
  Sparkles,
  User,
  LogIn,
  UserPlus,
  LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Types
interface NavLinkProps {
  href: string;
  icon: LucideIcon;
  children: React.ReactNode;
  onClick?: () => void;
}

// Mock authentication - replace with your actual auth
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  return { isAuthenticated, setIsAuthenticated };
};

const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg flex items-center justify-center bg-primary">
        <Sparkles className="h-5 w-5 text-primary-foreground" />
      </div>
      <span className="text-lg md:text-xl font-bold">
        <span className="text-primary">Elara&nbsp;</span>
        <span className="text-foreground">AI</span>
      </span>
    </Link>
  );
};

const NavLink: React.FC<NavLinkProps> = ({
  href,
  icon: Icon,
  children,
  onClick,
}) => {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50"
    >
      <Icon className="h-4 w-4" />
      <span>{children}</span>
    </Link>
  );
};

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, setIsAuthenticated } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-40 py-2 w-full border-b-2 border-border bg-background backdrop-blur">
        <div className="container mx-auto">
          <div className="flex h-14 md:h-16 items-center justify-between">
            <Logo />

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              <NavLink href="/" icon={Home}>
                Home
              </NavLink>
              <NavLink href="/how-it-works" icon={Compass}>
                How It Works
              </NavLink>
            </nav>

            {/* Desktop Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  <Button asChild>
                    <Link href="/plan">
                      <Sparkles className="h-4 w-4" />
                      Create Plan
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/profile">
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setIsAuthenticated(false)}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsAuthenticated(true)}
                  >
                    <LogIn className="h-4 w-4" />
                    Login
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link href="/signup">
                      <UserPlus className="h-4 w-4" />
                      Sign Up
                    </Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
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

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-border py-4">
              <nav className="flex flex-col gap-1 mb-4">
                <NavLink
                  href="/"
                  icon={Home}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </NavLink>
                <NavLink
                  href="/how-it-works"
                  icon={Compass}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  How It Works
                </NavLink>
              </nav>

              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                {isAuthenticated ? (
                  <>
                    <Button asChild className="w-full">
                      <Link href="/plan">
                        <Sparkles className="h-4 w-4" />
                        Create Plan
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full">
                      <Link href="/profile">
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        setIsAuthenticated(false);
                        setMobileMenuOpen(false);
                      }}
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setIsAuthenticated(true);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LogIn className="h-4 w-4" />
                      Login
                    </Button>
                    <Button variant="ghost" asChild className="w-full">
                      <Link href="/signup">
                        <UserPlus className="h-4 w-4" />
                        Sign Up
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        
      </header>
      <div className="h-20 md:h-30 fixed top-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm"></div>
    </>
  );
}
