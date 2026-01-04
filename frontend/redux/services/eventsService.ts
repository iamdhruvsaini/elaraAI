import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "@/redux/baseQuery";
import type {
  ScheduledEvent,
  CreateEventRequest,
  UpdateEventRequest,
  EventStatsResponse,
} from "@/lib/types/events.types";

export const eventsApi = createApi({
  reducerPath: "eventsApi",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["Events", "EventStats"],
  endpoints: (builder) => ({
    getEvents: builder.query<ScheduledEvent[], { include_past?: boolean }>({
      query: ({ include_past = false }) => ({
        url: `events?include_past=${include_past}`,
        method: "GET",
      }),
      providesTags: ["Events"],
    }),

    getUpcomingEvents: builder.query<ScheduledEvent[], { days?: number }>({
      query: ({ days = 30 }) => ({
        url: `events/upcoming?days=${days}`,
        method: "GET",
      }),
      providesTags: ["Events"],
    }),

    getEvent: builder.query<ScheduledEvent, string>({
      query: (eventId) => ({
        url: `events/${eventId}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Events", id }],
    }),

    createEvent: builder.mutation<ScheduledEvent, CreateEventRequest>({
      query: (body) => ({
        url: "events",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Events", "EventStats"],
    }),

    updateEvent: builder.mutation<ScheduledEvent, { id: string; data: UpdateEventRequest }>({
      query: ({ id, data }) => ({
        url: `events/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Events", "EventStats"],
    }),

    deleteEvent: builder.mutation<{ success: boolean; message: string }, string>({
      query: (eventId) => ({
        url: `events/${eventId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Events", "EventStats"],
    }),

    startSessionForEvent: builder.mutation<
      { success: boolean; message: string; session_id: string; event_id: string },
      string
    >({
      query: (eventId) => ({
        url: `events/${eventId}/start-session`,
        method: "POST",
      }),
      invalidatesTags: ["Events"],
    }),

    completeEvent: builder.mutation<{ success: boolean; message: string }, string>({
      query: (eventId) => ({
        url: `events/${eventId}/complete`,
        method: "POST",
      }),
      invalidatesTags: ["Events", "EventStats"],
    }),

    getEventStats: builder.query<EventStatsResponse, void>({
      query: () => ({
        url: "events/stats/summary",
        method: "GET",
      }),
      providesTags: ["EventStats"],
    }),
  }),
});

export const {
  useGetEventsQuery,
  useLazyGetEventsQuery,
  useGetUpcomingEventsQuery,
  useGetEventQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  useStartSessionForEventMutation,
  useCompleteEventMutation,
  useGetEventStatsQuery,
} = eventsApi;

export default eventsApi;
