-- Fixed Supabase Schema for Gym Management System
-- Execute these queries in your Supabase SQL Editor to fix the column issues

-- 1. Drop and recreate members table with correct structure
DROP TABLE IF EXISTS members CASCADE;

CREATE TABLE members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    age INTEGER NOT NULL,
    height INTEGER NOT NULL, -- in cm
    weight INTEGER NOT NULL, -- in kg
    gender TEXT CHECK (gender IN ('male', 'female')),
    courses TEXT[] DEFAULT '{}', -- Array of course IDs (backward compatibility)
    diet_plans TEXT[] DEFAULT '{}', -- Array of diet plan IDs (must be diet_plans not dietPlans)
    course_groups JSONB DEFAULT '[]'::jsonb, -- New grouped courses (JSONB for complex objects)
    diet_plan_groups JSONB DEFAULT '[]'::jsonb, -- New grouped diet plans (JSONB for complex objects)
    subscription_start TIMESTAMPTZ,
    subscription_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ensure courses table exists
CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ensure diet_plans table exists (note: diet_plans not dietPlans)
CREATE TABLE IF NOT EXISTS diet_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Ensure products table exists
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Ensure sales table exists
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    buyer_name TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_members_name ON members(name);
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);
CREATE INDEX IF NOT EXISTS idx_members_subscription_end ON members(subscription_end);
CREATE INDEX IF NOT EXISTS idx_courses_name ON courses(name);
CREATE INDEX IF NOT EXISTS idx_diet_plans_name ON diet_plans(name);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id);

-- 7. Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_members_updated_at ON members;
DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
DROP TRIGGER IF EXISTS update_diet_plans_updated_at ON diet_plans;
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_sales_updated_at ON sales;

-- Create triggers
CREATE TRIGGER update_members_updated_at
    BEFORE UPDATE ON members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diet_plans_updated_at
    BEFORE UPDATE ON diet_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Enable Row Level Security (optional - uncomment if needed)
-- ALTER TABLE members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- 9. Create policies for public access (adjust as needed for your security requirements)
-- CREATE POLICY "Enable all operations for authenticated users" ON members FOR ALL USING (true);
-- CREATE POLICY "Enable all operations for authenticated users" ON courses FOR ALL USING (true);
-- CREATE POLICY "Enable all operations for authenticated users" ON diet_plans FOR ALL USING (true);
-- CREATE POLICY "Enable all operations for authenticated users" ON products FOR ALL USING (true);
-- CREATE POLICY "Enable all operations for authenticated users" ON sales FOR ALL USING (true);

-- 10. Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

-- Confirmation message
SELECT 'Schema setup completed successfully! All tables created with correct column names.' as status;
