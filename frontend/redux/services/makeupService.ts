import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "@/redux/baseQuery";
import type {
  MakeupSession,
  MakeupPlan,
  StartSessionRequest,
  StyleSessionRequest,
  StyleSessionResponse,
  HairSuggestionResponse,
  AccessoryRecommendationResponse,
  ProductMatchResponse,
  AccessoryOptionsResponse,
} from "@/lib/types/makeup.types";

export const makeupApi = createApi({
  reducerPath: "makeupApi",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["MakeupSession", "StyleSession"],
  endpoints: (builder) => ({
    startSession: builder.mutation<MakeupSession, StartSessionRequest>({
      query: (body) => ({
        url: "makeup/start",
        method: "POST",
        body,
      }),
      invalidatesTags: ["MakeupSession"],
    }),

    getSession: builder.query<MakeupSession, string>({
      query: (sessionId) => ({
        url: `makeup/${sessionId}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "MakeupSession", id }],
    }),

    completeStep: builder.mutation<
      { message: string; current_step: number; total_steps: number; progress_percent: number },
      { sessionId: string; step_number: number }
    >({
      query: ({ sessionId, step_number }) => ({
        url: `makeup/${sessionId}/complete-step`,
        method: "POST",
        body: { step_number },
      }),
      invalidatesTags: ["MakeupSession"],
    }),

    submitFinal: builder.mutation<
      { analysis: string; compliments: string[]; suggestions: string[] },
      { sessionId: string; formData: FormData }
    >({
      query: ({ sessionId, formData }) => ({
        url: `makeup/${sessionId}/submit-final`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["MakeupSession"],
    }),

    getAccessoryOptions: builder.query<AccessoryOptionsResponse, void>({
      query: () => ({
        url: "makeup/accessory-options",
        method: "GET",
      }),
    }),

    createStyleSession: builder.mutation<StyleSessionResponse, StyleSessionRequest>({
      query: (body) => ({
        url: "makeup/style-session",
        method: "POST",
        body,
      }),
      invalidatesTags: ["StyleSession"],
    }),

    updateStyleSession: builder.mutation<
      StyleSessionResponse,
      { sessionId: string; data: StyleSessionRequest }
    >({
      query: ({ sessionId, data }) => ({
        url: `makeup/style-session/${sessionId}/update`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["StyleSession"],
    }),

    getStyleHistory: builder.query<StyleSessionResponse[], void>({
      query: () => ({
        url: "makeup/style-history",
        method: "GET",
      }),
      providesTags: ["StyleSession"],
    }),

    getHairSuggestion: builder.query<HairSuggestionResponse, string>({
      query: (sessionId) => ({
        url: `makeup/${sessionId}/hair-suggestion`,
        method: "GET",
      }),
    }),

    confirmHair: builder.mutation<{ message: string; style: string }, { sessionId: string; chosen_style: string }>({
      query: ({ sessionId, chosen_style }) => ({
        url: `makeup/${sessionId}/confirm-hair`,
        method: "POST",
        body: { chosen_style },
      }),
    }),

    getAccessoryRecommendation: builder.query<AccessoryRecommendationResponse, string>({
      query: (sessionId) => ({
        url: `makeup/${sessionId}/accessory-recommendation`,
        method: "GET",
      }),
    }),

    generatePlan: builder.mutation<MakeupPlan, string>({
      query: (sessionId) => ({
        url: `makeup/${sessionId}/generate-plan`,
        method: "POST",
      }),
      invalidatesTags: ["MakeupSession"],
    }),

    getProductMatching: builder.query<ProductMatchResponse[], string>({
      query: (sessionId) => ({
        url: `makeup/${sessionId}/product-matching`,
        method: "GET",
      }),
    }),

    reportMistake: builder.mutation<
      { fixes: string[]; tips: string[]; prevention_tips: string[] },
      { sessionId: string; step_number: number; issue_type: string; description?: string }
    >({
      query: ({ sessionId, ...body }) => ({
        url: `makeup/${sessionId}/report-mistake`,
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useStartSessionMutation,
  useGetSessionQuery,
  useCompleteStepMutation,
  useSubmitFinalMutation,
  useGetAccessoryOptionsQuery,
  useCreateStyleSessionMutation,
  useUpdateStyleSessionMutation,
  useGetStyleHistoryQuery,
  useLazyGetHairSuggestionQuery,
  useConfirmHairMutation,
  useLazyGetAccessoryRecommendationQuery,
  useGeneratePlanMutation,
  useLazyGetProductMatchingQuery,
  useReportMistakeMutation,
} = makeupApi;

export default makeupApi;
