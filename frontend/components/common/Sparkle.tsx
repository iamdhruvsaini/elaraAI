"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SparkleProps {
  className?: string;
  size?: number;
  delay?: number;
}

export function Sparkle({ className, size = 24, delay = 0 }: SparkleProps) {
  return (
    <svg
      className={cn("animate-twinkle text-yellow-100", className)}
      style={{ animationDelay: `${delay}s` }}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
    </svg>
  );
}

export function SparkleGroup() {
  return (
    <>
      <Sparkle
        className="absolute -top-2 -right-2"
        size={32}
        delay={0}
      />
      <Sparkle
        className="absolute bottom-0 -left-4 text-white/80"
        size={24}
        delay={0.5}
      />
      <Sparkle
        className="absolute top-2 -left-2 text-white/60"
        size={16}
        delay={1}
      />
    </>
  );
}
