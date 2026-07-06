/**
 * Supabase database types — auto-generated from the live Postgres schema.
 *
 * Regenerate: npm run db:types
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_snapshots: {
        Row: {
          created_at: string
          dimensions: Json
          id: string
          metric_key: string
          metric_value: number
          snapshot_date: string
        }
        Insert: {
          created_at?: string
          dimensions?: Json
          id?: string
          metric_key: string
          metric_value?: number
          snapshot_date?: string
        }
        Update: {
          created_at?: string
          dimensions?: Json
          id?: string
          metric_key?: string
          metric_value?: number
          snapshot_date?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          changed_by: string | null
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_number: string
          balance: number
          bank_name: string
          created_at: string
          currency: string
          id: string
          ifsc: string | null
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          account_number: string
          balance?: number
          bank_name: string
          created_at?: string
          currency?: string
          id?: string
          ifsc?: string | null
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          account_number?: string
          balance?: number
          bank_name?: string
          created_at?: string
          currency?: string
          id?: string
          ifsc?: string | null
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      bank_reconciliation: {
        Row: {
          bank_account_id: string
          closing_balance: number
          created_at: string
          created_by: string | null
          id: string
          matched_count: number
          notes: string | null
          opening_balance: number
          reconciled_at: string | null
          statement_date: string
          status: string
          unmatched_count: number
          updated_at: string
        }
        Insert: {
          bank_account_id: string
          closing_balance?: number
          created_at?: string
          created_by?: string | null
          id?: string
          matched_count?: number
          notes?: string | null
          opening_balance?: number
          reconciled_at?: string | null
          statement_date: string
          status?: string
          unmatched_count?: number
          updated_at?: string
        }
        Update: {
          bank_account_id?: string
          closing_balance?: number
          created_at?: string
          created_by?: string | null
          id?: string
          matched_count?: number
          notes?: string | null
          opening_balance?: number
          reconciled_at?: string | null
          statement_date?: string
          status?: string
          unmatched_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_reconciliation_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          amount: number
          bank_account_id: string
          created_at: string
          description: string | null
          id: string
          matched: boolean
          payment_id: string | null
          reconciliation_id: string | null
          reference: string | null
          settlement_id: string | null
          transaction_date: string
          type: string
        }
        Insert: {
          amount: number
          bank_account_id: string
          created_at?: string
          description?: string | null
          id?: string
          matched?: boolean
          payment_id?: string | null
          reconciliation_id?: string | null
          reference?: string | null
          settlement_id?: string | null
          transaction_date?: string
          type: string
        }
        Update: {
          amount?: number
          bank_account_id?: string
          created_at?: string
          description?: string | null
          id?: string
          matched?: boolean
          payment_id?: string | null
          reconciliation_id?: string | null
          reference?: string | null
          settlement_id?: string | null
          transaction_date?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_reconciliation_id_fkey"
            columns: ["reconciliation_id"]
            isOneToOne: false
            referencedRelation: "bank_reconciliation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_settlement_id_fkey"
            columns: ["settlement_id"]
            isOneToOne: false
            referencedRelation: "settlements"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          link_url: string | null
          placement: string | null
          position: number
          starts_at: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          placement?: string | null
          position?: number
          starts_at?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          placement?: string | null
          position?: number
          starts_at?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      benefits: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      blogs: {
        Row: {
          author_id: string | null
          content: string | null
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          published_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blogs_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          banner_url: string | null
          canonical_url: string | null
          country_of_origin: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          logo_url: string | null
          meta_keywords: string | null
          name: string
          position: number
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          banner_url?: string | null
          canonical_url?: string | null
          country_of_origin?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          logo_url?: string | null
          meta_keywords?: string | null
          name: string
          position?: number
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          banner_url?: string | null
          canonical_url?: string | null
          country_of_origin?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          logo_url?: string | null
          meta_keywords?: string | null
          name?: string
          position?: number
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      campaign_events: {
        Row: {
          campaign_id: string
          created_at: string
          event_type: string
          id: string
          metadata: Json
          recipient_id: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          recipient_id?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          recipient_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_events_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "campaign_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_recipients: {
        Row: {
          campaign_id: string
          clicked_at: string | null
          created_at: string
          customer_id: string | null
          email: string | null
          id: string
          metadata: Json
          opened_at: string | null
          phone: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          campaign_id: string
          clicked_at?: string | null
          created_at?: string
          customer_id?: string | null
          email?: string | null
          id?: string
          metadata?: Json
          opened_at?: string | null
          phone?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          campaign_id?: string
          clicked_at?: string | null
          created_at?: string
          customer_id?: string | null
          email?: string | null
          id?: string
          metadata?: Json
          opened_at?: string | null
          phone?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_recipients_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      cart: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          product_variant_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          product_variant_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          product_variant_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "cart"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          banner_url: string | null
          canonical_url: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          icon_url: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          meta_keywords: string | null
          name: string
          parent_id: string | null
          position: number
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          canonical_url?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          meta_keywords?: string | null
          name: string
          parent_id?: string | null
          position?: number
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          canonical_url?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          icon_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          meta_keywords?: string | null
          name?: string
          parent_id?: string | null
          position?: number
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_queries: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      coupon_usage: {
        Row: {
          coupon_id: string
          customer_id: string | null
          discount_amount: number
          id: string
          order_id: string | null
          order_subtotal: number | null
          used_at: string
        }
        Insert: {
          coupon_id: string
          customer_id?: string | null
          discount_amount?: number
          id?: string
          order_id?: string | null
          order_subtotal?: number | null
          used_at?: string
        }
        Update: {
          coupon_id?: string
          customer_id?: string | null
          discount_amount?: number
          id?: string
          order_id?: string | null
          order_subtotal?: number | null
          used_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          allow_stack: boolean
          auto_apply: boolean
          auto_conditions: Json
          buy_x_get_y: Json
          code: string
          created_at: string
          deleted_at: string | null
          description: string | null
          eligibility: Json
          expires_at: string | null
          first_order_only: boolean
          free_shipping: Json
          id: string
          is_active: boolean
          is_exclusive: boolean
          lifecycle_status: string
          logged_in_only: boolean
          max_discount: number | null
          max_uses: number | null
          min_order: number
          name: string | null
          per_customer_limit: number | null
          priority: number
          promo_type: string | null
          starts_at: string | null
          timezone: string
          total_revenue: number
          type: Database["public"]["Enums"]["discount_type"]
          updated_at: string
          used_count: number
          value: number
        }
        Insert: {
          allow_stack?: boolean
          auto_apply?: boolean
          auto_conditions?: Json
          buy_x_get_y?: Json
          code: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          eligibility?: Json
          expires_at?: string | null
          first_order_only?: boolean
          free_shipping?: Json
          id?: string
          is_active?: boolean
          is_exclusive?: boolean
          lifecycle_status?: string
          logged_in_only?: boolean
          max_discount?: number | null
          max_uses?: number | null
          min_order?: number
          name?: string | null
          per_customer_limit?: number | null
          priority?: number
          promo_type?: string | null
          starts_at?: string | null
          timezone?: string
          total_revenue?: number
          type: Database["public"]["Enums"]["discount_type"]
          updated_at?: string
          used_count?: number
          value: number
        }
        Update: {
          allow_stack?: boolean
          auto_apply?: boolean
          auto_conditions?: Json
          buy_x_get_y?: Json
          code?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          eligibility?: Json
          expires_at?: string | null
          first_order_only?: boolean
          free_shipping?: Json
          id?: string
          is_active?: boolean
          is_exclusive?: boolean
          lifecycle_status?: string
          logged_in_only?: boolean
          max_discount?: number | null
          max_uses?: number | null
          min_order?: number
          name?: string | null
          per_customer_limit?: number | null
          priority?: number
          promo_type?: string | null
          starts_at?: string | null
          timezone?: string
          total_revenue?: number
          type?: Database["public"]["Enums"]["discount_type"]
          updated_at?: string
          used_count?: number
          value?: number
        }
        Relationships: []
      }
      courier_logs: {
        Row: {
          action: string
          courier_name: string
          created_at: string
          error_message: string | null
          id: string
          order_id: string | null
          request_body: Json | null
          request_url: string | null
          response_body: Json | null
          shipment_id: string | null
          status_code: number | null
          success: boolean
        }
        Insert: {
          action: string
          courier_name?: string
          created_at?: string
          error_message?: string | null
          id?: string
          order_id?: string | null
          request_body?: Json | null
          request_url?: string | null
          response_body?: Json | null
          shipment_id?: string | null
          status_code?: number | null
          success?: boolean
        }
        Update: {
          action?: string
          courier_name?: string
          created_at?: string
          error_message?: string | null
          id?: string
          order_id?: string | null
          request_body?: Json | null
          request_url?: string | null
          response_body?: Json | null
          shipment_id?: string | null
          status_code?: number | null
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "courier_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courier_logs_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_addresses: {
        Row: {
          city: string
          country: string
          created_at: string
          customer_id: string
          full_name: string | null
          id: string
          is_default: boolean
          line1: string
          line2: string | null
          phone: string | null
          pincode: string
          state: string
          type: string
          updated_at: string
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          customer_id: string
          full_name?: string | null
          id?: string
          is_default?: boolean
          line1: string
          line2?: string | null
          phone?: string | null
          pincode: string
          state: string
          type?: string
          updated_at?: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          customer_id?: string
          full_name?: string | null
          id?: string
          is_default?: boolean
          line1?: string
          line2?: string | null
          phone?: string | null
          pincode?: string
          state?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_events: {
        Row: {
          created_at: string
          created_by: string | null
          customer_id: string
          id: string
          message: string
          metadata: Json
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          customer_id: string
          id?: string
          message: string
          metadata?: Json
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          customer_id?: string
          id?: string
          message?: string
          metadata?: Json
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          full_name: string | null
          id: string
          internal_notes: string | null
          is_vip: boolean
          notes: string | null
          phone: string | null
          profile_id: string | null
          status: string
          tags: Json
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          internal_notes?: string | null
          is_vip?: boolean
          notes?: string | null
          phone?: string | null
          profile_id?: string | null
          status?: string
          tags?: Json
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          internal_notes?: string | null
          is_vip?: boolean
          notes?: string | null
          phone?: string | null
          profile_id?: string | null
          status?: string
          tags?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_widgets: {
        Row: {
          config: Json
          id: string
          sort_order: number
          updated_at: string
          user_id: string
          visible: boolean
          widget_key: string
        }
        Insert: {
          config?: Json
          id?: string
          sort_order?: number
          updated_at?: string
          user_id: string
          visible?: boolean
          widget_key: string
        }
        Update: {
          config?: Json
          id?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
          visible?: boolean
          widget_key?: string
        }
        Relationships: []
      }
      email_queue: {
        Row: {
          body_html: string | null
          body_text: string | null
          campaign_id: string | null
          created_at: string
          error: string | null
          id: string
          recipient_id: string | null
          scheduled_at: string | null
          sent_at: string | null
          status: string
          subject: string
          to_email: string
        }
        Insert: {
          body_html?: string | null
          body_text?: string | null
          campaign_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          recipient_id?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          to_email: string
        }
        Update: {
          body_html?: string | null
          body_text?: string | null
          campaign_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          recipient_id?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          to_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_queue_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_queue_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "campaign_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          attachments: Json
          category: string | null
          created_at: string
          created_by: string | null
          currency: string
          deleted_at: string | null
          gst_amount: number
          id: string
          invoice_date: string | null
          invoice_number: string | null
          note: string | null
          notes: string | null
          payment_status: string
          spent_at: string
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          amount: number
          attachments?: Json
          category?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          gst_amount?: number
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          note?: string | null
          notes?: string | null
          payment_status?: string
          spent_at?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          attachments?: Json
          category?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deleted_at?: string | null
          gst_amount?: number
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          note?: string | null
          notes?: string | null
          payment_status?: string
          spent_at?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "finance_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          id: string
          is_published: boolean
          position: number
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          position?: number
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          position?: number
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      finance_vendors: {
        Row: {
          bank_details: Json
          contact_person: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          gst_number: string | null
          id: string
          is_active: boolean
          name: string
          outstanding_balance: number
          pan: string | null
          payment_terms: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          bank_details?: Json
          contact_person?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          gst_number?: string | null
          id?: string
          is_active?: boolean
          name: string
          outstanding_balance?: number
          pan?: string | null
          payment_terms?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          bank_details?: Json
          contact_person?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          gst_number?: string | null
          id?: string
          is_active?: boolean
          name?: string
          outstanding_balance?: number
          pan?: string | null
          payment_terms?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      gift_card_transactions: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          gift_card_id: string
          id: string
          notes: string | null
          order_id: string | null
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          gift_card_id: string
          id?: string
          notes?: string | null
          order_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          gift_card_id?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_card_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_card_transactions_gift_card_id_fkey"
            columns: ["gift_card_id"]
            isOneToOne: false
            referencedRelation: "gift_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_card_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_cards: {
        Row: {
          balance: number
          code: string
          created_at: string
          currency: string
          customer_id: string | null
          expires_at: string | null
          id: string
          initial_balance: number
          is_active: boolean
          issued_by: string | null
          issued_to_email: string | null
          name: string | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          balance?: number
          code: string
          created_at?: string
          currency?: string
          customer_id?: string | null
          expires_at?: string | null
          id?: string
          initial_balance?: number
          is_active?: boolean
          issued_by?: string | null
          issued_to_email?: string | null
          name?: string | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          balance?: number
          code?: string
          created_at?: string
          currency?: string
          customer_id?: string | null
          expires_at?: string | null
          id?: string
          initial_balance?: number
          is_active?: boolean
          issued_by?: string | null
          issued_to_email?: string | null
          name?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_cards_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_cards_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gst_reports: {
        Row: {
          created_at: string
          exported_at: string | null
          gst_payable: number
          id: string
          input_credit: number
          output_tax: number
          period_end: string
          period_start: string
          report: Json
          report_type: string
          total_gst: number
          total_taxable: number
        }
        Insert: {
          created_at?: string
          exported_at?: string | null
          gst_payable?: number
          id?: string
          input_credit?: number
          output_tax?: number
          period_end: string
          period_start: string
          report?: Json
          report_type?: string
          total_gst?: number
          total_taxable?: number
        }
        Update: {
          created_at?: string
          exported_at?: string | null
          gst_payable?: number
          id?: string
          input_credit?: number
          output_tax?: number
          period_end?: string
          period_start?: string
          report?: Json
          report_type?: string
          total_gst?: number
          total_taxable?: number
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          background_url: string | null
          created_at: string
          cta_label: string | null
          cta_url: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          overlay: number
          position: number
          secondary_cta_label: string | null
          secondary_cta_url: string | null
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          background_url?: string | null
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          overlay?: number
          position?: number
          secondary_cta_label?: string | null
          secondary_cta_url?: string | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          background_url?: string | null
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          overlay?: number
          position?: number
          secondary_cta_label?: string | null
          secondary_cta_url?: string | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      homepage_sections: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_enabled: boolean
          key: string
          position: number
          title: string | null
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          key: string
          position?: number
          title?: string | null
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          key?: string
          position?: number
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      homepage_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      ingredients: {
        Row: {
          created_at: string
          description: string | null
          id: string
          inci_name: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          inci_name?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          inci_name?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory: {
        Row: {
          created_at: string
          id: string
          product_variant_id: string
          quantity: number
          reorder_level: number
          reserved: number
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_variant_id: string
          quantity?: number
          reorder_level?: number
          reserved?: number
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_variant_id?: string
          quantity?: number
          reorder_level?: number
          reserved?: number
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          entry_date: string
          id: string
          narration: string | null
          reference: string
          reversed_by_entry_id: string | null
          status: string
          total_credit: number
          total_debit: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          entry_date?: string
          id?: string
          narration?: string | null
          reference: string
          reversed_by_entry_id?: string | null
          status?: string
          total_credit?: number
          total_debit?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          entry_date?: string
          id?: string
          narration?: string | null
          reference?: string
          reversed_by_entry_id?: string | null
          status?: string
          total_credit?: number
          total_debit?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_reversed_by_entry_id_fkey"
            columns: ["reversed_by_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_entries: {
        Row: {
          account_code: string | null
          created_at: string
          created_by: string | null
          credit: number
          currency: string
          customer_id: string | null
          debit: number
          entry_date: string
          expense_id: string | null
          id: string
          journal_entry_id: string | null
          ledger_type: string
          narration: string | null
          order_id: string | null
          reference: string | null
          vendor_id: string | null
        }
        Insert: {
          account_code?: string | null
          created_at?: string
          created_by?: string | null
          credit?: number
          currency?: string
          customer_id?: string | null
          debit?: number
          entry_date?: string
          expense_id?: string | null
          id?: string
          journal_entry_id?: string | null
          ledger_type: string
          narration?: string | null
          order_id?: string | null
          reference?: string | null
          vendor_id?: string | null
        }
        Update: {
          account_code?: string | null
          created_at?: string
          created_by?: string | null
          credit?: number
          currency?: string
          customer_id?: string | null
          debit?: number
          entry_date?: string
          expense_id?: string | null
          id?: string
          journal_entry_id?: string | null
          ledger_type?: string
          narration?: string | null
          order_id?: string | null
          reference?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_entries_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_entries_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "finance_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_points: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          order_id: string | null
          points: number
          reason: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          order_id?: string | null
          points?: number
          reason?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          order_id?: string | null
          points?: number
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_points_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_points_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_automation: {
        Row: {
          action_type: string
          created_at: string
          created_by: string | null
          delay_minutes: number
          description: string | null
          id: string
          is_enabled: boolean
          last_run_at: string | null
          name: string
          run_count: number
          segment_id: string | null
          slug: string
          template_id: string | null
          trigger_event: string
          updated_at: string
          workflow_type: string
        }
        Insert: {
          action_type: string
          created_at?: string
          created_by?: string | null
          delay_minutes?: number
          description?: string | null
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          name: string
          run_count?: number
          segment_id?: string | null
          slug: string
          template_id?: string | null
          trigger_event: string
          updated_at?: string
          workflow_type: string
        }
        Update: {
          action_type?: string
          created_at?: string
          created_by?: string | null
          delay_minutes?: number
          description?: string | null
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          name?: string
          run_count?: number
          segment_id?: string | null
          slug?: string
          template_id?: string | null
          trigger_event?: string
          updated_at?: string
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_automation_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "marketing_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_automation_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "marketing_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_campaigns: {
        Row: {
          bounced_count: number
          buttons: Json
          campaign_type: string
          clicked_count: number
          completed_at: string | null
          conversion_count: number
          created_at: string
          created_by: string | null
          deep_link: string | null
          deleted_at: string | null
          delivered_count: number
          id: string
          image_url: string | null
          media_url: string | null
          message: string | null
          name: string
          opened_count: number
          preview_text: string | null
          reply_to: string | null
          revenue: number
          scheduled_at: string | null
          segment_id: string | null
          sender_name: string | null
          sent_count: number
          started_at: string | null
          status: string
          subject: string | null
          template_id: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          bounced_count?: number
          buttons?: Json
          campaign_type: string
          clicked_count?: number
          completed_at?: string | null
          conversion_count?: number
          created_at?: string
          created_by?: string | null
          deep_link?: string | null
          deleted_at?: string | null
          delivered_count?: number
          id?: string
          image_url?: string | null
          media_url?: string | null
          message?: string | null
          name: string
          opened_count?: number
          preview_text?: string | null
          reply_to?: string | null
          revenue?: number
          scheduled_at?: string | null
          segment_id?: string | null
          sender_name?: string | null
          sent_count?: number
          started_at?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          bounced_count?: number
          buttons?: Json
          campaign_type?: string
          clicked_count?: number
          completed_at?: string | null
          conversion_count?: number
          created_at?: string
          created_by?: string | null
          deep_link?: string | null
          deleted_at?: string | null
          delivered_count?: number
          id?: string
          image_url?: string | null
          media_url?: string | null
          message?: string | null
          name?: string
          opened_count?: number
          preview_text?: string | null
          reply_to?: string | null
          revenue?: number
          scheduled_at?: string | null
          segment_id?: string | null
          sender_name?: string | null
          sent_count?: number
          started_at?: string | null
          status?: string
          subject?: string | null
          template_id?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketing_campaigns_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "marketing_segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "marketing_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_segments: {
        Row: {
          created_at: string
          created_by: string | null
          criteria: Json
          customer_count: number
          deleted_at: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          segment_type: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          criteria?: Json
          customer_count?: number
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          segment_type?: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          criteria?: Json
          customer_count?: number
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          segment_type?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketing_templates: {
        Row: {
          body_html: string | null
          body_text: string | null
          buttons: Json
          channel: string
          created_at: string
          created_by: string | null
          deep_link: string | null
          deleted_at: string | null
          id: string
          image_url: string | null
          media_url: string | null
          message: string | null
          name: string
          preview_text: string | null
          status: string
          subject: string | null
          title: string | null
          updated_at: string
          variables: Json
        }
        Insert: {
          body_html?: string | null
          body_text?: string | null
          buttons?: Json
          channel: string
          created_at?: string
          created_by?: string | null
          deep_link?: string | null
          deleted_at?: string | null
          id?: string
          image_url?: string | null
          media_url?: string | null
          message?: string | null
          name: string
          preview_text?: string | null
          status?: string
          subject?: string | null
          title?: string | null
          updated_at?: string
          variables?: Json
        }
        Update: {
          body_html?: string | null
          body_text?: string | null
          buttons?: Json
          channel?: string
          created_at?: string
          created_by?: string | null
          deep_link?: string | null
          deleted_at?: string | null
          id?: string
          image_url?: string | null
          media_url?: string | null
          message?: string | null
          name?: string
          preview_text?: string | null
          status?: string
          subject?: string | null
          title?: string | null
          updated_at?: string
          variables?: Json
        }
        Relationships: []
      }
      media_folders: {
        Row: {
          bucket: string | null
          created_at: string
          icon: string | null
          id: string
          is_system: boolean
          name: string
          parent_id: string | null
          path_prefix: string
          position: number
          slug: string | null
          updated_at: string
        }
        Insert: {
          bucket?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_system?: boolean
          name: string
          parent_id?: string | null
          path_prefix?: string
          position?: number
          slug?: string | null
          updated_at?: string
        }
        Update: {
          bucket?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          is_system?: boolean
          name?: string
          parent_id?: string | null
          path_prefix?: string
          position?: number
          slug?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "media_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      media_library: {
        Row: {
          alt: string | null
          blur_data_url: string | null
          bucket: string
          created_at: string
          created_by: string | null
          folder_id: string | null
          height: number | null
          id: string
          mime_type: string | null
          original_name: string | null
          path: string
          size_bytes: number | null
          updated_at: string
          url: string | null
          width: number | null
        }
        Insert: {
          alt?: string | null
          blur_data_url?: string | null
          bucket: string
          created_at?: string
          created_by?: string | null
          folder_id?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          original_name?: string | null
          path: string
          size_bytes?: number | null
          updated_at?: string
          url?: string | null
          width?: number | null
        }
        Update: {
          alt?: string | null
          blur_data_url?: string | null
          bucket?: string
          created_at?: string
          created_by?: string | null
          folder_id?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          original_name?: string | null
          path?: string
          size_bytes?: number | null
          updated_at?: string
          url?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_library_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_library_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "media_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      ndr_events: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          reason: string
          resolved_at: string | null
          scheduled_at: string | null
          shipment_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          reason: string
          resolved_at?: string | null
          scheduled_at?: string | null
          shipment_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          reason?: string
          resolved_at?: string | null
          scheduled_at?: string | null
          shipment_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ndr_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string | null
          source: string | null
          subscribed_at: string | null
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name?: string | null
          source?: string | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string | null
          source?: string | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json
          id: string
          is_read: boolean
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          is_read?: boolean
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          is_read?: boolean
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_events: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          message: string
          metadata: Json
          order_id: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          metadata?: Json
          order_id: string
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          metadata?: Json
          order_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          name: string
          order_id: string
          product_id: string | null
          product_variant_id: string | null
          quantity: number
          sku: string | null
          tax_rate: number
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          order_id: string
          product_id?: string | null
          product_variant_id?: string | null
          quantity: number
          sku?: string | null
          tax_rate?: number
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          order_id?: string
          product_id?: string | null
          product_variant_id?: string | null
          quantity?: number
          sku?: string | null
          tax_rate?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_refunds: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          order_id: string
          payment_id: string | null
          reason: string | null
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          order_id: string
          payment_id?: string | null
          reason?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          payment_id?: string | null
          reason?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_refunds_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_refunds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_gstin: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          cgst_amount: number
          coupon_id: string | null
          created_at: string
          currency: string
          customer_id: string | null
          discount_total: number
          grand_total: number
          id: string
          igst_amount: number
          internal_notes: string | null
          notes: string | null
          order_number: string
          placed_at: string | null
          sgst_amount: number
          shipping_method_id: string | null
          shipping_state: string | null
          shipping_total: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax_total: number
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          buyer_gstin?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          cgst_amount?: number
          coupon_id?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          discount_total?: number
          grand_total?: number
          id?: string
          igst_amount?: number
          internal_notes?: string | null
          notes?: string | null
          order_number: string
          placed_at?: string | null
          sgst_amount?: number
          shipping_method_id?: string | null
          shipping_state?: string | null
          shipping_total?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax_total?: number
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          buyer_gstin?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          cgst_amount?: number
          coupon_id?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          discount_total?: number
          grand_total?: number
          id?: string
          igst_amount?: number
          internal_notes?: string | null
          notes?: string | null
          order_number?: string
          placed_at?: string | null
          sgst_amount?: number
          shipping_method_id?: string | null
          shipping_state?: string | null
          shipping_total?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax_total?: number
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shipping_method_id_fkey"
            columns: ["shipping_method_id"]
            isOneToOne: false
            referencedRelation: "shipping_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          content: string | null
          created_at: string
          id: string
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_gateways: {
        Row: {
          api_key_encrypted: string | null
          api_secret_encrypted: string | null
          created_at: string
          currency: string
          deleted_at: string | null
          display_name: string
          id: string
          is_enabled: boolean
          lifecycle_status: string
          priority: number
          provider: string
          sandbox: boolean
          updated_at: string
          webhook_secret_encrypted: string | null
          webhook_url: string | null
        }
        Insert: {
          api_key_encrypted?: string | null
          api_secret_encrypted?: string | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          display_name: string
          id?: string
          is_enabled?: boolean
          lifecycle_status?: string
          priority?: number
          provider: string
          sandbox?: boolean
          updated_at?: string
          webhook_secret_encrypted?: string | null
          webhook_url?: string | null
        }
        Update: {
          api_key_encrypted?: string | null
          api_secret_encrypted?: string | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          display_name?: string
          id?: string
          is_enabled?: boolean
          lifecycle_status?: string
          priority?: number
          provider?: string
          sandbox?: boolean
          updated_at?: string
          webhook_secret_encrypted?: string | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      payment_logs: {
        Row: {
          created_at: string
          gateway_id: string | null
          id: string
          level: string
          message: string
          metadata: Json
          payment_id: string | null
        }
        Insert: {
          created_at?: string
          gateway_id?: string | null
          id?: string
          level?: string
          message: string
          metadata?: Json
          payment_id?: string | null
        }
        Update: {
          created_at?: string
          gateway_id?: string | null
          id?: string
          level?: string
          message?: string
          metadata?: Json
          payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_logs_gateway_id_fkey"
            columns: ["gateway_id"]
            isOneToOne: false
            referencedRelation: "payment_gateways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_logs_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_reconciliation: {
        Row: {
          actual_amount: number
          created_at: string
          expected_amount: number
          id: string
          notes: string | null
          order_id: string | null
          payment_id: string | null
          reconciliation_date: string
          settlement_id: string | null
          status: string
        }
        Insert: {
          actual_amount?: number
          created_at?: string
          expected_amount?: number
          id?: string
          notes?: string | null
          order_id?: string | null
          payment_id?: string | null
          reconciliation_date?: string
          settlement_id?: string | null
          status?: string
        }
        Update: {
          actual_amount?: number
          created_at?: string
          expected_amount?: number
          id?: string
          notes?: string | null
          order_id?: string | null
          payment_id?: string | null
          reconciliation_date?: string
          settlement_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_reconciliation_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reconciliation_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reconciliation_settlement_id_fkey"
            columns: ["settlement_id"]
            isOneToOne: false
            referencedRelation: "settlements"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string
          fees: number
          gateway_txn_id: string | null
          id: string
          payment_id: string
          raw: Json | null
          reference: string | null
          status: Database["public"]["Enums"]["payment_status"]
          tax: number
          txn_ref: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          fees?: number
          gateway_txn_id?: string | null
          id?: string
          payment_id: string
          raw?: Json | null
          reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tax?: number
          txn_ref?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          fees?: number
          gateway_txn_id?: string | null
          id?: string
          payment_id?: string
          raw?: Json | null
          reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tax?: number
          txn_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhooks: {
        Row: {
          created_at: string
          error: string | null
          event_type: string
          gateway_id: string | null
          id: string
          payload: Json
          payment_id: string | null
          processed: boolean
          processed_at: string | null
          signature: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          event_type: string
          gateway_id?: string | null
          id?: string
          payload?: Json
          payment_id?: string | null
          processed?: boolean
          processed_at?: string | null
          signature?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          event_type?: string
          gateway_id?: string | null
          id?: string
          payload?: Json
          payment_id?: string | null
          processed?: boolean
          processed_at?: string | null
          signature?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_webhooks_gateway_id_fkey"
            columns: ["gateway_id"]
            isOneToOne: false
            referencedRelation: "payment_gateways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_webhooks_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          captured_at: string | null
          created_at: string
          currency: string
          customer_id: string | null
          failed_reason: string | null
          fees: number
          gateway_id: string | null
          gateway_txn_id: string | null
          id: string
          method: string | null
          order_id: string
          payment_ref: string | null
          provider: string | null
          status: Database["public"]["Enums"]["payment_status"]
          tax: number
          updated_at: string
        }
        Insert: {
          amount: number
          captured_at?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          failed_reason?: string | null
          fees?: number
          gateway_id?: string | null
          gateway_txn_id?: string | null
          id?: string
          method?: string | null
          order_id: string
          payment_ref?: string | null
          provider?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tax?: number
          updated_at?: string
        }
        Update: {
          amount?: number
          captured_at?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          failed_reason?: string | null
          fees?: number
          gateway_id?: string | null
          gateway_txn_id?: string | null
          id?: string
          method?: string | null
          order_id?: string
          payment_ref?: string | null
          provider?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tax?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_gateway_id_fkey"
            columns: ["gateway_id"]
            isOneToOne: false
            referencedRelation: "payment_gateways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
        }
        Relationships: []
      }
      pickup_requests: {
        Row: {
          carrier_id: string | null
          created_at: string
          id: string
          notes: string | null
          pickup_date: string
          reference: string | null
          status: string
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          carrier_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          pickup_date: string
          reference?: string | null
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          carrier_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          pickup_date?: string
          reference?: string | null
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pickup_requests_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "shipping_carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickup_requests_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      product_benefits: {
        Row: {
          benefit_id: string
          product_id: string
        }
        Insert: {
          benefit_id: string
          product_id: string
        }
        Update: {
          benefit_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_benefits_benefit_id_fkey"
            columns: ["benefit_id"]
            isOneToOne: false
            referencedRelation: "benefits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_benefits_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          is_primary: boolean
          position: number
          product_id: string
          url: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          position?: number
          product_id: string
          url: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          position?: number
          product_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_ingredients: {
        Row: {
          ingredient_id: string
          notes: string | null
          product_id: string
        }
        Insert: {
          ingredient_id: string
          notes?: string | null
          product_id: string
        }
        Update: {
          ingredient_id?: string
          notes?: string | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_ingredients_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tag_map: {
        Row: {
          product_id: string
          tag_id: string
        }
        Insert: {
          product_id: string
          tag_id: string
        }
        Update: {
          product_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_tag_map_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_tag_map_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "product_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      product_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          barcode: string | null
          compare_at_price: number | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          position: number
          price: number | null
          product_id: string
          sku: string | null
          updated_at: string
          weight_grams: number | null
        }
        Insert: {
          barcode?: string | null
          compare_at_price?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          position?: number
          price?: number | null
          product_id: string
          sku?: string | null
          updated_at?: string
          weight_grams?: number | null
        }
        Update: {
          barcode?: string | null
          compare_at_price?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          position?: number
          price?: number | null
          product_id?: string
          sku?: string | null
          updated_at?: string
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          brand_id: string | null
          canonical_url: string | null
          category_id: string | null
          compare_at_price: number | null
          cost_price: number | null
          created_at: string
          currency: string
          deleted_at: string | null
          description: string | null
          gst_rate: number
          height_cm: number | null
          id: string
          is_best_seller: boolean
          is_featured: boolean
          is_new_arrival: boolean
          is_trending: boolean
          launch_date: string | null
          length_cm: number | null
          low_stock_threshold: number
          meta_keywords: string | null
          name: string
          price: number
          published_at: string | null
          rating_avg: number
          rating_count: number
          sale_price: number | null
          seo_description: string | null
          seo_title: string | null
          short_description: string | null
          sku: string | null
          slug: string
          status: Database["public"]["Enums"]["product_status"]
          stock: number
          subcategory_id: string | null
          tax_class: string | null
          updated_at: string
          weight_grams: number | null
          width_cm: number | null
        }
        Insert: {
          barcode?: string | null
          brand_id?: string | null
          canonical_url?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string | null
          gst_rate?: number
          height_cm?: number | null
          id?: string
          is_best_seller?: boolean
          is_featured?: boolean
          is_new_arrival?: boolean
          is_trending?: boolean
          launch_date?: string | null
          length_cm?: number | null
          low_stock_threshold?: number
          meta_keywords?: string | null
          name: string
          price?: number
          published_at?: string | null
          rating_avg?: number
          rating_count?: number
          sale_price?: number | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          sku?: string | null
          slug: string
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          subcategory_id?: string | null
          tax_class?: string | null
          updated_at?: string
          weight_grams?: number | null
          width_cm?: number | null
        }
        Update: {
          barcode?: string | null
          brand_id?: string | null
          canonical_url?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string | null
          gst_rate?: number
          height_cm?: number | null
          id?: string
          is_best_seller?: boolean
          is_featured?: boolean
          is_new_arrival?: boolean
          is_trending?: boolean
          launch_date?: string | null
          length_cm?: number | null
          low_stock_threshold?: number
          meta_keywords?: string | null
          name?: string
          price?: number
          published_at?: string | null
          rating_avg?: number
          rating_count?: number
          sale_price?: number | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          sku?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          subcategory_id?: string | null
          tax_class?: string | null
          updated_at?: string
          weight_grams?: number | null
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean
          phone: string | null
          role_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_active?: boolean
          phone?: string | null
          role_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          role_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string
          id: string
          product_variant_id: string
          purchase_order_id: string
          quantity: number
          quantity_received: number
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_variant_id: string
          purchase_order_id: string
          quantity: number
          quantity_received?: number
          unit_cost: number
        }
        Update: {
          created_at?: string
          id?: string
          product_variant_id?: string
          purchase_order_id?: string
          quantity?: number
          quantity_received?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          expected_at: string | null
          id: string
          notes: string | null
          ordered_at: string | null
          po_number: string
          received_at: string | null
          status: string
          supplier_id: string | null
          total: number
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string
          expected_at?: string | null
          id?: string
          notes?: string | null
          ordered_at?: string | null
          po_number: string
          received_at?: string | null
          status?: string
          supplier_id?: string | null
          total?: number
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string
          expected_at?: string | null
          id?: string
          notes?: string | null
          ordered_at?: string | null
          po_number?: string
          received_at?: string | null
          status?: string
          supplier_id?: string | null
          total?: number
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      push_queue: {
        Row: {
          campaign_id: string | null
          created_at: string
          deep_link: string | null
          error: string | null
          id: string
          image_url: string | null
          message: string
          recipient_id: string | null
          scheduled_at: string | null
          sent_at: string | null
          status: string
          title: string
          user_id: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          deep_link?: string | null
          error?: string | null
          id?: string
          image_url?: string | null
          message: string
          recipient_id?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          title: string
          user_id?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          deep_link?: string | null
          error?: string | null
          id?: string
          image_url?: string | null
          message?: string
          recipient_id?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "push_queue_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_queue_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "campaign_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_customer_id: string | null
          referred_email: string | null
          referrer_customer_id: string
          reward_points: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          referred_customer_id?: string | null
          referred_email?: string | null
          referrer_customer_id: string
          reward_points?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          referred_customer_id?: string | null
          referred_email?: string | null
          referrer_customer_id?: string
          reward_points?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_customer_id_fkey"
            columns: ["referred_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_customer_id_fkey"
            columns: ["referrer_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      report_exports: {
        Row: {
          created_at: string
          created_by: string | null
          file_name: string | null
          filters: Json
          format: string
          id: string
          report_type: string
          row_count: number
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          filters?: Json
          format: string
          id?: string
          report_type: string
          row_count?: number
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          filters?: Json
          format?: string
          id?: string
          report_type?: string
          row_count?: number
          status?: string
        }
        Relationships: []
      }
      return_events: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          message: string
          metadata: Json
          return_id: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          metadata?: Json
          return_id: string
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          metadata?: Json
          return_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_events_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "returns"
            referencedColumns: ["id"]
          },
        ]
      }
      return_items: {
        Row: {
          condition: string | null
          created_at: string
          damage_level: string | null
          id: string
          inspection_photos: Json
          inspector_notes: string | null
          name: string
          order_item_id: string | null
          product_id: string | null
          product_variant_id: string | null
          quantity: number
          restock_decision: string | null
          restocked: boolean
          return_id: string
          sku: string | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          condition?: string | null
          created_at?: string
          damage_level?: string | null
          id?: string
          inspection_photos?: Json
          inspector_notes?: string | null
          name: string
          order_item_id?: string | null
          product_id?: string | null
          product_variant_id?: string | null
          quantity: number
          restock_decision?: string | null
          restocked?: boolean
          return_id: string
          sku?: string | null
          unit_price?: number
          updated_at?: string
        }
        Update: {
          condition?: string | null
          created_at?: string
          damage_level?: string | null
          id?: string
          inspection_photos?: Json
          inspector_notes?: string | null
          name?: string
          order_item_id?: string | null
          product_id?: string | null
          product_variant_id?: string | null
          quantity?: number
          restock_decision?: string | null
          restocked?: boolean
          return_id?: string
          sku?: string | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "return_items_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_items_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "return_items_return_id_fkey"
            columns: ["return_id"]
            isOneToOne: false
            referencedRelation: "returns"
            referencedColumns: ["id"]
          },
        ]
      }
      returns: {
        Row: {
          closed_at: string | null
          created_at: string
          customer_id: string | null
          id: string
          inspection_notes: string | null
          inspector_id: string | null
          internal_notes: string | null
          order_id: string
          reason: string
          refund_amount: number
          refund_status: string
          refund_type: string | null
          restock_completed: boolean
          rma_number: string
          status: string
          updated_at: string
          warehouse_id: string | null
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          inspection_notes?: string | null
          inspector_id?: string | null
          internal_notes?: string | null
          order_id: string
          reason?: string
          refund_amount?: number
          refund_status?: string
          refund_type?: string | null
          restock_completed?: boolean
          rma_number: string
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          inspection_notes?: string | null
          inspector_id?: string | null
          internal_notes?: string | null
          order_id?: string
          reason?: string
          refund_amount?: number
          refund_status?: string
          refund_type?: string | null
          restock_completed?: boolean
          rma_number?: string
          status?: string
          updated_at?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "returns_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_inspector_id_fkey"
            columns: ["inspector_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      review_events: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          message: string
          metadata: Json
          review_id: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          metadata?: Json
          review_id: string
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          metadata?: Json
          review_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_events_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_images: {
        Row: {
          created_at: string
          id: string
          review_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          review_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          review_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_images_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string | null
          cons: string | null
          created_at: string
          customer_id: string | null
          deleted_at: string | null
          edited_at: string | null
          id: string
          internal_notes: string | null
          is_featured: boolean
          is_published: boolean
          is_verified: boolean
          moderation_reason: string | null
          moderation_status: string
          moderator_id: string | null
          order_id: string | null
          product_id: string
          pros: string | null
          rating: number
          title: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          cons?: string | null
          created_at?: string
          customer_id?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          internal_notes?: string | null
          is_featured?: boolean
          is_published?: boolean
          is_verified?: boolean
          moderation_reason?: string | null
          moderation_status?: string
          moderator_id?: string | null
          order_id?: string | null
          product_id: string
          pros?: string | null
          rating: number
          title?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          cons?: string | null
          created_at?: string
          customer_id?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          internal_notes?: string | null
          is_featured?: boolean
          is_published?: boolean
          is_verified?: boolean
          moderation_reason?: string | null
          moderation_status?: string
          moderator_id?: string | null
          order_id?: string | null
          product_id?: string
          pros?: string | null
          rating?: number
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_reports: {
        Row: {
          created_at: string
          created_by: string | null
          filters: Json
          id: string
          layout: Json
          name: string
          report_type: string
          updated_at: string
          widget_config: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          filters?: Json
          id?: string
          layout?: Json
          name: string
          report_type: string
          updated_at?: string
          widget_config?: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          filters?: Json
          id?: string
          layout?: Json
          name?: string
          report_type?: string
          updated_at?: string
          widget_config?: Json
        }
        Relationships: []
      }
      scheduled_reports: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          filters: Json
          format: string
          frequency: string
          id: string
          is_enabled: boolean
          last_run_at: string | null
          name: string
          next_run_at: string | null
          report_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          filters?: Json
          format?: string
          frequency: string
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          report_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          filters?: Json
          format?: string
          frequency?: string
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          report_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      settlements: {
        Row: {
          bank_reference: string | null
          created_at: string
          difference: number
          expected_amount: number
          gateway_id: string | null
          id: string
          received_amount: number
          settlement_date: string
          status: string
          synced_at: string | null
          updated_at: string
        }
        Insert: {
          bank_reference?: string | null
          created_at?: string
          difference?: number
          expected_amount?: number
          gateway_id?: string | null
          id?: string
          received_amount?: number
          settlement_date: string
          status?: string
          synced_at?: string | null
          updated_at?: string
        }
        Update: {
          bank_reference?: string | null
          created_at?: string
          difference?: number
          expected_amount?: number
          gateway_id?: string | null
          id?: string
          received_amount?: number
          settlement_date?: string
          status?: string
          synced_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlements_gateway_id_fkey"
            columns: ["gateway_id"]
            isOneToOne: false
            referencedRelation: "payment_gateways"
            referencedColumns: ["id"]
          },
        ]
      }
      shipment_tracking: {
        Row: {
          created_at: string
          event_time: string
          id: string
          location: string | null
          message: string | null
          order_id: string
          raw: Json
          shipment_id: string
          status: string
          status_code: string | null
          tracking_number: string | null
        }
        Insert: {
          created_at?: string
          event_time?: string
          id?: string
          location?: string | null
          message?: string | null
          order_id: string
          raw?: Json
          shipment_id: string
          status: string
          status_code?: string | null
          tracking_number?: string | null
        }
        Update: {
          created_at?: string
          event_time?: string
          id?: string
          location?: string | null
          message?: string | null
          order_id?: string
          raw?: Json
          shipment_id?: string
          status?: string
          status_code?: string | null
          tracking_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipment_tracking_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_tracking_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          awb_number: string | null
          cancelled_at: string | null
          carrier: string | null
          carrier_id: string | null
          created_at: string
          delivered_at: string | null
          dimensions: Json
          estimated_delivery: string | null
          id: string
          label_url: string | null
          manifest_url: string | null
          order_id: string
          pickup_status: string | null
          shipped_at: string | null
          shipping_method_id: string | null
          status: Database["public"]["Enums"]["shipment_status"]
          tracking_number: string | null
          updated_at: string
          warehouse_id: string | null
          weight_grams: number | null
        }
        Insert: {
          awb_number?: string | null
          cancelled_at?: string | null
          carrier?: string | null
          carrier_id?: string | null
          created_at?: string
          delivered_at?: string | null
          dimensions?: Json
          estimated_delivery?: string | null
          id?: string
          label_url?: string | null
          manifest_url?: string | null
          order_id: string
          pickup_status?: string | null
          shipped_at?: string | null
          shipping_method_id?: string | null
          status?: Database["public"]["Enums"]["shipment_status"]
          tracking_number?: string | null
          updated_at?: string
          warehouse_id?: string | null
          weight_grams?: number | null
        }
        Update: {
          awb_number?: string | null
          cancelled_at?: string | null
          carrier?: string | null
          carrier_id?: string | null
          created_at?: string
          delivered_at?: string | null
          dimensions?: Json
          estimated_delivery?: string | null
          id?: string
          label_url?: string | null
          manifest_url?: string | null
          order_id?: string
          pickup_status?: string | null
          shipped_at?: string | null
          shipping_method_id?: string | null
          status?: Database["public"]["Enums"]["shipment_status"]
          tracking_number?: string | null
          updated_at?: string
          warehouse_id?: string | null
          weight_grams?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_carrier_id_fkey"
            columns: ["carrier_id"]
            isOneToOne: false
            referencedRelation: "shipping_carriers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_shipping_method_id_fkey"
            columns: ["shipping_method_id"]
            isOneToOne: false
            referencedRelation: "shipping_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_addresses: {
        Row: {
          city: string
          country: string
          created_at: string
          full_name: string
          id: string
          line1: string
          line2: string | null
          order_id: string
          phone: string | null
          pincode: string
          state: string
        }
        Insert: {
          city: string
          country?: string
          created_at?: string
          full_name: string
          id?: string
          line1: string
          line2?: string | null
          order_id: string
          phone?: string | null
          pincode: string
          state: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          full_name?: string
          id?: string
          line1?: string
          line2?: string | null
          order_id?: string
          phone?: string | null
          pincode?: string
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_addresses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_carriers: {
        Row: {
          api_key_encrypted: string | null
          api_secret_encrypted: string | null
          created_at: string
          deleted_at: string | null
          id: string
          is_active: boolean
          name: string
          provider: string
          sandbox: boolean
          updated_at: string
        }
        Insert: {
          api_key_encrypted?: string | null
          api_secret_encrypted?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          provider: string
          sandbox?: boolean
          updated_at?: string
        }
        Update: {
          api_key_encrypted?: string | null
          api_secret_encrypted?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          provider?: string
          sandbox?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      shipping_methods: {
        Row: {
          base_rate: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          base_rate?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          base_rate?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      shipping_rates: {
        Row: {
          cod_charge: number
          created_at: string
          deleted_at: string | null
          free_shipping_threshold: number | null
          id: string
          is_active: boolean
          name: string
          price: number
          updated_at: string
          weight_max_grams: number | null
          weight_min_grams: number
          zone_id: string
        }
        Insert: {
          cod_charge?: number
          created_at?: string
          deleted_at?: string | null
          free_shipping_threshold?: number | null
          id?: string
          is_active?: boolean
          name: string
          price?: number
          updated_at?: string
          weight_max_grams?: number | null
          weight_min_grams?: number
          zone_id: string
        }
        Update: {
          cod_charge?: number
          created_at?: string
          deleted_at?: string | null
          free_shipping_threshold?: number | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
          weight_max_grams?: number | null
          weight_min_grams?: number
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_rates_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "shipping_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_zones: {
        Row: {
          city: string | null
          country: string
          created_at: string
          deleted_at: string | null
          id: string
          is_active: boolean
          name: string
          postal_from: string | null
          postal_to: string | null
          priority: number
          state: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          country?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          name: string
          postal_from?: string | null
          postal_to?: string | null
          priority?: number
          state?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          country?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          name?: string
          postal_from?: string | null
          postal_to?: string | null
          priority?: number
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          inventory_id: string
          note: string | null
          quantity: number
          reason: string | null
          reference: string | null
          type: Database["public"]["Enums"]["movement_type"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_id: string
          note?: string | null
          quantity: number
          reason?: string | null
          reference?: string | null
          type: Database["public"]["Enums"]["movement_type"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_id?: string
          note?: string | null
          quantity?: number
          reason?: string | null
          reference?: string | null
          type?: Database["public"]["Enums"]["movement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategories: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          position: number
          slug: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          position?: number
          slug: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          position?: number
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_name: string | null
          country: string | null
          created_at: string
          email: string | null
          gstin: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          contact_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          contact_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string
          customer_id: string | null
          id: string
          priority: string
          status: string
          subject: string
          ticket_number: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          priority?: string
          status?: string
          subject: string
          ticket_number: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          priority?: string
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_rates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          rate: number
          region: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          rate?: number
          region?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          rate?: number
          region?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          id: string
          is_published: boolean
          name: string
          position: number
          rating: number
          text: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          name: string
          position?: number
          rating?: number
          text: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          name?: string
          position?: number
          rating?: number
          text?: string
          updated_at?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          sender_id: string | null
          sender_type: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          sender_id?: string | null
          sender_type: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          sender_id?: string | null
          sender_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tracking_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          location: string | null
          message: string | null
          occurred_at: string
          raw: Json
          shipment_id: string
          status: Database["public"]["Enums"]["shipment_status"]
        }
        Insert: {
          created_at?: string
          event_type?: string
          id?: string
          location?: string | null
          message?: string | null
          occurred_at?: string
          raw?: Json
          shipment_id: string
          status: Database["public"]["Enums"]["shipment_status"]
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          location?: string | null
          message?: string | null
          occurred_at?: string
          raw?: Json
          shipment_id?: string
          status?: Database["public"]["Enums"]["shipment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "tracking_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          note: string | null
          occurred_at: string
          reference: string | null
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          note?: string | null
          occurred_at?: string
          reference?: string | null
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          note?: string | null
          occurred_at?: string
          reference?: string | null
          type?: string
        }
        Relationships: []
      }
      vendor_payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          expense_id: string | null
          id: string
          notes: string | null
          paid_at: string | null
          payment_status: string
          reference: string | null
          scheduled_date: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          expense_id?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_status?: string
          reference?: string | null
          scheduled_date?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          expense_id?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_status?: string
          reference?: string | null
          scheduled_date?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_payments_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_payments_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "finance_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          product_category: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          product_category: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          product_category?: string
        }
        Relationships: []
      }
      waitlist_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          product_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_emails_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          address: string | null
          city: string | null
          code: string
          contact_person: string | null
          country: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          phone: string | null
          pincode: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          contact_person?: string | null
          country?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          phone?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          contact_person?: string | null
          country?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          phone?: string | null
          pincode?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_queue: {
        Row: {
          body: string | null
          buttons: Json
          campaign_id: string | null
          created_at: string
          error: string | null
          id: string
          media_url: string | null
          recipient_id: string | null
          scheduled_at: string | null
          sent_at: string | null
          status: string
          template_name: string | null
          to_phone: string
        }
        Insert: {
          body?: string | null
          buttons?: Json
          campaign_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          media_url?: string | null
          recipient_id?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          template_name?: string | null
          to_phone: string
        }
        Update: {
          body?: string | null
          buttons?: Json
          campaign_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          media_url?: string | null
          recipient_id?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          template_name?: string | null
          to_phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_queue_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_queue_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "campaign_recipients"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          product_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_user_permissions: { Args: never; Returns: string[] }
      current_user_role: { Args: never; Returns: string }
      has_role: { Args: { role_name: string }; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_manager: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      log_activity: {
        Args: {
          p_action: string
          p_entity?: string
          p_entity_id?: string
          p_metadata?: Json
        }
        Returns: undefined
      }
      log_audit: {
        Args: {
          p_action: string
          p_new?: Json
          p_old?: Json
          p_record: string
          p_table: string
        }
        Returns: undefined
      }
      owns_customer: { Args: { c: string }; Returns: boolean }
      decrement_order_lines: { Args: { p_lines: Json }; Returns: boolean }
      decrement_stock: {
        Args: { p_variant_id: string; p_quantity: number }
        Returns: boolean
      }
      restore_stock: {
        Args: { p_variant_id: string; p_quantity: number }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      discount_type: "percent" | "fixed"
      movement_type:
        | "in"
        | "out"
        | "adjustment"
        | "transfer"
        | "purchase"
        | "sale"
        | "return"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
        | "returned"
        | "draft"
        | "packed"
        | "completed"
      payment_status:
        | "pending"
        | "authorized"
        | "paid"
        | "failed"
        | "refunded"
        | "partially_refunded"
        | "captured"
        | "cancelled"
        | "voided"
      product_status: "draft" | "active" | "archived" | "coming_soon"
      shipment_status:
        | "pending"
        | "label_created"
        | "in_transit"
        | "out_for_delivery"
        | "delivered"
        | "failed"
        | "returned"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      discount_type: ["percent", "fixed"],
      movement_type: [
        "in",
        "out",
        "adjustment",
        "transfer",
        "purchase",
        "sale",
        "return",
      ],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
        "returned",
        "draft",
        "packed",
        "completed",
      ],
      payment_status: [
        "pending",
        "authorized",
        "paid",
        "failed",
        "refunded",
        "partially_refunded",
        "captured",
        "cancelled",
        "voided",
      ],
      product_status: ["draft", "active", "archived", "coming_soon"],
      shipment_status: [
        "pending",
        "label_created",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "failed",
        "returned",
      ],
    },
  },
} as const

/** App-level aliases for Postgres enums (kept for stable imports). */
export type ProductStatus = Database["public"]["Enums"]["product_status"]
export type OrderStatus = Database["public"]["Enums"]["order_status"]
export type PaymentStatus = Database["public"]["Enums"]["payment_status"]
export type ShipmentStatus = Database["public"]["Enums"]["shipment_status"]
export type MovementType = Database["public"]["Enums"]["movement_type"]

/** Catalog taxonomy status (check constraint, not a Postgres enum). */
export type CatalogStatus = "draft" | "active" | "archived"

/** Purchase order workflow (check constraint, not a Postgres enum). */
export type PoStatus = "draft" | "sent" | "received" | "cancelled"
