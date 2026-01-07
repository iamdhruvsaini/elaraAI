import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithAuth } from "@/redux/baseQuery";
import type {
  VanityProduct,
  VanityStats,
  AddProductRequest,
  AddProductResponse,
  ScanProductRequest,
  ScanProductResponse,
  GetAllProductsResponse,
  DeleteProductResponse,
  UpdateProductRequest,
} from "./types";

export const vanityApi = createApi({
  reducerPath: "vanityApi",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["VanityProducts", "VanityStats"],
  endpoints: (builder) => ({
    // Get all products
    getAllProducts: builder.query<GetAllProductsResponse, void>({
      query: () => ({
        url: "vanity/products",
        method: "GET",
      }),
      providesTags: ["VanityProducts"],
    }),

    // Get single product by ID
    getProductById: builder.query<VanityProduct, number>({
      query: (productId) => ({
        url: `vanity/products/${productId}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "VanityProducts", id }],
    }),

    // Add product manually
    addProduct: builder.mutation<AddProductResponse, AddProductRequest>({
      query: (productData) => ({
        url: "vanity/products",
        method: "POST",
        body: productData,
      }),
      invalidatesTags: ["VanityProducts", "VanityStats"],
    }),

    // Scan product (barcode/OCR)
    scanProduct: builder.mutation<ScanProductResponse, FormData>({
      query: (formData) => ({
        url: "vanity/products/scan",
        method: "POST",
        body: formData,
      }),
    }),

    // Test OCR
    testOcr: builder.mutation<ScanProductResponse, FormData>({
      query: (formData) => ({
        url: "vanity/products/test-ocr",
        method: "POST",
        body: formData,
      }),
    }),

    // Update product
    updateProduct: builder.mutation<
      VanityProduct,
      { productId: number; data: UpdateProductRequest }
    >({
      query: ({ productId, data }) => ({
        url: `vanity/products/${productId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { productId }) => [
        { type: "VanityProducts", id: productId },
        "VanityProducts",
      ],
    }),

    // Delete product
    deleteProduct: builder.mutation<DeleteProductResponse, number>({
      query: (productId) => ({
        url: `vanity/products/${productId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["VanityProducts", "VanityStats"],
    }),

    // Get vanity stats
    getVanityStats: builder.query<VanityStats, void>({
      query: () => ({
        url: "vanity/stats",
        method: "GET",
      }),
      providesTags: ["VanityStats"],
    }),
  }),
});

export const {
  useGetAllProductsQuery,
  useGetProductByIdQuery,
  useAddProductMutation,
  useScanProductMutation,
  useTestOcrMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetVanityStatsQuery,
} = vanityApi;
