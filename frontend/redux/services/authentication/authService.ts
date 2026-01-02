import { getBaseUrl } from "@/lib/getBaseUrl";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  LoginUserRequest,
  LoginUserResponse,
  MeResponse,
  RegisterUserRequest,
  RegisterUserResponse,
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


  }),
});

export const {
  useRegisterUserMutation,
  useLoginUserMutation,
  useLazyGetMeQuery
  } = authApi;

export default authApi;
