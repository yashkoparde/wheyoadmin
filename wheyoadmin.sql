-- Wheyo Admin Database Schema
-- Created to recreate the entire database structure, tables, and RLS policies.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

-- Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    phone text,
    daily_protein_goal numeric DEFAULT 150,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Admins Table (Mapping user IDs to admin status)
CREATE TABLE IF NOT EXISTS public.admins (
    user_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    price numeric NOT NULL,
    protein numeric NOT NULL,
    calories numeric NOT NULL,
    carbs numeric DEFAULT 0,
    fat numeric DEFAULT 0,
    image_url text,
    category text DEFAULT 'Main'::text,
    is_veg bool DEFAULT false,
    tags text[] DEFAULT '{}'::text[],
    is_available bool DEFAULT true,
    ingredients text,
    protein_source text,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Daily Macros Table
CREATE TABLE IF NOT EXISTS public.daily_macros (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date date NOT NULL DEFAULT CURRENT_DATE,
    protein_consumed numeric DEFAULT 0
);

-- Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id int8 NOT NULL PRIMARY KEY, -- Using int8 as per schema (possibly external ID)
    customer_name text NOT NULL,
    customer_phone text NOT NULL,
    pickup_point text NOT NULL,
    items jsonb NOT NULL,
    total_price numeric NOT NULL,
    discount_amount numeric DEFAULT 0,
    final_price numeric NOT NULL,
    status text DEFAULT 'pending'::text,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    user_id uuid REFERENCES auth.users(id)
);

-- Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    discount_type text NOT NULL,
    discount_value numeric NOT NULL,
    min_order_value numeric DEFAULT 0,
    times_used int4 DEFAULT 0,
    max_uses int4 DEFAULT NULL,
    expires_at timestamptz,
    is_active bool DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- 3. ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_macros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.reset_orders_sequence()
RETURNS void AS $$
DECLARE
  seq_name text;
  max_id int8;
BEGIN
  -- Find the sequence associated with the orders.id column
  seq_name := pg_get_serial_sequence('orders', 'id');
  
  -- Fallback if pg_get_serial_sequence returns null
  IF seq_name IS NULL THEN
    seq_name := 'public.orders_id_seq';
  END IF;
  
  -- If a sequence exists, find the max id and reset the sequence
  IF seq_name IS NOT NULL THEN
    SELECT MAX(id) INTO max_id FROM public.orders;
    
    IF max_id IS NULL THEN
      -- If table is empty, reset sequence back to 1
      PERFORM setval(seq_name, 1, false);
    ELSE
      -- Set the sequence to the current max id. The next insert will get max_id + 1
      PERFORM setval(seq_name, max_id, true);
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. POLICIES

-- Admins Policies
CREATE POLICY "Allow select for authenticated users" ON public.admins
    FOR SELECT TO authenticated USING (true);

-- Products Policies
CREATE POLICY "Public Read" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Admin Full Access" ON public.products
    FOR ALL TO authenticated
    USING (
        (auth.jwt() ->> 'email'::text) = 'yashkoparde2022@gmail.com'::text OR
        EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
    )
    WITH CHECK (
        (auth.jwt() ->> 'email'::text) = 'yashkoparde2022@gmail.com'::text OR
        EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
    );

-- Daily Macros Policies
CREATE POLICY "Users can view own macros" ON public.daily_macros
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own macros" ON public.daily_macros
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own macros" ON public.daily_macros
    FOR UPDATE USING (auth.uid() = user_id);

-- Coupons Policies
CREATE POLICY "Public can read active coupons" ON public.coupons
    FOR SELECT USING (is_active = true);

-- Note: Updated based on your schema's specific email-based admin check
CREATE POLICY "Admin full access" ON public.coupons
    FOR ALL USING (
        (auth.jwt() ->> 'email'::text) = 'yashkoparde2022@gmail.com'::text OR
        EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
    )
    WITH CHECK (
        (auth.jwt() ->> 'email'::text) = 'yashkoparde2022@gmail.com'::text OR
        EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
    );

-- Profiles Policies (Standard recommendation based on app structure)
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Orders Policies (Standard recommendation based on app structure)
CREATE POLICY "Users can insert own orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin full orders access" ON public.orders
    FOR ALL TO authenticated
    USING (
        (auth.jwt() ->> 'email'::text) = 'yashkoparde2022@gmail.com'::text OR
        EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
    )
    WITH CHECK (
        (auth.jwt() ->> 'email'::text) = 'yashkoparde2022@gmail.com'::text OR
        EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
    );

-- 5. SUBSCRIPTION MODULE
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    price numeric NOT NULL,
    frequency text NOT NULL DEFAULT 'weekly',
    sub_items text[] DEFAULT '{}'::text[],
    is_active bool DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    plan_id uuid NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
    user_email text NOT NULL,
    user_name text NOT NULL,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
    next_billing_date date NOT NULL,
    preferred_locker_id text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Plan Policies
CREATE POLICY "Public select active plans" ON public.subscription_plans
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admin full plans access" ON public.subscription_plans
    FOR ALL USING (
        (auth.jwt() ->> 'email'::text) = 'yashkoparde2022@gmail.com'::text OR
        EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
    )
    WITH CHECK (
        (auth.jwt() ->> 'email'::text) = 'yashkoparde2022@gmail.com'::text OR
        EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
    );

-- Subscription Policies
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id OR (auth.jwt() ->> 'email'::text) = user_email);

CREATE POLICY "Admin full user_subscriptions access" ON public.user_subscriptions
    FOR ALL USING (
        (auth.jwt() ->> 'email'::text) = 'yashkoparde2022@gmail.com'::text OR
        EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
    )
    WITH CHECK (
        (auth.jwt() ->> 'email'::text) = 'yashkoparde2022@gmail.com'::text OR
        EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
    );


-- 6. INDIAN HIGH-PROTEIN MEALS AND AFFORDABLE SUBSCRIPTION SEED COMMANDS
-- Run these in your Supabase SQL Editor to seed the new Indian-origin menu items & affordable plans!

-- Clear old products & plans if desired (optional)
-- DELETE FROM public.products WHERE code LIKE 'IND-%';
-- DELETE FROM public.subscription_plans WHERE name IN ('Desi Runner Starter', 'Fit India Daily Prep', 'Active Swadeshi Athlete Pack', 'Monthly Desi Block Saver', 'Swadeshi Hypertrophy Overdrive');

-- A. Insert Indian High-Protein Meals
INSERT INTO public.products (code, name, description, price, protein, calories, carbs, fat, category, is_veg, tags, is_available, ingredients, protein_source)
VALUES
('IND-VEG-01', 'Paneer Bhurji Power Meal', 'Spiced scrambled fresh cottage cheese cooked with bell peppers, tomatoes, and aromatic Indian spices. High in casein protein.', 249, 32, 480, 18, 30, 'Main', true, ARRAY['high-casein', 'veg', 'keto-friendly'], true, 'Fresh Paneer, Onions, Tomatoes, Capsicum, Ginger-Garlic paste, Turmeric, Cumin, Kasuri Methi', 'Fresh Cottage Cheese (Paneer)'),

('IND-CHICK-02', 'Tandoori Chicken Tikka Prep', 'Juicy lean chicken breast cubes marinated in spiced yogurt and grilled to perfection. Served with herbed basmati rice and mint dip.', 289, 45, 520, 35, 12, 'Main', false, ARRAY['lean-gains', 'high-protein', 'low-fat'], true, 'Lean Chicken Breast, Skimmed Yogurt, Mustard Oil, Kashmiri Red Chili, Garam Masala, Basmati Rice', 'Grilled Chicken Breast'),

('IND-SOYA-03', 'High-Protein Soya Chunks Masala', 'Textured soya nuggets cooked in a rich, homestyle onion-tomato gravy. Served with steamed brown rice.', 199, 35, 420, 48, 8, 'Main', true, ARRAY['vegan', 'high-fiber', 'plant-protein'], true, 'Defatted Soya Chunks, Brown Rice, Onion, Tomatoes, Coriander, Garam Masala, Cloves', 'Soya Soy Protein'),

('IND-EGG-04', 'Egg Bhurji & Multigrain Flatbread', 'A traditional dhaba-style scramble of 4 egg whites and 1 whole egg, paired with 2 high-fiber multigrain rotis.', 179, 28, 390, 28, 14, 'Main', false, ARRAY['egg', 'dhaba-style', 'lean'], true, 'Egg Whites, Whole Egg, Multigrain Flour (Atta), Green Chilies, Coriander, Turmeric', 'Farm Eggs'),

('IND-FISH-05', 'Achaari Fish Tikka Prep', 'Boneless fish fillet cubes coated in a spicy pickle marinade and oven-baked. Served with lemon-spiced quinoa.', 329, 42, 460, 22, 15, 'Main', false, ARRAY['fish', 'omega-3', 'gourmet'], true, 'Basa/Surmai Fillet, Pickle Spices (Achaar Masala), Lemon Juice, Quinoa, Bell Peppers', 'Lean White Fish'),

('IND-VEG-06', 'Moong Dal Protein Khichdi', 'A comforting, easily digestible classic Indian lentil and rice porridge upgraded with plant-protein isolates and pure cow ghee.', 189, 25, 380, 45, 9, 'Main', true, ARRAY['comfort-food', 'easy-digestion', 'veg'], true, 'Yellow Moong Dal, Basmati Rice, Pea Protein Isolate, Ghee, Cumin, Hing, Ginger', 'Lentils & Pea Protein'),

('IND-CHICK-07', 'High-Protein Butter Chicken Prep', 'Lean boneless chicken breast cooked in a healthy low-fat tomato-cashew gravy with minimal butter. Served with high-protein brown basmati rice.', 299, 44, 540, 32, 14, 'Main', false, ARRAY['high-protein', 'chicken', 'low-carb'], true, 'Chicken Breast, Kashmiri Chilli, Ginger, Low-Fat Cashew Paste, Honey, Brown Rice, Spices', 'Skinless Chicken Breast'),

('IND-TOFU-08', 'Spicy Tandoori Tofu Tikka', 'Premium extra firm organic tofu cubes marinated in authentic Indian tandoori spices and baked. Serves as an exceptional dairy-free protein boost.', 219, 26, 360, 15, 12, 'Main', true, ARRAY['vegan', 'tofu', 'dairy-free'], true, 'Organic Soy Tofu, Lemon Juice, Mustard Oil, Coriander, Tandoori Masala Blend, Mint Salad', 'Soy Tofu Protein'),

('IND-PEANUT-09', 'Peanut Butter Protein Oats', 'Powerhouse muscle breakfast! High-fiber rolled oats slow-cooked with real creamy peanut butter, premium whey protein isolate, crushed roasted peanuts, and chia seeds.', 159, 24, 420, 38, 16, 'Breakfast', true, ARRAY['peanuts', 'whey-protein', 'high-fiber'], true, 'Rolled Oats, Organic Creamy Peanut Butter, Whey Protein Isolate, Chia Seeds, Roasted Peanuts', 'Whey Isolate & Roasted Peanuts'),

('IND-SOYA-10', 'Spicy Soya Keema Rice', 'Finely minced high-protein defatted soya granules stir-fried with green peas, mint, and whole spices. Served hot over steaming basmati rice.', 189, 34, 410, 42, 10, 'Main', true, ARRAY['high-protein', 'soya', 'vegan'], true, 'Soya Granules, Green Peas, Onion, Tomato Curry Paste, Mint, Basmati Rice, Ginger-Garlic', 'Soya Beans Protein'),

('IND-EGG-11', 'Spicy Egg White Curry & Rice', 'Four perfectly boiled farm egg whites cooked in a nutritious and light homestyle curry base, garnished with a crunchy roasted peanuts crumble. Served with basmati rice.', 199, 30, 380, 26, 12, 'Main', false, ARRAY['eggs', 'low-fat', 'peanuts'], true, 'Boiled Egg Whites, Onion Gravy, Roasted Peanut Powder, Ginger, Green Chillies, Basmati Rice', 'Boiled Egg Whites')
ON CONFLICT DO NOTHING;

-- B. Insert Affordable Indian-Origin Subscription Plans
INSERT INTO public.subscription_plans (name, price, billing_cycle, description, is_popular)
VALUES
('Desi Runner Starter', 699.00, 'weekly', 'Indian performance breakfast/snack starter. 5x delicious high-protein Indian items (like Soya Bhurji, Sprouted Peanut Salat, or Steamed Egg White cups) hand-delivered directly to your specified gym drop point.', false),

('Fit India Daily Prep', 1399.00, 'weekly', 'Daily single premium high-protein Indian meal prep (like Tandoori Chicken Tikka, Egg Curry, or Szechuan Tofu with Peanut glaze) hand-delivered daily to your designated gym reception drop point.', true),

('Active Swadeshi Athlete Pack', 2499.00, 'weekly', '2x high-protein homestyle Indian preps daily featuring lean chicken breast, whole eggs, tofu, and high-protein soya chunks. Perfect for athlete lunch & dinner combinations with a complimentary whey shake.', false),

('Monthly Desi Block Saver', 4999.00, 'monthly', 'Prearranged monthly block saver. 22x single high-protein meal preps (featuring Chicken Keema, Paneer/Tofu Bhurji, Soya Chunks Curry, and Egg whites) hand-delivered on your precise training days.', false),

('Swadeshi Hypertrophy Overdrive', 8999.00, 'monthly', 'The ultimate unlimited athlete fueling membership. Fast, customized fresh hand-deliveries (2x daily preps showcasing high-protein eggs, chicken, tofu, peanuts, and soya + whey isolate booster drops) directly to any gym partner.', true)
ON CONFLICT DO NOTHING;
