"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, Calendar, User, Camera, CalendarPlus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/vanity", icon: Package, label: "Vanity" },
  { href: "/events", icon: Calendar, label: "Events" },
  { href: "/profile", icon: User, label: "Profile" },
];

// Get FAB configuration based on current route
function getFABConfig(pathname: string) {
  if (pathname.startsWith("/vanity")) {
    return { icon: Camera, href: "/vanity/scan", label: "Scan Product" };
  }
  if (pathname.startsWith("/events")) {
    return { icon: CalendarPlus, href: "/events/new", label: "Add Event" };
  }
  return { icon: Sparkles, href: "/face-analysis", label: "Face Analysis" };
}

export function BottomNav() {
  const pathname = usePathname();
  const fabConfig = getFABConfig(pathname);
  const FabIcon = fabConfig.icon;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-bottom">
      <div className="max-w-[430px] mx-auto">
        <div className="flex items-center justify-around py-2 relative">
          {/* Left nav items */}
          {navItems.slice(0, 2).map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all",
                  isActive
                    ? "text-primary"
                    : "text-foreground-muted hover:text-foreground"
                )}
              >
                <item.icon
                  size={24}
                  className={cn(isActive && "fill-primary/20")}
                />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* Center FAB */}
          <Link
            href={fabConfig.href}
            aria-label={fabConfig.label}
            className="absolute left-1/2 -translate-x-1/2 -top-6"
          >
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-primary to-[#ff6b9d] flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 transition-transform">
                <FabIcon size={28} className="text-white" />
              </div>
            </div>
          </Link>

          {/* Spacer for FAB */}
          <div className="w-14" />

          {/* Right nav items */}
          {navItems.slice(2).map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all",
                  isActive
                    ? "text-primary"
                    : "text-foreground-muted hover:text-foreground"
                )}
              >
                <item.icon
                  size={24}
                  className={cn(isActive && "fill-primary/20")}
                />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
