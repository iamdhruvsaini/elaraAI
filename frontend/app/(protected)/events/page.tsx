"use client";

import React from "react";
import Link from "next/link";
import { Plus, Calendar, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGetUpcomingEventsQuery } from "@/redux/services/eventsService";

export default function EventsPage() {
  const { data: events, isLoading } = useGetUpcomingEventsQuery({ days: 90 });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString("en-US", { month: "short" }),
      weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
    };
  };

  return (
    <div className="min-h-dvh bg-background safe-top">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <h1 className="text-xl font-semibold text-foreground">
          📅 My Events
        </h1>
      </div>

      {/* Content */}
      <div className="px-6 py-4 pb-24 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !events || events.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No upcoming events
            </h3>
            <p className="text-foreground-muted text-sm mb-6">
              Schedule an event to get makeup-ready reminders
            </p>
            <Link href="/events/new">
              <Button variant="gradient">Create Event</Button>
            </Link>
          </div>
        ) : (
          events.map((event) => {
            const date = formatDate(event.event_date);
            return (
              <Card key={event.id} className="p-4 flex gap-4">
                {/* Date Badge */}
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-xs text-foreground-muted">
                    {date.month}
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {date.day}
                  </span>
                </div>

                {/* Event Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {event.event_name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-foreground-muted">
                    <Clock size={14} />
                    <span>{event.event_time}</span>
                  </div>
                  <Badge variant="secondary" className="mt-2 capitalize">
                    {event.occasion.toLowerCase().replace("_", " ")}
                  </Badge>
                </div>

                {/* Action */}
                <button className="self-center text-foreground-muted hover:text-foreground">
                  <ChevronRight size={20} />
                </button>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
