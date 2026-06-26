-- ==========================================
-- WHEYO STUDENT MENU TEMPLATE
-- Affordable • Filling • High Protein
-- ==========================================

INSERT INTO public.student_menu
(
    code,
    name,
    description,
    price,
    protein,
    calories,
    carbs,
    fat,
    category,
    is_veg,
    tags,
    is_available,
    ingredients,
    protein_source
)
VALUES
(
    'S-001',                                          -- Unique Code
    'Menu Item Name',                                 -- Display Name
    'Short, appetizing description highlighting taste, value, and protein.',
    149,                                              -- Price (₹)
    28,                                               -- Protein (g)
    420,                                              -- Calories
    38,                                               -- Carbs (g)
    12,                                               -- Fat (g)
    'Rice Bowls',                                     -- Category
    FALSE,                                            -- TRUE for Vegetarian
    ARRAY[
        'S-001',
        'HIGH-PROTEIN',
        'BESTSELLER'
    ],
    TRUE,                                             -- Available
    'Chicken Breast, Brown Rice, Onion, Bell Pepper, Greek Yogurt',
    'Chicken Breast'
);
-- ===========================================================
-- WHEYO PROFFESIONAL MENU ITEM TEMPLATE
-- Copy this block and replace the placeholder values.
-- ===========================================================

INSERT INTO public.proff_menu
(
    code,
    name,
    description,
    price,
    protein,
    calories,
    carbs,
    fat,
    category,
    is_veg,
    tags,
    is_available,
    ingredients,
    protein_source
)
VALUES
(
    'P-001',                                       -- Unique Code
    'Menu Item Name',                              -- Display Name
    'Premium description of the dish highlighting taste, quality, and nutrition.',
    299,                                           -- Price (₹)
    35,                                            -- Protein (g)
    450,                                           -- Calories
    40,                                            -- Carbs (g)
    12,                                            -- Fat (g)
    'Rice Bowls',                                  -- Category
    FALSE,                                         -- TRUE for Vegetarian
    ARRAY[
        'P-001',
        'HIGH-PROTEIN',
        'BESTSELLER'
    ],
    TRUE,
    'Chicken Breast, Brown Rice, Broccoli, Carrot, Greek Yogurt',
    'Chicken Breast'
);

-- ===========================================================
-- WHEYO ELITE MENU ITEM TEMPLATE
-- ===========================================================

INSERT INTO public.proff_menu
(
    code,
    name,
    description,
    price,
    protein,
    calories,
    carbs,
    fat,
    category,
    is_veg,
    tags,
    is_available,
    ingredients,
    protein_source
)
VALUES
(
    'P-001',                                       -- Unique Code
    'Menu Item Name',                              -- Display Name
    'Premium description of the dish highlighting taste, quality, and nutrition.',
    299,                                           -- Price (₹)
    35,                                            -- Protein (g)
    450,                                           -- Calories
    40,                                            -- Carbs (g)
    12,                                            -- Fat (g)
    'Rice Bowls',                                  -- Category
    FALSE,                                         -- TRUE for Vegetarian
    ARRAY[
        'P-001',
        'HIGH-PROTEIN',
        'BESTSELLER'
    ],
    TRUE,
    'Chicken Breast, Brown Rice, Broccoli, Carrot, Greek Yogurt',
    'Chicken Breast'
);