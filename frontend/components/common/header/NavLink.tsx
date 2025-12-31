import Link from "next/link";
import { LucideIcon } from "lucide-react";
import React from "react";

interface NavLinkProps {
  href: string;
  icon: LucideIcon;
  children: React.ReactNode;
  onClick?: () => void;
}

export const NavLink: React.FC<NavLinkProps> = ({
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
