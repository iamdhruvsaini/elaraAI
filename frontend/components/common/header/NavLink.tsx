import Link from "next/link";
import { LucideIcon } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  icon: LucideIcon;
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "desktop" | "mobile";
}

export const NavLink: React.FC<NavLinkProps> = ({
  href,
  icon: Icon,
  children,
  onClick,
  variant = "desktop",
}) => {
  const isMobile = variant === "mobile";

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 font-medium transition-all rounded-lg group",
        isMobile
          ? // Mobile-first: Large touch targets (min 48x48px), bigger icons, bold text
            "min-h-[48px] px-4 py-3 text-base text-foreground hover:bg-accent active:bg-accent/80"
          : // Desktop: Compact design
            "px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
    >
      <Icon
        className={cn(
          "flex-shrink-0 transition-transform group-hover:scale-110",
          isMobile ? "h-6 w-6" : "h-5 w-5"
        )}
      />
      <span className={cn(isMobile && "font-semibold")}>{children}</span>
    </Link>
  );
};
