"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";

const features = [
  {
    title: "Face Analysis",
    description: "Get personalized skin analysis and product recommendations",
    image: "/images/face-analysis.png",
    fallbackIcon: "✨",
  },
  {
    title: "Build Your Vanity",
    description: "Curate and organize your makeup collection",
    image: "/images/vanity.png",
    fallbackIcon: "💄",
  },
  {
    title: "Get Glowing!",
    description: "Discover tips, trends, and exclusive offers",
    image: "/images/glowing.png",
    fallbackIcon: "🌟",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { currentUser } = useAuth();

  const userName = currentUser?.full_name?.split(" ")[0] || "Beautiful";

  const handleStart = () => {
    router.push("/allergy-setup");
  };

  return (
    <div className="min-h-dvh flex flex-col bg-background px-6 py-8 safe-top">
      {/* Welcome Text */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Welcome, {userName}! 🎉
        </h1>
        <p className="text-foreground-muted text-sm">
          Let&apos;s set up your personalized beauty experience
        </p>
      </div>

      {/* Feature Cards */}
      <div className="flex-1 space-y-4">
        {features.map((feature, index) => (
          <Card
            key={index}
            className="flex items-center gap-4 p-4 hover:shadow-md transition-shadow"
          >
            <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {feature.image ? (
                <Image
                  src={feature.image}
                  alt={feature.title}
                  width={80}
                  height={80}
                  className="object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextElementSibling?.classList.remove("hidden");
                  }}
                />
              ) : null}
              <span className={`text-4xl ${feature.image ? "hidden" : ""}`}>
                {feature.fallbackIcon}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">
                {feature.title}
              </h3>
              <p className="text-sm text-foreground-muted">
                {feature.description}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 space-y-4">
        <Button variant="gradient" fullWidth onClick={handleStart}>
          Let&apos;s Start!
          <ArrowRight size={18} />
        </Button>

        <Link
          href="/dashboard"
          className="block text-center text-sm text-foreground-muted hover:text-foreground"
        >
          Skip Setup
        </Link>
      </div>
    </div>
  );
}
