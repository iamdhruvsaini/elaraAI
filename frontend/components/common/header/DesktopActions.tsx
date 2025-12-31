import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, User, LogIn, UserPlus } from "lucide-react";

interface Props {
  isAuthenticated: boolean;
  onLogout: () => void;
  onLogin: () => void;
}

export const DesktopActions = ({
  isAuthenticated,
  onLogout,
  onLogin,
}: Props) => {
  return (
    <div className="hidden lg:flex items-center gap-3">
      {isAuthenticated ? (
        <>
          <Button asChild>
            <Link href="/plan">
              <Sparkles className="h-4 w-4" />
              Create Plan
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/profile">
              <User className="h-4 w-4" />
              Profile
            </Link>
          </Button>
          <Button variant="ghost" onClick={onLogout}>
            Logout
          </Button>
        </>
      ) : (
        <>
          <Button variant="outline" onClick={onLogin}>
            <LogIn className="h-4 w-4" />
            Login
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/signup">
              <UserPlus className="h-4 w-4" />
              Sign Up
            </Link>
          </Button>
        </>
      )}
    </div>
  );
};
