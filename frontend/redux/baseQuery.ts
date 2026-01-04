import { fetchBaseQuery } from "@reduxjs/toolkit/query";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";
import { getBaseUrl } from "@/lib/getBaseUrl";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${getBaseUrl()}/api/v1/`,
  prepareHeaders: (headers) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }
    return headers;
  },
});

export const baseQueryWithAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // First request
  let result = await rawBaseQuery(args, api, extraOptions);

  // If token expired (401)
  if (result.error?.status === 401) {
    if (typeof window === "undefined") {
      return result;
    }

    const refreshToken = localStorage.getItem("refresh_token");

    // No refresh token → force logout
    if (!refreshToken) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      return result;
    }

    // Try refreshing token
    const refreshResult = await rawBaseQuery(
      {
        url: "auth/refresh",
        method: "POST",
        body: { refresh_token: refreshToken },
      },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      const { access_token, refresh_token } = refreshResult.data as {
        access_token: string;
        refresh_token: string;
      };

      // Save new tokens
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);

      // Retry original request
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      // Refresh failed → logout
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
  }

  return result;
};
