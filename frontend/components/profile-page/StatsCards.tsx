"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, TrendingUp, User } from "lucide-react";

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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <Card className="shadow-md border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Makeup Sessions</p>
              <p className="text-3xl font-bold mt-1">{totalSessions}</p>
            </div>
            <Sparkles className="w-12 h-12 text-purple-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md border-0 bg-gradient-to-br from-pink-500 to-pink-600 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100 text-sm">Products in Vanity</p>
              <p className="text-3xl font-bold mt-1">{productsInVanity}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-pink-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md border-0 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm">Upcoming Events</p>
              <p className="text-3xl font-bold mt-1">{upcomingEvents}</p>
            </div>
            <User className="w-12 h-12 text-indigo-200" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
