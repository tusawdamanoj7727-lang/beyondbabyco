/**
 * Supabase database types.
 *
 * Authored from the committed SQL migrations (supabase/database/*.sql).
 * To regenerate against the live project once migrations are applied:
 *
 *   supabase gen types typescript --project-id <id> --schema public \
 *     > src/lib/supabase/database.types.ts
 *
 * This file covers the tables, enums and functions used by the app today
 * (auth + the product module). Regenerating will expand it to the full
 * 65-table schema.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProductStatus = "draft" | "active" | "archived" | "coming_soon";

/** Shared publishing state for catalog taxonomy (categories & brands). */
export type CatalogStatus = "draft" | "active" | "archived";

export type MovementType =
  | "in"
  | "out"
  | "adjustment"
  | "transfer"
  | "purchase"
  | "sale"
  | "return";

export type PoStatus = "draft" | "sent" | "received" | "cancelled";

export type OrderStatus =
  | "draft"
  | "pending"
  | "confirmed"
  | "processing"
  | "packed"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled"
  | "refunded"
  | "returned";

export type PaymentStatus =
  | "pending"
  | "authorized"
  | "captured"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded"
  | "partially_refunded"
  | "voided";

export type ShipmentStatus =
  | "pending"
  | "label_created"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "failed"
  | "returned";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role_id: string | null;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role_id?: string | null;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role_id?: string | null;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      roles: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          is_system: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          is_system?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          is_system?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      brands: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          banner_url: string | null;
          description: string | null;
          website_url: string | null;
          country_of_origin: string | null;
          seo_title: string | null;
          seo_description: string | null;
          meta_keywords: string | null;
          canonical_url: string | null;
          is_featured: boolean;
          position: number;
          status: CatalogStatus;
          is_active: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          banner_url?: string | null;
          description?: string | null;
          website_url?: string | null;
          country_of_origin?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          meta_keywords?: string | null;
          canonical_url?: string | null;
          is_featured?: boolean;
          position?: number;
          status?: CatalogStatus;
          is_active?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["brands"]["Insert"]>;
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          parent_id: string | null;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          banner_url: string | null;
          icon_url: string | null;
          seo_title: string | null;
          seo_description: string | null;
          meta_keywords: string | null;
          canonical_url: string | null;
          is_featured: boolean;
          position: number;
          status: CatalogStatus;
          is_active: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          parent_id?: string | null;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          banner_url?: string | null;
          icon_url?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          meta_keywords?: string | null;
          canonical_url?: string | null;
          is_featured?: boolean;
          position?: number;
          status?: CatalogStatus;
          is_active?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      subcategories: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          slug: string;
          description: string | null;
          image_url: string | null;
          position: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          slug: string;
          description?: string | null;
          image_url?: string | null;
          position?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["subcategories"]["Insert"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          brand_id: string | null;
          category_id: string | null;
          subcategory_id: string | null;
          name: string;
          slug: string;
          sku: string | null;
          short_description: string | null;
          description: string | null;
          status: ProductStatus;
          price: number;
          compare_at_price: number | null;
          cost_price: number | null;
          sale_price: number | null;
          gst_rate: number;
          tax_class: string | null;
          barcode: string | null;
          stock: number;
          low_stock_threshold: number;
          weight_grams: number | null;
          length_cm: number | null;
          width_cm: number | null;
          height_cm: number | null;
          currency: string;
          is_featured: boolean;
          is_best_seller: boolean;
          is_new_arrival: boolean;
          is_trending: boolean;
          launch_date: string | null;
          seo_title: string | null;
          seo_description: string | null;
          meta_keywords: string | null;
          canonical_url: string | null;
          rating_avg: number;
          rating_count: number;
          published_at: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand_id?: string | null;
          category_id?: string | null;
          subcategory_id?: string | null;
          name: string;
          slug: string;
          sku?: string | null;
          short_description?: string | null;
          description?: string | null;
          status?: ProductStatus;
          price?: number;
          compare_at_price?: number | null;
          cost_price?: number | null;
          sale_price?: number | null;
          gst_rate?: number;
          tax_class?: string | null;
          barcode?: string | null;
          stock?: number;
          low_stock_threshold?: number;
          weight_grams?: number | null;
          length_cm?: number | null;
          width_cm?: number | null;
          height_cm?: number | null;
          currency?: string;
          is_featured?: boolean;
          is_best_seller?: boolean;
          is_new_arrival?: boolean;
          is_trending?: boolean;
          launch_date?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          meta_keywords?: string | null;
          canonical_url?: string | null;
          rating_avg?: number;
          rating_count?: number;
          published_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          alt: string | null;
          position: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          url: string;
          alt?: string | null;
          position?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_images"]["Insert"]>;
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          sku: string | null;
          barcode: string | null;
          price: number | null;
          compare_at_price: number | null;
          weight_grams: number | null;
          position: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          name: string;
          sku?: string | null;
          barcode?: string | null;
          price?: number | null;
          compare_at_price?: number | null;
          weight_grams?: number | null;
          position?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_variants"]["Insert"]>;
        Relationships: [];
      };
      ingredients: {
        Row: {
          id: string;
          name: string;
          inci_name: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          inci_name?: string | null;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ingredients"]["Insert"]>;
        Relationships: [];
      };
      product_ingredients: {
        Row: {
          product_id: string;
          ingredient_id: string;
          notes: string | null;
        };
        Insert: {
          product_id: string;
          ingredient_id: string;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["product_ingredients"]["Insert"]>;
        Relationships: [];
      };
      benefits: {
        Row: {
          id: string;
          name: string;
          icon: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          icon?: string | null;
          description?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["benefits"]["Insert"]>;
        Relationships: [];
      };
      product_benefits: {
        Row: {
          product_id: string;
          benefit_id: string;
        };
        Insert: {
          product_id: string;
          benefit_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_benefits"]["Insert"]>;
        Relationships: [];
      };
      inventory: {
        Row: {
          id: string;
          product_variant_id: string;
          warehouse_id: string;
          quantity: number;
          reserved: number;
          reorder_level: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_variant_id: string;
          warehouse_id: string;
          quantity?: number;
          reserved?: number;
          reorder_level?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["inventory"]["Insert"]>;
        Relationships: [];
      };
      warehouses: {
        Row: {
          id: string;
          name: string;
          code: string;
          address: string | null;
          city: string | null;
          state: string | null;
          country: string;
          pincode: string | null;
          contact_person: string | null;
          phone: string | null;
          email: string | null;
          is_default: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          country?: string;
          pincode?: string | null;
          contact_person?: string | null;
          phone?: string | null;
          email?: string | null;
          is_default?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["warehouses"]["Insert"]>;
        Relationships: [];
      };
      suppliers: {
        Row: {
          id: string;
          name: string;
          contact_name: string | null;
          email: string | null;
          phone: string | null;
          gstin: string | null;
          address: string | null;
          country: string | null;
          website: string | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          contact_name?: string | null;
          email?: string | null;
          phone?: string | null;
          gstin?: string | null;
          address?: string | null;
          country?: string | null;
          website?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["suppliers"]["Insert"]>;
        Relationships: [];
      };
      stock_movements: {
        Row: {
          id: string;
          inventory_id: string;
          type: MovementType;
          quantity: number;
          reference: string | null;
          reason: string | null;
          note: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          inventory_id: string;
          type: MovementType;
          quantity: number;
          reference?: string | null;
          reason?: string | null;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["stock_movements"]["Insert"]>;
        Relationships: [];
      };
      purchase_orders: {
        Row: {
          id: string;
          po_number: string;
          supplier_id: string | null;
          warehouse_id: string | null;
          status: PoStatus;
          total: number;
          ordered_at: string | null;
          expected_at: string | null;
          received_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          po_number: string;
          supplier_id?: string | null;
          warehouse_id?: string | null;
          status?: PoStatus;
          total?: number;
          ordered_at?: string | null;
          expected_at?: string | null;
          received_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["purchase_orders"]["Insert"]>;
        Relationships: [];
      };
      purchase_order_items: {
        Row: {
          id: string;
          purchase_order_id: string;
          product_variant_id: string;
          quantity: number;
          quantity_received: number;
          unit_cost: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          purchase_order_id: string;
          product_variant_id: string;
          quantity: number;
          quantity_received?: number;
          unit_cost: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["purchase_order_items"]["Insert"]>;
        Relationships: [];
      };
      order_refunds: {
        Row: {
          id: string;
          order_id: string;
          payment_id: string | null;
          amount: number;
          reason: string | null;
          notes: string | null;
          status: PaymentStatus;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          payment_id?: string | null;
          amount: number;
          reason?: string | null;
          notes?: string | null;
          status?: PaymentStatus;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_refunds"]["Insert"]>;
        Relationships: [];
      };
      order_events: {
        Row: {
          id: string;
          order_id: string;
          type: string;
          message: string;
          metadata: Json;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          type: string;
          message: string;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_events"]["Insert"]>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_id: string | null;
          warehouse_id: string | null;
          status: OrderStatus;
          subtotal: number;
          discount_total: number;
          tax_total: number;
          shipping_total: number;
          grand_total: number;
          currency: string;
          coupon_id: string | null;
          shipping_method_id: string | null;
          notes: string | null;
          internal_notes: string | null;
          cancelled_at: string | null;
          cancel_reason: string | null;
          placed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          customer_id?: string | null;
          warehouse_id?: string | null;
          status?: OrderStatus;
          subtotal?: number;
          discount_total?: number;
          tax_total?: number;
          shipping_total?: number;
          grand_total?: number;
          currency?: string;
          coupon_id?: string | null;
          shipping_method_id?: string | null;
          notes?: string | null;
          internal_notes?: string | null;
          cancelled_at?: string | null;
          cancel_reason?: string | null;
          placed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_variant_id: string | null;
          name: string;
          sku: string | null;
          unit_price: number;
          quantity: number;
          tax_rate: number;
          total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_variant_id?: string | null;
          name: string;
          sku?: string | null;
          unit_price: number;
          quantity: number;
          tax_rate?: number;
          total: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          profile_id: string | null;
          email: string | null;
          phone: string | null;
          full_name: string | null;
          status: string;
          avatar_url: string | null;
          notes: string | null;
          internal_notes: string | null;
          tags: Json;
          is_vip: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          email?: string | null;
          phone?: string | null;
          full_name?: string | null;
          status?: string;
          avatar_url?: string | null;
          notes?: string | null;
          internal_notes?: string | null;
          tags?: Json;
          is_vip?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
        Relationships: [];
      };
      customer_addresses: {
        Row: {
          id: string;
          customer_id: string;
          type: string;
          full_name: string | null;
          phone: string | null;
          line1: string;
          line2: string | null;
          city: string;
          state: string;
          country: string;
          pincode: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          type?: string;
          full_name?: string | null;
          phone?: string | null;
          line1: string;
          line2?: string | null;
          city: string;
          state: string;
          country?: string;
          pincode: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["customer_addresses"]["Insert"]>;
        Relationships: [];
      };
      customer_events: {
        Row: {
          id: string;
          customer_id: string;
          type: string;
          message: string;
          metadata: Json;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          type: string;
          message: string;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["customer_events"]["Insert"]>;
        Relationships: [];
      };
      wishlist: {
        Row: {
          id: string;
          customer_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          product_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["wishlist"]["Insert"]>;
        Relationships: [];
      };
      cart: {
        Row: {
          id: string;
          customer_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cart"]["Insert"]>;
        Relationships: [];
      };
      cart_items: {
        Row: {
          id: string;
          cart_id: string;
          product_variant_id: string;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cart_id: string;
          product_variant_id: string;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cart_items"]["Insert"]>;
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          product_id: string;
          customer_id: string | null;
          order_id: string | null;
          rating: number;
          title: string | null;
          body: string | null;
          pros: string | null;
          cons: string | null;
          is_verified: boolean;
          is_published: boolean;
          moderation_status: string;
          is_featured: boolean;
          internal_notes: string | null;
          moderator_id: string | null;
          moderation_reason: string | null;
          edited_at: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          customer_id?: string | null;
          order_id?: string | null;
          rating: number;
          title?: string | null;
          body?: string | null;
          pros?: string | null;
          cons?: string | null;
          is_verified?: boolean;
          is_published?: boolean;
          moderation_status?: string;
          is_featured?: boolean;
          internal_notes?: string | null;
          moderator_id?: string | null;
          moderation_reason?: string | null;
          edited_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
        Relationships: [];
      };
      review_images: {
        Row: {
          id: string;
          review_id: string;
          url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          review_id: string;
          url: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["review_images"]["Insert"]>;
        Relationships: [];
      };
      review_events: {
        Row: {
          id: string;
          review_id: string;
          type: string;
          message: string;
          metadata: Json;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          review_id: string;
          type: string;
          message: string;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["review_events"]["Insert"]>;
        Relationships: [];
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          type: string;
          value: number;
          min_order: number;
          max_uses: number | null;
          used_count: number;
          starts_at: string | null;
          expires_at: string | null;
          is_active: boolean;
          name: string | null;
          description: string | null;
          promo_type: string | null;
          timezone: string;
          max_discount: number | null;
          per_customer_limit: number | null;
          first_order_only: boolean;
          logged_in_only: boolean;
          eligibility: Json;
          allow_stack: boolean;
          priority: number;
          is_exclusive: boolean;
          auto_apply: boolean;
          auto_conditions: Json;
          buy_x_get_y: Json;
          free_shipping: Json;
          lifecycle_status: string;
          deleted_at: string | null;
          total_revenue: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          type: string;
          value: number;
          min_order?: number;
          max_uses?: number | null;
          used_count?: number;
          starts_at?: string | null;
          expires_at?: string | null;
          is_active?: boolean;
          name?: string | null;
          description?: string | null;
          promo_type?: string | null;
          timezone?: string;
          max_discount?: number | null;
          per_customer_limit?: number | null;
          first_order_only?: boolean;
          logged_in_only?: boolean;
          eligibility?: Json;
          allow_stack?: boolean;
          priority?: number;
          is_exclusive?: boolean;
          auto_apply?: boolean;
          auto_conditions?: Json;
          buy_x_get_y?: Json;
          free_shipping?: Json;
          lifecycle_status?: string;
          deleted_at?: string | null;
          total_revenue?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["coupons"]["Insert"]>;
        Relationships: [];
      };
      coupon_usage: {
        Row: {
          id: string;
          coupon_id: string;
          customer_id: string | null;
          order_id: string | null;
          used_at: string;
          discount_amount: number;
          order_subtotal: number | null;
        };
        Insert: {
          id?: string;
          coupon_id: string;
          customer_id?: string | null;
          order_id?: string | null;
          used_at?: string;
          discount_amount?: number;
          order_subtotal?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["coupon_usage"]["Insert"]>;
        Relationships: [];
      };
      gift_cards: {
        Row: {
          id: string;
          code: string;
          balance: number;
          initial_balance: number;
          currency: string;
          is_active: boolean;
          expires_at: string | null;
          customer_id: string | null;
          issued_to_email: string | null;
          issued_by: string | null;
          notes: string | null;
          name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          balance?: number;
          initial_balance?: number;
          currency?: string;
          is_active?: boolean;
          expires_at?: string | null;
          customer_id?: string | null;
          issued_to_email?: string | null;
          issued_by?: string | null;
          notes?: string | null;
          name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["gift_cards"]["Insert"]>;
        Relationships: [];
      };
      gift_card_transactions: {
        Row: {
          id: string;
          gift_card_id: string;
          order_id: string | null;
          amount: number;
          type: string;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          gift_card_id: string;
          order_id?: string | null;
          amount: number;
          type: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["gift_card_transactions"]["Insert"]>;
        Relationships: [];
      };
      shipping_carriers: {
        Row: {
          id: string;
          name: string;
          provider: string;
          api_key_encrypted: string | null;
          api_secret_encrypted: string | null;
          sandbox: boolean;
          is_active: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          provider: string;
          api_key_encrypted?: string | null;
          api_secret_encrypted?: string | null;
          sandbox?: boolean;
          is_active?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["shipping_carriers"]["Insert"]>;
        Relationships: [];
      };
      shipping_zones: {
        Row: {
          id: string;
          name: string;
          country: string;
          state: string | null;
          city: string | null;
          postal_from: string | null;
          postal_to: string | null;
          priority: number;
          is_active: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          country?: string;
          state?: string | null;
          city?: string | null;
          postal_from?: string | null;
          postal_to?: string | null;
          priority?: number;
          is_active?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["shipping_zones"]["Insert"]>;
        Relationships: [];
      };
      shipping_rates: {
        Row: {
          id: string;
          zone_id: string;
          name: string;
          weight_min_grams: number;
          weight_max_grams: number | null;
          price: number;
          free_shipping_threshold: number | null;
          cod_charge: number;
          is_active: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          zone_id: string;
          name: string;
          weight_min_grams?: number;
          weight_max_grams?: number | null;
          price: number;
          free_shipping_threshold?: number | null;
          cod_charge?: number;
          is_active?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["shipping_rates"]["Insert"]>;
        Relationships: [];
      };
      pickup_requests: {
        Row: {
          id: string;
          carrier_id: string | null;
          warehouse_id: string | null;
          pickup_date: string;
          status: string;
          reference: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          carrier_id?: string | null;
          warehouse_id?: string | null;
          pickup_date: string;
          status?: string;
          reference?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pickup_requests"]["Insert"]>;
        Relationships: [];
      };
      ndr_events: {
        Row: {
          id: string;
          shipment_id: string;
          reason: string;
          status: string;
          notes: string | null;
          scheduled_at: string | null;
          resolved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          shipment_id: string;
          reason: string;
          status?: string;
          notes?: string | null;
          scheduled_at?: string | null;
          resolved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ndr_events"]["Insert"]>;
        Relationships: [];
      };
      returns: {
        Row: {
          id: string;
          rma_number: string;
          order_id: string;
          customer_id: string | null;
          warehouse_id: string | null;
          status: string;
          reason: string;
          refund_status: string;
          refund_type: string | null;
          refund_amount: number;
          inspection_notes: string | null;
          inspector_id: string | null;
          internal_notes: string | null;
          restock_completed: boolean;
          closed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          rma_number: string;
          order_id: string;
          customer_id?: string | null;
          warehouse_id?: string | null;
          status?: string;
          reason?: string;
          refund_status?: string;
          refund_type?: string | null;
          refund_amount?: number;
          inspection_notes?: string | null;
          inspector_id?: string | null;
          internal_notes?: string | null;
          restock_completed?: boolean;
          closed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["returns"]["Insert"]>;
        Relationships: [];
      };
      return_items: {
        Row: {
          id: string;
          return_id: string;
          order_item_id: string | null;
          product_id: string | null;
          product_variant_id: string | null;
          name: string;
          sku: string | null;
          quantity: number;
          unit_price: number;
          condition: string | null;
          restock_decision: string | null;
          damage_level: string | null;
          inspection_photos: Json;
          inspector_notes: string | null;
          restocked: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          return_id: string;
          order_item_id?: string | null;
          product_id?: string | null;
          product_variant_id?: string | null;
          name: string;
          sku?: string | null;
          quantity: number;
          unit_price?: number;
          condition?: string | null;
          restock_decision?: string | null;
          damage_level?: string | null;
          inspection_photos?: Json;
          inspector_notes?: string | null;
          restocked?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["return_items"]["Insert"]>;
        Relationships: [];
      };
      return_events: {
        Row: {
          id: string;
          return_id: string;
          type: string;
          message: string;
          metadata: Json;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          return_id: string;
          type: string;
          message: string;
          metadata?: Json;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["return_events"]["Insert"]>;
        Relationships: [];
      };
      support_tickets: {
        Row: {
          id: string;
          ticket_number: string;
          customer_id: string | null;
          subject: string;
          status: string;
          priority: string;
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ticket_number: string;
          customer_id?: string | null;
          subject: string;
          status?: string;
          priority?: string;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["support_tickets"]["Insert"]>;
        Relationships: [];
      };
      ticket_messages: {
        Row: {
          id: string;
          ticket_id: string;
          sender_type: string;
          sender_id: string | null;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          sender_type: string;
          sender_id?: string | null;
          message: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ticket_messages"]["Insert"]>;
        Relationships: [];
      };
      newsletter_subscribers: {
        Row: {
          id: string;
          email: string;
          is_active: boolean;
          source: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          is_active?: boolean;
          source?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["newsletter_subscribers"]["Insert"]>;
        Relationships: [];
      };
      loyalty_points: {
        Row: {
          id: string;
          customer_id: string;
          points: number;
          reason: string | null;
          order_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          points: number;
          reason?: string | null;
          order_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["loyalty_points"]["Insert"]>;
        Relationships: [];
      };
      referrals: {
        Row: {
          id: string;
          referrer_customer_id: string;
          referred_email: string | null;
          referred_customer_id: string | null;
          status: string;
          reward_points: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          referrer_customer_id: string;
          referred_email?: string | null;
          referred_customer_id?: string | null;
          status?: string;
          reward_points?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["referrals"]["Insert"]>;
        Relationships: [];
      };
      shipping_addresses: {
        Row: {
          id: string;
          order_id: string;
          full_name: string;
          phone: string | null;
          line1: string;
          line2: string | null;
          city: string;
          state: string;
          country: string;
          pincode: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          full_name: string;
          phone?: string | null;
          line1: string;
          line2?: string | null;
          city: string;
          state: string;
          country?: string;
          pincode: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["shipping_addresses"]["Insert"]>;
        Relationships: [];
      };
      shipping_methods: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          base_rate: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          base_rate?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["shipping_methods"]["Insert"]>;
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          gateway_id: string | null;
          customer_id: string | null;
          payment_ref: string | null;
          gateway_txn_id: string | null;
          provider: string | null;
          method: string | null;
          amount: number;
          currency: string;
          status: PaymentStatus;
          fees: number;
          tax: number;
          captured_at: string | null;
          failed_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          gateway_id?: string | null;
          customer_id?: string | null;
          payment_ref?: string | null;
          gateway_txn_id?: string | null;
          provider?: string | null;
          method?: string | null;
          amount: number;
          currency?: string;
          status?: PaymentStatus;
          fees?: number;
          tax?: number;
          captured_at?: string | null;
          failed_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
        Relationships: [];
      };
      payment_transactions: {
        Row: {
          id: string;
          payment_id: string;
          txn_ref: string | null;
          reference: string | null;
          gateway_txn_id: string | null;
          amount: number;
          fees: number;
          tax: number;
          status: PaymentStatus;
          raw: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          payment_id: string;
          txn_ref?: string | null;
          reference?: string | null;
          gateway_txn_id?: string | null;
          amount: number;
          fees?: number;
          tax?: number;
          status?: PaymentStatus;
          raw?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payment_transactions"]["Insert"]>;
        Relationships: [];
      };
      payment_gateways: {
        Row: {
          id: string;
          display_name: string;
          provider: string;
          sandbox: boolean;
          api_key_encrypted: string | null;
          api_secret_encrypted: string | null;
          webhook_secret_encrypted: string | null;
          webhook_url: string | null;
          currency: string;
          is_enabled: boolean;
          priority: number;
          lifecycle_status: string;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          display_name: string;
          provider: string;
          sandbox?: boolean;
          api_key_encrypted?: string | null;
          api_secret_encrypted?: string | null;
          webhook_secret_encrypted?: string | null;
          webhook_url?: string | null;
          currency?: string;
          is_enabled?: boolean;
          priority?: number;
          lifecycle_status?: string;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payment_gateways"]["Insert"]>;
        Relationships: [];
      };
      payment_webhooks: {
        Row: {
          id: string;
          gateway_id: string | null;
          payment_id: string | null;
          event_type: string;
          payload: Json;
          signature: string | null;
          processed: boolean;
          processed_at: string | null;
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          gateway_id?: string | null;
          payment_id?: string | null;
          event_type: string;
          payload?: Json;
          signature?: string | null;
          processed?: boolean;
          processed_at?: string | null;
          error?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payment_webhooks"]["Insert"]>;
        Relationships: [];
      };
      settlements: {
        Row: {
          id: string;
          gateway_id: string | null;
          settlement_date: string;
          expected_amount: number;
          received_amount: number;
          difference: number;
          status: string;
          bank_reference: string | null;
          synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          gateway_id?: string | null;
          settlement_date: string;
          expected_amount?: number;
          received_amount?: number;
          difference?: number;
          status?: string;
          bank_reference?: string | null;
          synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["settlements"]["Insert"]>;
        Relationships: [];
      };
      payment_reconciliation: {
        Row: {
          id: string;
          reconciliation_date: string;
          payment_id: string | null;
          order_id: string | null;
          settlement_id: string | null;
          expected_amount: number;
          actual_amount: number;
          status: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reconciliation_date?: string;
          payment_id?: string | null;
          order_id?: string | null;
          settlement_id?: string | null;
          expected_amount?: number;
          actual_amount?: number;
          status?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payment_reconciliation"]["Insert"]>;
        Relationships: [];
      };
      payment_logs: {
        Row: {
          id: string;
          payment_id: string | null;
          gateway_id: string | null;
          level: string;
          message: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          payment_id?: string | null;
          gateway_id?: string | null;
          level?: string;
          message: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payment_logs"]["Insert"]>;
        Relationships: [];
      };
      saved_reports: {
        Row: {
          id: string;
          name: string;
          report_type: string;
          filters: Json;
          widget_config: Json;
          layout: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          report_type: string;
          filters?: Json;
          widget_config?: Json;
          layout?: Json;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["saved_reports"]["Insert"]>;
        Relationships: [];
      };
      scheduled_reports: {
        Row: {
          id: string;
          name: string;
          report_type: string;
          frequency: string;
          email: string;
          filters: Json;
          format: string;
          is_enabled: boolean;
          last_run_at: string | null;
          next_run_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          report_type: string;
          frequency: string;
          email: string;
          filters?: Json;
          format?: string;
          is_enabled?: boolean;
          last_run_at?: string | null;
          next_run_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["scheduled_reports"]["Insert"]>;
        Relationships: [];
      };
      report_exports: {
        Row: {
          id: string;
          report_type: string;
          format: string;
          status: string;
          row_count: number;
          file_name: string | null;
          filters: Json;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_type: string;
          format: string;
          status?: string;
          row_count?: number;
          file_name?: string | null;
          filters?: Json;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["report_exports"]["Insert"]>;
        Relationships: [];
      };
      analytics_snapshots: {
        Row: {
          id: string;
          snapshot_date: string;
          metric_key: string;
          metric_value: number;
          dimensions: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          snapshot_date?: string;
          metric_key: string;
          metric_value?: number;
          dimensions?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["analytics_snapshots"]["Insert"]>;
        Relationships: [];
      };
      dashboard_widgets: {
        Row: {
          id: string;
          user_id: string;
          widget_key: string;
          visible: boolean;
          sort_order: number;
          config: Json;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          widget_key: string;
          visible?: boolean;
          sort_order?: number;
          config?: Json;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["dashboard_widgets"]["Insert"]>;
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          category: string | null;
          vendor_id: string | null;
          amount: number;
          gst_amount: number;
          currency: string;
          note: string | null;
          notes: string | null;
          invoice_number: string | null;
          invoice_date: string | null;
          payment_status: string;
          attachments: Json;
          spent_at: string;
          created_by: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category?: string | null;
          vendor_id?: string | null;
          amount: number;
          gst_amount?: number;
          currency?: string;
          note?: string | null;
          notes?: string | null;
          invoice_number?: string | null;
          invoice_date?: string | null;
          payment_status?: string;
          attachments?: Json;
          spent_at?: string;
          created_by?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["expenses"]["Insert"]>;
        Relationships: [];
      };
      transactions: {
        Row: {
          id: string;
          type: string;
          amount: number;
          currency: string;
          reference: string | null;
          note: string | null;
          occurred_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          amount: number;
          currency?: string;
          reference?: string | null;
          note?: string | null;
          occurred_at?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>;
        Relationships: [];
      };
      gst_reports: {
        Row: {
          id: string;
          period_start: string;
          period_end: string;
          report_type: string;
          total_taxable: number;
          total_gst: number;
          input_credit: number;
          output_tax: number;
          gst_payable: number;
          report: Json;
          exported_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          period_start: string;
          period_end: string;
          report_type?: string;
          total_taxable?: number;
          total_gst?: number;
          input_credit?: number;
          output_tax?: number;
          gst_payable?: number;
          report?: Json;
          exported_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["gst_reports"]["Insert"]>;
        Relationships: [];
      };
      finance_vendors: {
        Row: {
          id: string;
          name: string;
          gst_number: string | null;
          pan: string | null;
          bank_details: Json;
          contact_person: string | null;
          email: string | null;
          phone: string | null;
          payment_terms: string | null;
          outstanding_balance: number;
          is_active: boolean;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          gst_number?: string | null;
          pan?: string | null;
          bank_details?: Json;
          contact_person?: string | null;
          email?: string | null;
          phone?: string | null;
          payment_terms?: string | null;
          outstanding_balance?: number;
          is_active?: boolean;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["finance_vendors"]["Insert"]>;
        Relationships: [];
      };
      journal_entries: {
        Row: {
          id: string;
          reference: string;
          narration: string | null;
          status: string;
          entry_date: string;
          total_debit: number;
          total_credit: number;
          reversed_by_entry_id: string | null;
          approved_by: string | null;
          approved_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reference: string;
          narration?: string | null;
          status?: string;
          entry_date?: string;
          total_debit?: number;
          total_credit?: number;
          reversed_by_entry_id?: string | null;
          approved_by?: string | null;
          approved_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["journal_entries"]["Insert"]>;
        Relationships: [];
      };
      ledger_entries: {
        Row: {
          id: string;
          ledger_type: string;
          account_code: string | null;
          reference: string | null;
          narration: string | null;
          debit: number;
          credit: number;
          currency: string;
          entry_date: string;
          journal_entry_id: string | null;
          vendor_id: string | null;
          customer_id: string | null;
          order_id: string | null;
          expense_id: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          ledger_type: string;
          account_code?: string | null;
          reference?: string | null;
          narration?: string | null;
          debit?: number;
          credit?: number;
          currency?: string;
          entry_date?: string;
          journal_entry_id?: string | null;
          vendor_id?: string | null;
          customer_id?: string | null;
          order_id?: string | null;
          expense_id?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ledger_entries"]["Insert"]>;
        Relationships: [];
      };
      bank_accounts: {
        Row: {
          id: string;
          name: string;
          bank_name: string;
          account_number: string;
          ifsc: string | null;
          balance: number;
          currency: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          bank_name: string;
          account_number: string;
          ifsc?: string | null;
          balance?: number;
          currency?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bank_accounts"]["Insert"]>;
        Relationships: [];
      };
      bank_transactions: {
        Row: {
          id: string;
          bank_account_id: string;
          type: string;
          amount: number;
          reference: string | null;
          description: string | null;
          transaction_date: string;
          matched: boolean;
          reconciliation_id: string | null;
          payment_id: string | null;
          settlement_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          bank_account_id: string;
          type: string;
          amount: number;
          reference?: string | null;
          description?: string | null;
          transaction_date?: string;
          matched?: boolean;
          reconciliation_id?: string | null;
          payment_id?: string | null;
          settlement_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bank_transactions"]["Insert"]>;
        Relationships: [];
      };
      bank_reconciliation: {
        Row: {
          id: string;
          bank_account_id: string;
          statement_date: string;
          opening_balance: number;
          closing_balance: number;
          matched_count: number;
          unmatched_count: number;
          status: string;
          notes: string | null;
          reconciled_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bank_account_id: string;
          statement_date: string;
          opening_balance?: number;
          closing_balance?: number;
          matched_count?: number;
          unmatched_count?: number;
          status?: string;
          notes?: string | null;
          reconciled_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bank_reconciliation"]["Insert"]>;
        Relationships: [];
      };
      vendor_payments: {
        Row: {
          id: string;
          vendor_id: string;
          expense_id: string | null;
          amount: number;
          payment_status: string;
          scheduled_date: string | null;
          paid_at: string | null;
          reference: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          expense_id?: string | null;
          amount: number;
          payment_status?: string;
          scheduled_date?: string | null;
          paid_at?: string | null;
          reference?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["vendor_payments"]["Insert"]>;
        Relationships: [];
      };
      marketing_templates: {
        Row: {
          id: string;
          name: string;
          channel: string;
          subject: string | null;
          preview_text: string | null;
          body_html: string | null;
          body_text: string | null;
          title: string | null;
          message: string | null;
          image_url: string | null;
          deep_link: string | null;
          media_url: string | null;
          buttons: Json;
          variables: Json;
          status: string;
          deleted_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          channel: string;
          subject?: string | null;
          preview_text?: string | null;
          body_html?: string | null;
          body_text?: string | null;
          title?: string | null;
          message?: string | null;
          image_url?: string | null;
          deep_link?: string | null;
          media_url?: string | null;
          buttons?: Json;
          variables?: Json;
          status?: string;
          deleted_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["marketing_templates"]["Insert"]>;
        Relationships: [];
      };
      marketing_segments: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          segment_type: string;
          criteria: Json;
          customer_count: number;
          is_active: boolean;
          deleted_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          segment_type?: string;
          criteria?: Json;
          customer_count?: number;
          is_active?: boolean;
          deleted_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["marketing_segments"]["Insert"]>;
        Relationships: [];
      };
      marketing_campaigns: {
        Row: {
          id: string;
          name: string;
          campaign_type: string;
          status: string;
          template_id: string | null;
          segment_id: string | null;
          subject: string | null;
          preview_text: string | null;
          sender_name: string | null;
          reply_to: string | null;
          title: string | null;
          message: string | null;
          image_url: string | null;
          deep_link: string | null;
          media_url: string | null;
          buttons: Json;
          scheduled_at: string | null;
          started_at: string | null;
          completed_at: string | null;
          sent_count: number;
          delivered_count: number;
          opened_count: number;
          clicked_count: number;
          bounced_count: number;
          conversion_count: number;
          revenue: number;
          deleted_at: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          campaign_type: string;
          status?: string;
          template_id?: string | null;
          segment_id?: string | null;
          subject?: string | null;
          preview_text?: string | null;
          sender_name?: string | null;
          reply_to?: string | null;
          title?: string | null;
          message?: string | null;
          image_url?: string | null;
          deep_link?: string | null;
          media_url?: string | null;
          buttons?: Json;
          scheduled_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          sent_count?: number;
          delivered_count?: number;
          opened_count?: number;
          clicked_count?: number;
          bounced_count?: number;
          conversion_count?: number;
          revenue?: number;
          deleted_at?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["marketing_campaigns"]["Insert"]>;
        Relationships: [];
      };
      marketing_automation: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          workflow_type: string;
          trigger_event: string;
          delay_minutes: number;
          segment_id: string | null;
          action_type: string;
          template_id: string | null;
          is_enabled: boolean;
          last_run_at: string | null;
          run_count: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          workflow_type: string;
          trigger_event: string;
          delay_minutes?: number;
          segment_id?: string | null;
          action_type: string;
          template_id?: string | null;
          is_enabled?: boolean;
          last_run_at?: string | null;
          run_count?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["marketing_automation"]["Insert"]>;
        Relationships: [];
      };
      campaign_recipients: {
        Row: {
          id: string;
          campaign_id: string;
          customer_id: string | null;
          email: string | null;
          phone: string | null;
          status: string;
          sent_at: string | null;
          opened_at: string | null;
          clicked_at: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          customer_id?: string | null;
          email?: string | null;
          phone?: string | null;
          status?: string;
          sent_at?: string | null;
          opened_at?: string | null;
          clicked_at?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["campaign_recipients"]["Insert"]>;
        Relationships: [];
      };
      campaign_events: {
        Row: {
          id: string;
          campaign_id: string;
          recipient_id: string | null;
          event_type: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          recipient_id?: string | null;
          event_type: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["campaign_events"]["Insert"]>;
        Relationships: [];
      };
      email_queue: {
        Row: {
          id: string;
          campaign_id: string | null;
          recipient_id: string | null;
          to_email: string;
          subject: string;
          body_html: string | null;
          body_text: string | null;
          status: string;
          scheduled_at: string | null;
          sent_at: string | null;
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id?: string | null;
          recipient_id?: string | null;
          to_email: string;
          subject: string;
          body_html?: string | null;
          body_text?: string | null;
          status?: string;
          scheduled_at?: string | null;
          sent_at?: string | null;
          error?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["email_queue"]["Insert"]>;
        Relationships: [];
      };
      whatsapp_queue: {
        Row: {
          id: string;
          campaign_id: string | null;
          recipient_id: string | null;
          to_phone: string;
          template_name: string | null;
          body: string | null;
          media_url: string | null;
          buttons: Json;
          status: string;
          scheduled_at: string | null;
          sent_at: string | null;
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id?: string | null;
          recipient_id?: string | null;
          to_phone: string;
          template_name?: string | null;
          body?: string | null;
          media_url?: string | null;
          buttons?: Json;
          status?: string;
          scheduled_at?: string | null;
          sent_at?: string | null;
          error?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["whatsapp_queue"]["Insert"]>;
        Relationships: [];
      };
      push_queue: {
        Row: {
          id: string;
          campaign_id: string | null;
          recipient_id: string | null;
          user_id: string | null;
          title: string;
          message: string;
          image_url: string | null;
          deep_link: string | null;
          status: string;
          scheduled_at: string | null;
          sent_at: string | null;
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id?: string | null;
          recipient_id?: string | null;
          user_id?: string | null;
          title: string;
          message: string;
          image_url?: string | null;
          deep_link?: string | null;
          status?: string;
          scheduled_at?: string | null;
          sent_at?: string | null;
          error?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["push_queue"]["Insert"]>;
        Relationships: [];
      };
      shipments: {
        Row: {
          id: string;
          order_id: string;
          warehouse_id: string | null;
          shipping_method_id: string | null;
          carrier_id: string | null;
          carrier: string | null;
          tracking_number: string | null;
          label_url: string | null;
          status: ShipmentStatus;
          weight_grams: number | null;
          dimensions: Json;
          estimated_delivery: string | null;
          shipped_at: string | null;
          delivered_at: string | null;
          cancelled_at: string | null;
          pickup_status: string | null;
          manifest_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          warehouse_id?: string | null;
          shipping_method_id?: string | null;
          carrier_id?: string | null;
          carrier?: string | null;
          tracking_number?: string | null;
          label_url?: string | null;
          status?: ShipmentStatus;
          weight_grams?: number | null;
          dimensions?: Json;
          estimated_delivery?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          cancelled_at?: string | null;
          pickup_status?: string | null;
          manifest_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["shipments"]["Insert"]>;
        Relationships: [];
      };
      tracking_events: {
        Row: {
          id: string;
          shipment_id: string;
          status: ShipmentStatus;
          event_type: string;
          message: string | null;
          location: string | null;
          raw: Json;
          occurred_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          shipment_id: string;
          status: ShipmentStatus;
          event_type?: string;
          message?: string | null;
          location?: string | null;
          raw?: Json;
          occurred_at?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tracking_events"]["Insert"]>;
        Relationships: [];
      };
      shipment_tracking: {
        Row: {
          id: string;
          shipment_id: string;
          order_id: string;
          tracking_number: string | null;
          status: string;
          status_code: string | null;
          message: string | null;
          location: string | null;
          event_time: string;
          raw: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          shipment_id: string;
          order_id: string;
          tracking_number?: string | null;
          status: string;
          status_code?: string | null;
          message?: string | null;
          location?: string | null;
          event_time?: string;
          raw?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["shipment_tracking"]["Insert"]>;
        Relationships: [];
      };
      courier_logs: {
        Row: {
          id: string;
          shipment_id: string | null;
          order_id: string | null;
          courier_name: string;
          action: string;
          request_url: string | null;
          request_body: Json | null;
          response_body: Json | null;
          status_code: number | null;
          success: boolean;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          shipment_id?: string | null;
          order_id?: string | null;
          courier_name?: string;
          action: string;
          request_url?: string | null;
          request_body?: Json | null;
          response_body?: Json | null;
          status_code?: number | null;
          success?: boolean;
          error_message?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["courier_logs"]["Insert"]>;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          table_name: string;
          record_id: string | null;
          action: string;
          old_data: Json | null;
          new_data: Json | null;
          changed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          table_name: string;
          record_id?: string | null;
          action: string;
          old_data?: Json | null;
          new_data?: Json | null;
          changed_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
        Relationships: [];
      };
      homepage_settings: {
        Row: {
          id: string;
          key: string;
          value: Json;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value?: Json;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["homepage_settings"]["Insert"]>;
        Relationships: [];
      };
      homepage_sections: {
        Row: {
          id: string;
          key: string;
          title: string | null;
          position: number;
          is_enabled: boolean;
          config: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          title?: string | null;
          position?: number;
          is_enabled?: boolean;
          config?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["homepage_sections"]["Insert"]>;
        Relationships: [];
      };
      hero_slides: {
        Row: {
          id: string;
          title: string | null;
          subtitle: string | null;
          description: string | null;
          image_url: string | null;
          background_url: string | null;
          overlay: number;
          cta_label: string | null;
          cta_url: string | null;
          secondary_cta_label: string | null;
          secondary_cta_url: string | null;
          position: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title?: string | null;
          subtitle?: string | null;
          description?: string | null;
          image_url?: string | null;
          background_url?: string | null;
          overlay?: number;
          cta_label?: string | null;
          cta_url?: string | null;
          secondary_cta_label?: string | null;
          secondary_cta_url?: string | null;
          position?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["hero_slides"]["Insert"]>;
        Relationships: [];
      };
      testimonials: {
        Row: {
          id: string;
          name: string;
          city: string | null;
          rating: number;
          text: string;
          avatar_url: string | null;
          is_published: boolean;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          city?: string | null;
          rating?: number;
          text: string;
          avatar_url?: string | null;
          is_published?: boolean;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["testimonials"]["Insert"]>;
        Relationships: [];
      };
      banners: {
        Row: {
          id: string;
          title: string | null;
          image_url: string | null;
          link_url: string | null;
          placement: string | null;
          position: number;
          is_active: boolean;
          starts_at: string | null;
          ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title?: string | null;
          image_url?: string | null;
          link_url?: string | null;
          placement?: string | null;
          position?: number;
          is_active?: boolean;
          starts_at?: string | null;
          ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["banners"]["Insert"]>;
        Relationships: [];
      };
      media_folders: {
        Row: {
          id: string;
          name: string;
          parent_id: string | null;
          slug: string | null;
          bucket: string | null;
          path_prefix: string;
          icon: string | null;
          is_system: boolean;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          parent_id?: string | null;
          slug?: string | null;
          bucket?: string | null;
          path_prefix?: string;
          icon?: string | null;
          is_system?: boolean;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["media_folders"]["Insert"]>;
        Relationships: [];
      };
      media_library: {
        Row: {
          id: string;
          folder_id: string | null;
          bucket: string;
          path: string;
          url: string | null;
          mime_type: string | null;
          size_bytes: number | null;
          original_name: string | null;
          width: number | null;
          height: number | null;
          blur_data_url: string | null;
          alt: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          folder_id?: string | null;
          bucket: string;
          path: string;
          url?: string | null;
          mime_type?: string | null;
          size_bytes?: number | null;
          original_name?: string | null;
          width?: number | null;
          height?: number | null;
          blur_data_url?: string | null;
          alt?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["media_library"]["Insert"]>;
        Relationships: [];
      };
      settings: {
        Row: {
          id: string;
          key: string;
          value: Json;
          description: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value?: Json;
          description?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["settings"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_user_role: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      current_user_permissions: {
        Args: Record<string, never>;
        Returns: string[];
      };
      log_activity: {
        Args: {
          p_action: string;
          p_entity?: string | null;
          p_entity_id?: string | null;
          p_metadata?: Json;
        };
        Returns: undefined;
      };
      log_audit: {
        Args: {
          p_table: string;
          p_record: string;
          p_action: string;
          p_old?: Json | null;
          p_new?: Json | null;
        };
        Returns: undefined;
      };
    };
    Enums: {
      product_status: ProductStatus;
      order_status: OrderStatus;
      payment_status: PaymentStatus;
      shipment_status: ShipmentStatus;
      discount_type: "percent" | "fixed";
      movement_type: MovementType;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
