import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "@/redux/baseQuery";
import type {
  AnalyzeFaceResponse,
  UpdateAllergiesRequest,
  ProfileSetupRequest,
  ProfileUpdateRequest,
  DashboardResponse,
} from "@/lib/types/profile.types";
import type { UserProfile } from "@/lib/types/auth.types";

export const profileApi = createApi({
  reducerPath: "profileApi",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["Profile", "Dashboard"],
  endpoints: (builder) => ({
    analyzeFace: builder.mutation<AnalyzeFaceResponse, FormData>({
      query: (formData) => ({
        url: "profile/analyze-face",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Profile"],
    }),

    updateAllergies: builder.mutation<UserProfile, UpdateAllergiesRequest>({
      query: (body) => ({
        url: "profile/allergies",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Profile"],
    }),

    setupProfile: builder.mutation<UserProfile, ProfileSetupRequest>({
      query: (body) => ({
        url: "profile/setup",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Profile"],
    }),

    updateProfile: builder.mutation<UserProfile, ProfileUpdateRequest>({
      query: (body) => ({
        url: "profile/update",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Profile"],
    }),

    getProfile: builder.query<UserProfile, void>({
      query: () => ({
        url: "profile/profile",
        method: "GET",
      }),
      providesTags: ["Profile"],
    }),

    getDashboard: builder.query<DashboardResponse, void>({
      query: () => ({
        url: "profile/dashboard",
        method: "GET",
      }),
      providesTags: ["Dashboard"],
    }),
  }),
});

export const {
  useAnalyzeFaceMutation,
  useUpdateAllergiesMutation,
  useSetupProfileMutation,
  useUpdateProfileMutation,
  useGetProfileQuery,
  useLazyGetProfileQuery,
  useGetDashboardQuery,
  useLazyGetDashboardQuery,
} = profileApi;

export default profileApi;
