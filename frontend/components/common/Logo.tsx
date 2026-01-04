"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-32 h-32",
};

const textSizeClasses = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-3xl",
  xl: "text-5xl",
};

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {/* Logo Icon */}
      <div
        className={cn(
          "relative flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-full border border-white/20 shadow-2xl",
          sizeClasses[size]
        )}
      >
        <span
          className={cn(
            "material-symbols-outlined text-white drop-shadow-md",
            size === "sm" && "text-xl",
            size === "md" && "text-3xl",
            size === "lg" && "text-4xl",
            size === "xl" && "text-6xl"
          )}
        >
          brush
        </span>
      </div>

      {/* App Name */}
      {showText && (
        <h1
          className={cn(
            "font-serif font-medium tracking-tight text-white drop-shadow-sm",
            textSizeClasses[size]
          )}
        >
          GlamAI
        </h1>
      )}
    </div>
  );
}

export function LogoDark({
  size = "md",
  showText = true,
  className,
}: LogoProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {/* Logo Icon */}
      <div
        className={cn(
          "relative flex items-center justify-center bg-primary/10 rounded-full border border-primary/20 shadow-lg",
          sizeClasses[size]
        )}
      >
        <span
          className={cn(
            "material-symbols-outlined text-primary drop-shadow-md",
            size === "sm" && "text-xl",
            size === "md" && "text-3xl",
            size === "lg" && "text-4xl",
            size === "xl" && "text-6xl"
          )}
        >
          brush
        </span>
      </div>

      {/* App Name */}
      {showText && (
        <h1
          className={cn(
            "font-serif font-medium tracking-tight text-foreground",
            textSizeClasses[size]
          )}
        >
          GlamAI
        </h1>
      )}
    </div>
  );
}
