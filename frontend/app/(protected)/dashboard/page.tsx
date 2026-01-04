"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  Calendar,
  Package,
  Lightbulb,
  Bell,
  Globe,
  ChevronRight,
  Check,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useGetDashboardQuery } from "@/redux/services/profileService";
import { useGetUpcomingEventsQuery } from "@/redux/services/eventsService";
import { cn } from "@/lib/utils";

const quickActions = [
  {
    href: "/face-analysis",
    icon: "💄",
    label: "Start Makeup Now",
    color: "bg-primary/10",
  },
  {
    href: "/events/new",
    icon: "📅",
    label: "Schedule Event",
    color: "bg-secondary/10",
  },
  {
    href: "/vanity",
    icon: "🛍️",
    label: "My Vanity",
    color: "bg-warning/10",
  },
  {
    href: "/profile",
    icon: "💡",
    label: "Tips & Trends",
    color: "bg-info/10",
  },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function getGreetingEmoji(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "☀️";
  if (hour < 17) return "🌤️";
  return "🌙";
}

export default function DashboardPage() {
  const { currentUser } = useAuth();
  const { data: dashboardData } = useGetDashboardQuery();
  const { data: upcomingEvents } = useGetUpcomingEventsQuery({ days: 30 });

  const userName = currentUser?.full_name?.split(" ")[0] || "Beautiful";
  const nextEvent = upcomingEvents?.[0];

  return (
    <div className="min-h-dvh bg-background safe-top">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-xl">
              brush
            </span>
          </div>
          <span className="font-serif text-xl font-medium text-foreground">
            GlamAI
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-input transition-colors">
            <Globe size={20} className="text-foreground-muted" />
          </button>
          <button className="p-2 rounded-full hover:bg-input transition-colors relative">
            <Bell size={20} className="text-foreground-muted" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          </button>
          <Link
            href="/profile"
            className="w-9 h-9 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center"
          >
            <span className="text-white text-sm font-medium">
              {userName.charAt(0).toUpperCase()}
            </span>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 space-y-6 pb-6">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {getGreeting()}, {userName}! {getGreetingEmoji()}
          </h1>
        </div>

        {/* Upcoming Event Card */}
        {nextEvent && (
          <Card className="bg-gradient-to-r from-primary to-secondary p-5 text-white border-0">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg mb-1">
                  {nextEvent.event_name}
                </h3>
                <p className="text-white/80 text-sm">
                  {new Date(nextEvent.event_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <Badge variant="outline" className="border-white/30 text-white bg-white/10">
                {new Date(nextEvent.event_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </Badge>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <Check size={16} className="text-green-300" />
                <span className="text-white/90">Makeup Ready</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle size={16} className="text-yellow-300" />
                <span className="text-white/90">Products Ready</span>
                <Badge className="bg-yellow-500/20 text-yellow-100 text-xs ml-1">
                  2 missing
                </Badge>
              </div>
            </div>

            <Button
              variant="outline"
              className="bg-white/20 border-white/30 text-white hover:bg-white/30 w-full"
            >
              Prepare Now
              <ChevronRight size={18} />
            </Button>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-2xl transition-all hover:shadow-md",
                action.color
              )}
            >
              <span className="text-3xl">{action.icon}</span>
              <span className="text-sm font-medium text-foreground text-center">
                {action.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Activity Stats */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Your Activity <span className="text-foreground-muted font-normal text-sm">This Week</span>
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4 text-center">
              <span className="text-2xl mb-1">🎨</span>
              <p className="text-xl font-semibold text-foreground">
                {dashboardData?.stats?.completed_sessions || 0}
              </p>
              <p className="text-xs text-foreground-muted">Looks Created</p>
            </Card>
            <Card className="p-4 text-center">
              <span className="text-2xl mb-1">⭐</span>
              <p className="text-xl font-semibold text-foreground">5.0</p>
              <p className="text-xs text-foreground-muted">Avg Rating</p>
            </Card>
            <Card className="p-4 text-center">
              <span className="text-2xl mb-1">📈</span>
              <p className="text-xl font-semibold text-success">+15%</p>
              <p className="text-xs text-foreground-muted">Skin Improving</p>
            </Card>
          </div>
        </div>

        {/* Recent Looks */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">Recent Looks</h2>
            <Link
              href="/gallery"
              className="text-sm text-primary hover:underline"
            >
              See All
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-6 px-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex-shrink-0 w-32 h-40 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 relative overflow-hidden"
              >
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="default" className="text-xs">
                      <Sparkles size={12} className="mr-1" />
                      {12 + i}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
