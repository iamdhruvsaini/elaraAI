import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "@/redux/baseQuery";
import type {
  RegisterUserRequest,
  RegisterUserResponse,
  LoginUserRequest,
  LoginUserResponse,
  GoogleOAuthRequest,
  MeResponse,
} from "@/lib/types/auth.types";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["User"],
  endpoints: (builder) => ({
    registerUser: builder.mutation<RegisterUserResponse, RegisterUserRequest>({
      query: (body) => ({
        url: "auth/register",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    loginUser: builder.mutation<LoginUserResponse, LoginUserRequest>({
      query: (body) => ({
        url: "auth/login",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    googleOAuth: builder.mutation<LoginUserResponse, GoogleOAuthRequest>({
      query: (body) => ({
        url: "auth/oauth/google",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User"],
    }),

    getMe: builder.query<MeResponse, void>({
      query: () => ({
        url: "auth/me",
        method: "GET",
      }),
      providesTags: ["User"],
    }),

    checkEmail: builder.query<
      { email: string; available: boolean; message: string; auth_provider?: string },
      string
    >({
      query: (email) => ({
        url: `auth/check-email/${encodeURIComponent(email)}`,
        method: "GET",
      }),
    }),

    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: "auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useRegisterUserMutation,
  useLoginUserMutation,
  useGoogleOAuthMutation,
  useLazyGetMeQuery,
  useGetMeQuery,
  useLazyCheckEmailQuery,
  useLogoutMutation,
} = authApi;

export default authApi;
