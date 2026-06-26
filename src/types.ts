export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          daily_protein_goal: number
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          daily_protein_goal?: number
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          daily_protein_goal?: number
          created_at?: string
        }
      }
      daily_macros: {
        Row: {
          id: string
          user_id: string
          date: string
          protein_consumed: number
        }
        Insert: {
          id?: string
          user_id: string
          date?: string
          protein_consumed?: number
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          protein_consumed?: number
        }
      }
      products: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
          price: number
          protein: number
          calories: number
          carbs: number
          fat: number
          image_url: string | null
          category: string
          is_veg: boolean
          tags: string[]
          is_available: boolean
          ingredients: string | null
          protein_source: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          description?: string | null
          price: number
          protein: number
          calories: number
          carbs?: number
          fat?: number
          image_url?: string | null
          category?: string
          is_veg?: boolean
          tags?: string[]
          is_available?: boolean
          ingredients?: string | null
          protein_source?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          description?: string | null
          price?: number
          protein?: number
          calories?: number
          carbs?: number
          fat?: number
          image_url?: string | null
          category?: string
          is_veg?: boolean
          tags?: string[]
          is_available?: boolean
          ingredients?: string | null
          protein_source?: string | null
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: number
          user_id: string | null
          customer_name: string
          customer_phone: string
          pickup_point: string
          items: Json
          total_price: number
          discount_amount: number
          final_price: number
          status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
          created_at: string
        }
        Insert: {
          id?: number
          user_id?: string | null
          customer_name: string
          customer_phone: string
          pickup_point: string
          items: Json
          total_price: number
          discount_amount?: number
          final_price: number
          status?: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: string | null
          customer_name?: string
          customer_phone?: string
          pickup_point?: string
          items?: Json
          total_price?: number
          discount_amount?: number
          final_price?: number
          status?: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
          created_at?: string
        }
      }
      coupons: {
        Row: {
          id: string
          code: string
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          min_order_value: number
          times_used: number
          max_uses: number | null
          expires_at: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          min_order_value?: number
          times_used?: number
          max_uses?: number | null
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          discount_type?: 'percentage' | 'fixed'
          discount_value?: number
          min_order_value?: number
          times_used?: number
          max_uses?: number | null
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      subscription_plans: {
        Row: {
          id: number
          code: string
          name: string
          description: string | null
          price: number
          frequency: string
          items: string[] | null
          is_available: boolean
          is_popular: boolean | null
          created_at: string
        }
        Insert: {
          id?: number
          code: string
          name: string
          description?: string | null
          price?: number
          frequency?: string
          items?: string[] | null
          is_available?: boolean
          is_popular?: boolean | null
          created_at?: string
        }
        Update: {
          id?: number
          code?: string
          name?: string
          description?: string | null
          price?: number
          frequency?: string
          items?: string[] | null
          is_available?: boolean
          is_popular?: boolean | null
          created_at?: string
        }
      }
      subscription_addons: {
        Row: {
          id: number
          code: string
          name: string
          description: string | null
          price: number
          stock: number
          category: string
          is_available: boolean
          created_at: string
        }
        Insert: {
          id?: number
          code: string
          name: string
          description?: string | null
          price?: number
          stock?: number
          category?: string
          is_available?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          code?: string
          name?: string
          description?: string | null
          price?: number
          stock?: number
          category?: string
          is_available?: boolean
          created_at?: string
        }
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: number
          status: string
          delivery_day: string | null
          pickup_point: string
          next_billing_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: number
          status?: string
          delivery_day?: string | null
          pickup_point?: string
          next_billing_date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: number
          status?: string
          delivery_day?: string | null
          pickup_point?: string
          next_billing_date?: string
          created_at?: string
        }
      }
    }
  }
}

export type Order = Database['public']['Tables']['orders']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type DailyMacro = Database['public']['Tables']['daily_macros']['Row'];
export type Coupon = Database['public']['Tables']['coupons']['Row'];
export type SubscriptionPlan = Database['public']['Tables']['subscription_plans']['Row'];
export type UserSubscription = Database['public']['Tables']['user_subscriptions']['Row'];
export type SubscriptionAddon = Database['public']['Tables']['subscription_addons']['Row'];

export type OfferCategory = 'loyalty_milestone' | 'streak_bonus' | 'custom_promo' | 'seasonal_drop';
export type RewardType = 'percentage_discount' | 'flat_discount' | 'free_gift' | 'badge_unlock';

export interface WheyoOffer {
  id: string;
  title: string;
  description: string;
  category: OfferCategory;
  reward: RewardType;
  reward_value: number | null;
  free_gift_name: string | null;
  
  // Targets & Trigger Rules
  min_order_value: number;
  required_milestone_orders: number | null;
  required_streak_days: number | null;
  
  // Schedule and Status
  is_active: boolean;
  is_revealed: boolean;
  start_date: string;
  end_date: string | null;
  
  created_at: string;
  updated_at: string;
}

