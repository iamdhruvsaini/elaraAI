"use client";

import { Sparkles, Package, Calendar } from "lucide-react";

interface StatsCardsProps {
  totalSessions: number;
  productsInVanity: number;
  upcomingEvents: number;
}

export const StatsCards = ({
  totalSessions,
  productsInVanity,
  upcomingEvents,
}: StatsCardsProps) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl p-3 text-white shadow-lg shadow-purple-200">
        <Sparkles className="w-6 h-6 text-white/80 mb-2" />
        <p className="text-2xl font-bold">{totalSessions}</p>
        <p className="text-xs text-white/80">Sessions</p>
      </div>

      <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-3 text-white shadow-lg shadow-purple-200">
        <Package className="w-6 h-6 text-white/80 mb-2" />
        <p className="text-2xl font-bold">{productsInVanity}</p>
        <p className="text-xs text-white/80">Products</p>
      </div>

      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-3 text-white shadow-lg shadow-indigo-200">
        <Calendar className="w-6 h-6 text-white/80 mb-2" />
        <p className="text-2xl font-bold">{upcomingEvents}</p>
        <p className="text-xs text-white/80">Events</p>
      </div>
    </div>
  );
};
