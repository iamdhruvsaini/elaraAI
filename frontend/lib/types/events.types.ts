export type EventOccasion =
  | "DAILY"
  | "OFFICE"
  | "PARTY"
  | "WEDDING"
  | "FESTIVE"
  | "DATE_NIGHT"
  | "PHOTOSHOOT";

export interface ScheduledEvent {
  id: string;
  user_id: string;
  event_name: string;
  event_date: string;
  event_time: string;
  occasion: EventOccasion;
  outfit_description?: string;
  remind_1_day_before: boolean;
  remind_2_hours_before: boolean;
  reminder_sent_1_day: boolean;
  reminder_sent_2_hours: boolean;
  makeup_session_id?: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateEventRequest {
  event_name: string;
  event_date: string;
  event_time: string;
  occasion: EventOccasion;
  outfit_description?: string;
  remind_1_day_before?: boolean;
  remind_2_hours_before?: boolean;
}

export interface UpdateEventRequest {
  event_name?: string;
  event_date?: string;
  event_time?: string;
  occasion?: EventOccasion;
  outfit_description?: string;
  remind_1_day_before?: boolean;
  remind_2_hours_before?: boolean;
}

export interface EventStatsResponse {
  total_upcoming: number;
  total_past: number;
  completed_sessions: number;
  next_event?: {
    id: string;
    event_name: string;
    event_date: string;
    days_until: number;
  };
}
