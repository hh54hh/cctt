-- Supabase Schema for Gym Management System
-- Execute these queries in your Supabase SQL Editor

-- Enable Row Level Security (RLS) for better security
-- You can adjust these policies based on your authentication needs

-- 1. Members Table
CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    age INTEGER NOT NULL,
    height INTEGER NOT NULL, -- in cm
    weight INTEGER NOT NULL, -- in kg
    gender TEXT CHECK (gender IN ('male', 'female')),
    courses TEXT[] DEFAULT '{}', -- Array of course IDs (backward compatibility)
    diet_plans TEXT[] DEFAULT '{}', -- Array of diet plan IDs (backward compatibility)
    course_groups JSONB DEFAULT '[]', -- New grouped courses
    diet_plan_groups JSONB DEFAULT '[]', -- New grouped diet plans
    subscription_start TIMESTAMPTZ,
    subscription_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Diet Plans Table
CREATE TABLE IF NOT EXISTS diet_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Products Table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Sales Table
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    buyer_name TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- 6. Sync Status Table (for tracking sync operations)
CREATE TABLE IF NOT EXISTS sync_status (
    id TEXT PRIMARY KEY,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')) NOT NULL,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    synced BOOLEAN DEFAULT FALSE,
    error TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_members_name ON members(name);
CREATE INDEX IF NOT EXISTS idx_members_created_at ON members(created_at);
CREATE INDEX IF NOT EXISTS idx_members_subscription_end ON members(subscription_end);

CREATE INDEX IF NOT EXISTS idx_courses_name ON courses(name);
CREATE INDEX IF NOT EXISTS idx_diet_plans_name ON diet_plans(name);

CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_quantity ON products(quantity);

CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_buyer_name ON sales(buyer_name);

CREATE INDEX IF NOT EXISTS idx_sync_status_synced ON sync_status(synced);
CREATE INDEX IF NOT EXISTS idx_sync_status_table_name ON sync_status(table_name);

-- Enable Row Level Security (Optional - uncomment if you want to use authentication)
-- ALTER TABLE members ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sync_status ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (Optional - uncomment if using auth)
-- CREATE POLICY "Enable all operations for authenticated users" ON members FOR ALL USING (auth.role() = 'authenticated');
-- CREATE POLICY "Enable all operations for authenticated users" ON courses FOR ALL USING (auth.role() = 'authenticated');
-- CREATE POLICY "Enable all operations for authenticated users" ON diet_plans FOR ALL USING (auth.role() = 'authenticated');
-- CREATE POLICY "Enable all operations for authenticated users" ON products FOR ALL USING (auth.role() = 'authenticated');
-- CREATE POLICY "Enable all operations for authenticated users" ON sales FOR ALL USING (auth.role() = 'authenticated');
-- CREATE POLICY "Enable all operations for authenticated users" ON sync_status FOR ALL USING (auth.role() = 'authenticated');

-- OR for public access (if you don't use authentication):
-- CREATE POLICY "Enable all operations for anon users" ON members FOR ALL USING (auth.role() = 'anon');
-- CREATE POLICY "Enable all operations for anon users" ON courses FOR ALL USING (auth.role() = 'anon');
-- CREATE POLICY "Enable all operations for anon users" ON diet_plans FOR ALL USING (auth.role() = 'anon');
-- CREATE POLICY "Enable all operations for anon users" ON products FOR ALL USING (auth.role() = 'anon');
-- CREATE POLICY "Enable all operations for anon users" ON sales FOR ALL USING (auth.role() = 'anon');
-- CREATE POLICY "Enable all operations for anon users" ON sync_status FOR ALL USING (auth.role() = 'anon');

-- Sample data (optional)
INSERT INTO courses (id, name) VALUES 
    ('1', 'تمارين كمال الأجسام المبتدئين'),
    ('2', 'تمارين القوة والتحمل'),
    ('3', 'تمارين اللياقة البدنية'),
    ('4', 'تمارين اليوغا والإطالة'),
    ('5', 'تمارين الكارديو المكثفة')
ON CONFLICT (id) DO NOTHING;

INSERT INTO diet_plans (id, name) VALUES 
    ('1', 'نظام غذائي لزيادة الكتلة العضلية'),
    ('2', 'نظام غذائي لحرق الدهون'),
    ('3', 'نظام غذائي متوازن'),
    ('4', 'نظام غذائي نباتي'),
    ('5', 'نظام غذائي للرياضيين')
ON CONFLICT (id) DO NOTHING;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_diet_plans_updated_at BEFORE UPDATE ON diet_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
