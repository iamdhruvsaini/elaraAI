import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "@/redux/baseQuery";
import type {
  AnalyzeFaceRequest,
  AnalyzeFaceResponse,
  ProfileSetupRequest,
  ProfileSetupResponse,
  UpdateAllergiesRequest,
  UpdateAllergiesResponse,
  DashboardResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  GetProfileResponse,
} from "./types";

export const profileApi = createApi({
  reducerPath: "profileApi",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["Profile", "Dashboard"],
  endpoints: (builder) => ({
    // POST /api/v1/profile/analyze-face
    analyzeFace: builder.mutation<AnalyzeFaceResponse, FormData>({
      query: (formData) => ({
        url: "profile/analyze-face",
        method: "POST",
        body: formData,
      }),
    }),

    // POST /api/v1/profile/setup
    setupProfile: builder.mutation<ProfileSetupResponse, ProfileSetupRequest>({
      query: (body) => ({
        url: "profile/setup",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Profile", "Dashboard"],
    }),

    // PUT /api/v1/profile/allergies
    updateAllergies: builder.mutation<UpdateAllergiesResponse, UpdateAllergiesRequest>({
      query: (body) => ({
        url: "profile/allergies",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Profile", "Dashboard"],
    }),

    // GET /api/v1/profile/dashboard
    getDashboard: builder.query<DashboardResponse, void>({
      query: () => ({
        url: "profile/dashboard",
        method: "GET",
      }),
      providesTags: ["Dashboard"],
    }),

    // GET /api/v1/profile/profile
    getProfile: builder.query<GetProfileResponse, void>({
      query: () => ({
        url: "profile/profile",
        method: "GET",
      }),
      providesTags: ["Profile"],
    }),

    // PUT /api/v1/profile/update
    updateProfile: builder.mutation<UpdateProfileResponse, UpdateProfileRequest>({
      query: (body) => ({
        url: "profile/update",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Profile", "Dashboard"],
    }),
  }),
});

export const {
  useAnalyzeFaceMutation,
  useSetupProfileMutation,
  useUpdateAllergiesMutation,
  useGetDashboardQuery,
  useLazyGetDashboardQuery,
  useGetProfileQuery,
  useLazyGetProfileQuery,
  useUpdateProfileMutation,
} = profileApi;

export default profileApi;
