export type ProductCategory =
  | "foundation"
  | "concealer"
  | "powder"
  | "blush"
  | "bronzer"
  | "highlighter"
  | "eyeshadow"
  | "eyeliner"
  | "mascara"
  | "eyebrow"
  | "lipstick"
  | "lip_gloss"
  | "lip_liner"
  | "primer"
  | "setting_spray"
  | "skincare"
  | "other";

export interface VanityProduct {
  id: string;
  user_id: string;
  brand: string;
  product_name: string;
  category: ProductCategory;
  shade?: string;
  price?: number;
  purchase_date?: string;
  expiry_date?: string;
  ingredients?: string[];
  is_safe_for_user: boolean;
  safety_warnings?: string[];
  tags?: string[];
  notes?: string;
  product_image_url?: string;
  times_used: number;
  is_favorite: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddProductRequest {
  brand: string;
  product_name: string;
  category: ProductCategory;
  shade?: string;
  price?: number;
  purchase_date?: string;
  expiry_date?: string;
  notes?: string;
  ingredients?: string[];
  tags?: string[];
}

export interface ScanProductResponse {
  success: boolean;
  product_id: string;
  product_name: string;
  brand: string;
  category: ProductCategory;
  shade?: string;
  image_url?: string;
  lookup_info: {
    barcode_detected: boolean;
    lookup_method: string;
    ocr_text_length: number;
  };
  safety: {
    is_safe: boolean;
    safety_score: number;
    warnings: string[];
    recommendation: string;
  };
  ingredients_count: number;
  ingredients_preview: string[];
  tags: string[];
}

export interface VanityStatsResponse {
  total_products: number;
  total_value: number;
  favorites_count: number;
  by_category: Record<ProductCategory, number>;
  expiring_soon: VanityProduct[];
  most_used: VanityProduct[];
}

export interface ProductsListResponse {
  products: VanityProduct[];
  total: number;
  skip: number;
  limit: number;
}
