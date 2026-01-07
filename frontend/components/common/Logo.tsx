"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

/*
  Logo component that links to the homepage.
  When logged in, links to /home. When not logged in, links to /.
*/

export const Logo = () => {
  const { isAuthenticated } = useAuth();
  const href = isAuthenticated ? "/home" : "/";
  
  return (
    <Link href={href} className="flex items-center gap-2">
      <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-pink-500 to-purple-600 shadow-md">
        <Sparkles className="h-5 w-5 text-white" />
      </div>
      <span className="text-2xl md:text-xl font-bold">
        <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">Elara&nbsp;</span>
        <span className="text-slate-800">AI</span>
      </span>
    </Link>
  );
};
