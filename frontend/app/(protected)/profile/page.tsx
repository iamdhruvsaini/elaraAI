"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Bell,
  Moon,
  Globe,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Camera,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface MenuItem {
  icon: React.ElementType;
  label: string;
  description?: string;
  href?: string;
  action?: () => void;
  danger?: boolean;
  toggle?: boolean;
  badge?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser, logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: "Account",
      items: [
        {
          icon: User,
          label: "Edit Profile",
          description: "Update your personal information",
          href: "/profile/edit",
        },
        {
          icon: Shield,
          label: "Allergy Profile",
          description: "Manage ingredients to avoid",
          href: "/allergy-setup",
          badge: "3 allergens",
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          icon: Bell,
          label: "Notifications",
          description: "Manage notification settings",
          toggle: true,
        },
        {
          icon: Moon,
          label: "Dark Mode",
          description: "Toggle dark theme",
          toggle: true,
        },
        {
          icon: Globe,
          label: "Language",
          description: "English (US)",
          href: "/profile/language",
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          icon: HelpCircle,
          label: "Help & FAQ",
          href: "/help",
        },
      ],
    },
    {
      title: "",
      items: [
        {
          icon: LogOut,
          label: "Log Out",
          action: handleLogout,
          danger: true,
        },
      ],
    },
  ];

  return (
    <div className="min-h-dvh bg-background safe-top pb-24">
      {/* Profile Header */}
      <div className="px-6 py-8 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="flex flex-col items-center">
          {/* Avatar */}
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
              <span className="text-white text-3xl font-semibold">
                {currentUser?.full_name?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-card border-2 border-background flex items-center justify-center shadow-md">
              <Camera size={14} className="text-foreground-muted" />
            </button>
          </div>

          {/* Name & Email */}
          <h1 className="text-xl font-semibold text-foreground">
            {currentUser?.full_name || "User"}
          </h1>
          <p className="text-foreground-muted text-sm mt-1">
            {currentUser?.email}
          </p>

          {/* Stats */}
          <div className="flex gap-8 mt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {currentUser?.profile?.products_count || 0}
              </p>
              <p className="text-xs text-foreground-muted">Products</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                {currentUser?.profile?.total_sessions || 0}
              </p>
              <p className="text-xs text-foreground-muted">Sessions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="px-6 space-y-6">
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {section.title && (
              <h2 className="text-sm font-semibold text-foreground-muted mb-2">
                {section.title}
              </h2>
            )}
            <Card className="divide-y divide-border">
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                const content = (
                  <div
                    className={cn(
                      "flex items-center gap-4 p-4",
                      (item.href || item.action) &&
                        "cursor-pointer hover:bg-input/50 transition-colors"
                    )}
                    onClick={item.action}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        item.danger ? "bg-danger/10" : "bg-primary/10"
                      )}
                    >
                      <Icon
                        size={20}
                        className={item.danger ? "text-danger" : "text-primary"}
                      />
                    </div>
                    <div className="flex-1">
                      <p
                        className={cn(
                          "font-medium",
                          item.danger ? "text-danger" : "text-foreground"
                        )}
                      >
                        {item.label}
                      </p>
                      {item.description && (
                        <p className="text-sm text-foreground-muted">
                          {item.description}
                        </p>
                      )}
                    </div>
                    {item.badge && (
                      <Badge variant="secondary">{item.badge}</Badge>
                    )}
                    {item.toggle ? (
                      <div className="w-12 h-7 rounded-full bg-primary/20 relative">
                        <div className="absolute left-1 top-1 w-5 h-5 rounded-full bg-primary" />
                      </div>
                    ) : !item.action ? (
                      <ChevronRight
                        size={18}
                        className="text-foreground-muted"
                      />
                    ) : null}
                  </div>
                );

                if (item.href) {
                  return (
                    <a key={itemIndex} href={item.href}>
                      {content}
                    </a>
                  );
                }

                return <div key={itemIndex}>{content}</div>;
              })}
            </Card>
          </div>
        ))}

        {/* App Version */}
        <p className="text-center text-xs text-foreground-muted pt-4">
          GlamAI v1.0.0
        </p>
      </div>
    </div>
  );
}
