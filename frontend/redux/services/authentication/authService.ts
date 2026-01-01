import { getBaseUrl } from "@/lib/getBaseUrl";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  RegisterUserRequest,
  RegisterUserResponse,
} from "./types";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${getBaseUrl()}/api/v1/`,
  }),
  endpoints: (builder) => ({
    registerUser: builder.mutation<RegisterUserResponse,RegisterUserRequest>({
      query: (body) => ({
        url: "auth/register",
        method: "POST",
        body,
      }
    ),}),
  }),
});

export const { useRegisterUserMutation } = authApi;
export default authApi;
