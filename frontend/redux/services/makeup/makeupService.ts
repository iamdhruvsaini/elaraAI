import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "@/redux/baseQuery";
import type { HairSuggestionRequest, HairSuggestionResponse } from "./types";

export const makeupApi = createApi({
  reducerPath: "makeupApi",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["HairSuggestion"],
  endpoints: (builder) => ({
    // Get hair suggestion based on user inputs
    getHairSuggestion: builder.mutation<HairSuggestionResponse, HairSuggestionRequest>({
      query: (suggestionData) => ({
        url: "makeup/hair-suggest",
        method: "POST",
        body: suggestionData,
      }),
    }),
  }),
});

export const { useGetHairSuggestionMutation } = makeupApi;
