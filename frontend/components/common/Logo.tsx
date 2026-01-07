"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { SparklesText } from "@/components/ui/sparkles-text";

/*
  Logo component that links to the homepage.
  When logged in, links to /home. When not logged in, links to /.
*/

export const Logo = () => {
  const { isAuthenticated } = useAuth();
  const href = isAuthenticated ? "/home" : "/";
  
  return (
    <Link href={href} className="flex items-center gap-2">
      <SparklesText
        className="text-2xl md:text-3xl font-bold font-agrandir"
        colors={{ first: "#ec4899", second: "#9333ea" }}
        sparklesCount={4}
      >
        <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">Elara</span>
        <span className="text-black font-inherit">AI</span>
      </SparklesText>
    </Link>
  );
};
