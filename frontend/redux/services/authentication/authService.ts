import { getBaseUrl } from "@/lib/getBaseUrl";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  CaptureUserImageResponse,
  LoginUserRequest,
  LoginUserResponse,
  MeResponse,
  RegisterUserRequest,
  RegisterUserResponse,
  GoogleOAuthRequest,
  GoogleOAuthResponse,
} from "./types";
import { baseQueryWithAuth } from "@/redux/baseQuery";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithAuth,
  endpoints: (builder) => ({
    registerUser: builder.mutation<RegisterUserResponse,RegisterUserRequest>({
      query: (body) => ({
        url: "auth/register",
        method: "POST",
        body,
      }),
    }),

    loginUser: builder.mutation<LoginUserResponse,LoginUserRequest>({
      query: (body) => ({
        url: "auth/login",
        method: "POST",
        body,
      }),
    }),

    getMe: builder.query<MeResponse, void>({
      query: () => ({
        url: "auth/me",
        method: "GET",
      }),
    }),

    CaptureUserImage: builder.mutation<CaptureUserImageResponse, any>({
      query: (body) => ({
        url: "profile/analyze-face",
        method: "POST",
        body,
      }),
    }),

    googleOAuth: builder.mutation<GoogleOAuthResponse, GoogleOAuthRequest>({
      query: (body) => ({
        url: "auth/oauth/google",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useRegisterUserMutation,
  useLoginUserMutation,
  useLazyGetMeQuery,
  useCaptureUserImageMutation,
  useGoogleOAuthMutation,
} = authApi;

export default authApi;
