import {
  Home,
  Compass,
  Sparkles,
  User,
  LogIn,
  UserPlus,
  PersonStanding,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { NavLink } from "./NavLink";

interface Props {
  isAuthenticated: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: () => void;
  onLogout: () => void;
}

export const MobileMenu = ({
  isAuthenticated,
  open,
  onOpenChange,
  onLogin,
  onLogout,
}: Props) => {
  const closeMenu = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden min-h-[44px] min-w-[44px]"
          aria-label="Toggle mobile menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-[85vw] max-w-[400px] flex flex-col p-0"
      >
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="text-left text-xl font-bold">Menu</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Main Navigation Section */}
          <nav className="px-3 py-4">
            <p className="px-4 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Navigation
            </p>
            <div className="space-y-1">
              <NavLink
                href="/home"
                icon={Home}
                onClick={closeMenu}
                variant="mobile"
              >
                Home
              </NavLink>
              <NavLink
                href="/profile"
                icon={PersonStanding}
                onClick={closeMenu}
                variant="mobile"
              >
                Profile
              </NavLink>
              <NavLink
                href="/how-it-works"
                icon={Compass}
                onClick={closeMenu}
                variant="mobile"
              >
                How It Works
              </NavLink>
            </div>
          </nav>

          <Separator className="my-2" />

          {/* Actions Section */}
          <div className="px-6 py-4 space-y-3">
            <p className="pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Quick Actions
            </p>
            {isAuthenticated ? (
              <>
                <Button
                  asChild
                  className="w-full min-h-[48px] text-base font-semibold"
                  size="lg"
                >
                  <Link href="/plan" onClick={closeMenu}>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Create Plan
                  </Link>
                </Button>
                <Button
                  variant="secondary"
                  asChild
                  className="w-full min-h-[48px] text-base"
                  size="lg"
                >
                  <Link href="/profile" onClick={closeMenu}>
                    <User className="h-5 w-5 mr-2" />
                    My Profile
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  className="w-full min-h-[48px] text-base text-destructive hover:text-destructive hover:bg-destructive/10"
                  size="lg"
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
                  className="w-full min-h-[48px] text-base font-semibold"
                  size="lg"
                  onClick={() => {
                    onLogin();
                    closeMenu();
                  }}
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  Login
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="w-full min-h-[48px] text-base"
                  size="lg"
                >
                  <Link href="/signup" onClick={closeMenu}>
                    <UserPlus className="h-5 w-5 mr-2" />
                    Sign Up
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
