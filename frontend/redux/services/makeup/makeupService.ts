import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "@/redux/baseQuery";
import type {
  HairSuggestionRequest,
  HairSuggestionResponse,
  StartMakeupRequest,
  MakeupSessionResponse,
  StyleSessionRequest,
  StyleSessionResponse,
  MakeupPlanResponse,
} from "./types";

export const makeupApi = createApi({
  reducerPath: "makeupApi",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["HairSuggestion", "MakeupSession", "MakeupPlan"],
  endpoints: (builder) => ({
    // Get hair suggestion based on user inputs
    getHairSuggestion: builder.mutation<HairSuggestionResponse, HairSuggestionRequest>({
      query: (suggestionData) => ({
        url: "makeup/hair-suggest",
        method: "POST",
        body: suggestionData,
      }),
    }),

    // Start makeup session
    startMakeupSession: builder.mutation<MakeupSessionResponse, StartMakeupRequest>({
      query: (sessionData) => ({
        url: "makeup/start",
        method: "POST",
        body: sessionData,
      }),
      invalidatesTags: ["MakeupSession"],
    }),

    // Create style session (outfit description and accessories)
    createStyleSession: builder.mutation<StyleSessionResponse, StyleSessionRequest>({
      query: (styleData) => ({
        url: "makeup/style-session",
        method: "POST",
        body: styleData,
      }),
    }),

    // Generate makeup plan
    generateMakeupPlan: builder.mutation<MakeupPlanResponse, number>({
      query: (sessionId) => ({
        url: `makeup/${sessionId}/generate-plan`,
        method: "POST",
      }),
      invalidatesTags: ["MakeupPlan"],
    }),

    // Get makeup session by ID
    getMakeupSession: builder.query<MakeupSessionResponse, number>({
      query: (sessionId) => ({
        url: `makeup/${sessionId}`,
        method: "GET",
      }),
      providesTags: ["MakeupSession"],
    }),
  }),
});

export const {
  useGetHairSuggestionMutation,
  useStartMakeupSessionMutation,
  useCreateStyleSessionMutation,
  useGenerateMakeupPlanMutation,
  useGetMakeupSessionQuery,
} = makeupApi;
