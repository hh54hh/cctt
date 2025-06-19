-- نفذ هذه الأوامر في Supabase SQL Editor لحل مشكلة المزامنة
-- Execute these commands in Supabase SQL Editor to fix sync issues

-- 1. إزالة الجدول الحالي إذا كان به مشاكل (احذر: هذا سيحذف البيانات الموجودة!)
-- Remove current table if it has issues (Warning: this will delete existing data!)
DROP TABLE IF EXISTS members CASCADE;

-- 2. إنشاء جدول الأعضاء بالتنسيق الصحيح
-- Create members table with correct format
CREATE TABLE members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    age INTEGER NOT NULL,
    height INTEGER NOT NULL,
    weight INTEGER NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female')),
    courses TEXT DEFAULT '[]',
    diet_plans TEXT DEFAULT '[]',
    course_groups JSONB DEFAULT '[]',
    diet_plan_groups JSONB DEFAULT '[]',
    subscription_start TIMESTAMPTZ,
    subscription_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. التأكد من وجود الجداول الأخرى
-- Ensure other tables exist
CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS diet_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    buyer_name TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. منح الصلاحيات اللازمة
-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

-- 5. رسالة تأكيد
-- Confirmation message
SELECT 'تم إنشاء المخطط بنجاح! يمكن الآن استخدام المزامنة الإجبارية.' as message;
