import { Home, Compass, Sparkles, User, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NavLink } from "./NavLink";

interface Props {
  isAuthenticated: boolean;
  closeMenu: () => void;
  onLogin: () => void;
  onLogout: () => void;
}

export const MobileMenu = ({
  isAuthenticated,
  closeMenu,
  onLogin,
  onLogout,
}: Props) => {
  return (
    <div className="lg:hidden border-t border-border py-4">
      <nav className="flex flex-col gap-1 mb-4">
        <NavLink href="/" icon={Home} onClick={closeMenu}>
          Home
        </NavLink>
        <NavLink href="/how-it-works" icon={Compass} onClick={closeMenu}>
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
                onLogout();
                closeMenu();
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
                onLogin();
                closeMenu();
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
  );
};
