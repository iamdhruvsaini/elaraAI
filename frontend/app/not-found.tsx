"use client";

import React from "react";
import { Home, ArrowLeft, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const NotFound: React.FC = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Decorative Icon */}
        <div className="relative mb-8">
          <div className="w-32 h-32 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center shadow-2xl shadow-purple-200">
            <span className="text-6xl font-bold text-white">404</span>
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          Page Not Found
        </h1>
        <p className="text-slate-500 text-base mb-8 max-w-xs">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Actions */}
        <div className="w-full max-w-xs space-y-3">
          <Button
            onClick={() => router.push("/")}
            className="w-full h-14 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-base rounded-2xl shadow-lg"
          >
            <Home className="w-5 h-5 mr-2" />
            Go to Home
          </Button>
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="w-full h-12 font-medium text-slate-700 rounded-xl border-slate-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>

        {/* Decorative Elements */}
        <div className="mt-12 flex items-center gap-2 text-slate-400">
          <div className="w-8 h-0.5 bg-slate-200 rounded-full" />
          <Sparkles className="w-4 h-4" />
          <div className="w-8 h-0.5 bg-slate-200 rounded-full" />
        </div>
        <p className="text-xs text-slate-400 mt-3">
          ElaraAI - Your Beauty Assistant
        </p>
      </div>
    </div>
  );
};

export default NotFound;
