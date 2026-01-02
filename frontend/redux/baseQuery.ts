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
    const token = localStorage.getItem("access_token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export const baseQueryWithAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // 1️⃣ First request
  let result = await rawBaseQuery(args, api, extraOptions);

  // 2️⃣ If token expired
  if (result.error?.status === 401) {
    const refreshToken = localStorage.getItem("refresh_token");

    // No refresh token → force logout
    if (!refreshToken) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      return result;
    }

    // 3️⃣ Try refreshing token
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
      const {
        access_token,
        refresh_token,
      } = refreshResult.data as {
        access_token: string;
        refresh_token: string;
      };

      // 4️⃣ Save new tokens
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);

      // 5️⃣ Retry original request
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      // 6️⃣ Refresh failed → logout
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
  }

  return result;
};
