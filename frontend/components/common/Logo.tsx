import Link from "next/link";
import { Sparkles } from "lucide-react";
/*
  Logo component that links to the homepage.
  Consists of an icon and the application name "Elara AI".
*/

export const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg flex items-center justify-center bg-primary">
        <Sparkles className="h-5 w-5 text-primary-foreground" />
      </div>
      <span className="text-lg md:text-xl font-bold">
        <span className="text-primary">Elara&nbsp;</span>
        <span className="text-foreground">AI</span>
      </span>
    </Link>
  );
};
