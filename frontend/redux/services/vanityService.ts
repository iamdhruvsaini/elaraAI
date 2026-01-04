import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "@/redux/baseQuery";
import type {
  VanityProduct,
  AddProductRequest,
  ScanProductResponse,
  VanityStatsResponse,
  ProductsListResponse,
  ProductCategory,
} from "@/lib/types/vanity.types";

export const vanityApi = createApi({
  reducerPath: "vanityApi",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["Products", "VanityStats"],
  endpoints: (builder) => ({
    getProducts: builder.query<
      ProductsListResponse,
      { category?: ProductCategory; is_favorite?: boolean; skip?: number; limit?: number }
    >({
      query: ({ category, is_favorite, skip = 0, limit = 100 }) => {
        const params = new URLSearchParams();
        if (category) params.append("category", category);
        if (is_favorite !== undefined) params.append("is_favorite", String(is_favorite));
        params.append("skip", String(skip));
        params.append("limit", String(limit));
        return {
          url: `vanity/products?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["Products"],
    }),

    getProduct: builder.query<VanityProduct, string>({
      query: (productId) => ({
        url: `vanity/products/${productId}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Products", id }],
    }),

    addProduct: builder.mutation<VanityProduct, AddProductRequest>({
      query: (body) => ({
        url: "vanity/products",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Products", "VanityStats"],
    }),

    updateProduct: builder.mutation<VanityProduct, { id: string; data: Partial<AddProductRequest> }>({
      query: ({ id, data }) => ({
        url: `vanity/products/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Products", "VanityStats"],
    }),

    deleteProduct: builder.mutation<{ message: string }, string>({
      query: (productId) => ({
        url: `vanity/products/${productId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Products", "VanityStats"],
    }),

    scanProduct: builder.mutation<ScanProductResponse, FormData>({
      query: (formData) => ({
        url: "vanity/products/scan",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Products", "VanityStats"],
    }),

    getVanityStats: builder.query<VanityStatsResponse, void>({
      query: () => ({
        url: "vanity/stats",
        method: "GET",
      }),
      providesTags: ["VanityStats"],
    }),

    toggleFavorite: builder.mutation<VanityProduct, string>({
      query: (productId) => ({
        url: `vanity/products/${productId}/favorite`,
        method: "POST",
      }),
      invalidatesTags: ["Products"],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useLazyGetProductsQuery,
  useGetProductQuery,
  useAddProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useScanProductMutation,
  useGetVanityStatsQuery,
  useToggleFavoriteMutation,
} = vanityApi;

export default vanityApi;
