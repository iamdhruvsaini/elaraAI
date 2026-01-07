// Vanity Product Types

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
  | "lipstick" 
  | "lip_gloss" 
  | "lip_liner" 
  | "other"
  // Legacy categories for backwards compatibility
  | "face" 
  | "eyes" 
  | "lips" 
  | "cheeks";

export interface VanityProduct {
  id: number;
  user_id: number;
  product_name: string;
  brand?: string;
  category: ProductCategory;
  shade?: string;
  price?: number;
  purchase_date?: string;
  expiry_date?: string;
  barcode?: string;
  notes?: string;
  tags?: string[];
  is_favorite?: boolean;
  // Safety fields from AI
  ingredients?: string[];
  is_safe_for_user?: boolean;
  safety_warnings?: string[];
  skin_safety_rating?: number;
  allergy_conflicts?: string[];
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface VanityStats {
  total_products: number;
  by_category: {
    face: number;
    eyes: number;
    lips: number;
    cheeks: number;
    other: number;
  };
  safety_checked: number;
  favorites: number;
}

// Request Types

export interface AddProductRequest {
  product_name: string;
  brand: string;
  category: string;
  shade?: string;
  price?: number;
  ingredients?: string[];
  purchase_date?: string;
  expiry_date?: string;
  notes?: string;
  tags?: string[];
  image?: File;
}

export interface ScanProductRequest {
  image: File;
  scan_type: "barcode" | "ingredients" | "product";
}

export interface ScanProductResponse {
  product_info?: {
    product_name: string;
    brand: string;
    category: string;
    barcode?: string;
  };
  ingredients?: string[];
  safety_analysis?: {
    status: "safe" | "warning" | "alert";
    notes: string;
    allergens?: string[];
    concerns?: string[];
  };
  ocr_text?: string;
}

export interface UpdateProductRequest {
  product_id: number;
  product_name?: string;
  brand?: string;
  category?: "face" | "eyes" | "lips" | "cheeks" | "other";
  shade_color?: string;
  finish?: "matte" | "dewy" | "natural";
  purchase_date?: string;
  notes?: string;
  is_favorite?: boolean;
}

// Response Types

export interface GetAllProductsResponse {
  products: VanityProduct[];
  total: number;
  by_category: {
    face: VanityProduct[];
    eyes: VanityProduct[];
    lips: VanityProduct[];
    cheeks: VanityProduct[];
    other: VanityProduct[];
  };
}

export interface AddProductResponse {
  product: VanityProduct;
  message: string;
}

export interface DeleteProductResponse {
  message: string;
  product_id: number;
}
