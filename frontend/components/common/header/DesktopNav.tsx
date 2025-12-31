import { Home, Compass } from "lucide-react";
import { NavLink } from "./NavLink";

export const DesktopNav = () => {
  return (
    <nav className="hidden lg:flex items-center gap-1">
      <NavLink href="/" icon={Home}>
        Home
      </NavLink>
      <NavLink href="/how-it-works" icon={Compass}>
        How It Works
      </NavLink>
    </nav>
  );
};
